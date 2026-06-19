/**
 * RequestServiceImpl.java
 *
 * Core business logic implementation for the Request Service.
 *
 * Responsibilities:
 * - Allows students to submit stationery requests (status: PENDING)
 * - Allows admins to approve requests (triggers stock deduction via Feign)
 * - Allows admins to reject requests with a mandatory reason
 * - Allows admins to mark approved requests as fulfilled (physically dispensed)
 * - Records all actions in an immutable audit log
 * - Provides paginated access to requests by role
 *
 * Request Lifecycle:
 *   PENDING → APPROVED (stock deducted) → FULFILLED (items dispensed)
 *   PENDING → REJECTED (reason recorded, no stock change)
 *
 * Resilience:
 * The approveRequest method is protected by a Resilience4j Circuit Breaker
 * on the Feign call to inventory-service. If inventory-service is down,
 * the fallback method throws a meaningful error rather than hanging.
 *
 * Architecture:
 * Implements {@link RequestService}. Communicates with inventory-service
 * via {@link InventoryClient} (OpenFeign). Writes to two MySQL collections:
 *   - stationery_request.requests
 *   - stationery_request.audit_logs
 */
package com.stationery.request.service.impl;

import com.stationery.request.client.InventoryClient;
import com.stationery.request.dto.RequestItemDto;
import com.stationery.request.dto.RequestSubmissionDto;
import com.stationery.request.dto.RequestResponseDto;
import com.stationery.request.entity.AuditLog;
import com.stationery.request.entity.RequestItem;
import com.stationery.request.entity.RequestStatus;
import com.stationery.request.entity.StationeryRequest;
import com.stationery.request.exception.ResourceNotFoundException;
import com.stationery.request.exception.BusinessException;
import com.stationery.request.repository.AuditLogRepository;
import com.stationery.request.repository.RequestRepository;
import com.stationery.request.service.NotificationService;
import com.stationery.request.service.RequestService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

/**
 * Implementation of the RequestService interface.
 *
 * Manages the full request lifecycle from student submission through
 * admin approval/rejection to final fulfillment. All state transitions
 * are validated to enforce the defined lifecycle (e.g., only PENDING
 * requests can be approved or rejected).
 */
@Service
@Slf4j
@Transactional
public class RequestServiceImpl implements RequestService {

    private final RequestRepository requestRepository;
    private final AuditLogRepository auditLogRepository;
    private final InventoryClient inventoryClient;
    private final NotificationService notificationService;

    public RequestServiceImpl(RequestRepository requestRepository,
                               AuditLogRepository auditLogRepository,
                               InventoryClient inventoryClient,
                               NotificationService notificationService) {
        this.requestRepository = requestRepository;
        this.auditLogRepository = auditLogRepository;
        this.inventoryClient = inventoryClient;
        this.notificationService = notificationService;
    }

    /**
     * Submits a new stationery request on behalf of a student.
     *
     * The request is created with PENDING status. No stock is reserved
     * or deducted at this point — stock is only deducted upon approval.
     * This prevents stock being locked for requests that may be rejected.
     *
     * @param studentEmail Email of the submitting student (extracted from JWT)
     * @param dto          List of requested items and quantities
     * @return Created request with generated ID and PENDING status
     */
    @Override
    public RequestResponseDto submitRequest(String studentEmail, RequestSubmissionDto dto) {
        StationeryRequest request = new StationeryRequest();
        request.setStudentEmail(studentEmail);

        for (RequestItemDto itemDto : dto.getItems()) {
            RequestItem item = new RequestItem();
            item.setItemId(itemDto.getItemId());
            item.setQuantity(itemDto.getQuantity());
            request.addItem(item);
        }

        StationeryRequest saved = requestRepository.save(request);
        logAction("SUBMIT", studentEmail, "Submitted request " + saved.getRequestId());
        log.info("Request submitted successfully by {}", studentEmail);
        return mapToDto(saved);
    }

    /**
     * Approves a PENDING request and deducts stock from inventory.
     *
     * Stock deduction is performed via a synchronous Feign call to inventory-service
     * for each item in the request. The admin's JWT token is forwarded in the
     * Authorization header so inventory-service can verify admin access.
     *
     * Protected by a Circuit Breaker: if inventory-service is unavailable or
     * repeatedly failing, the circuit opens and the fallback method is invoked
     * immediately, preventing cascading failures.
     *
     * Business Rule: Only PENDING requests can be approved.
     * Business Rule: Stock is deducted at approval time, not at submission time.
     *
     * @param requestId  ID of the request to approve
     * @param adminEmail Email of the approving admin (from JWT)
     * @param token      Raw Authorization header value (forwarded to inventory-service)
     * @return Updated request with APPROVED status
     */
    @Override
    @CircuitBreaker(name = "inventoryService", fallbackMethod = "approveRequestFallback")
    public RequestResponseDto approveRequest(Long requestId, String adminEmail, String token) {
        StationeryRequest request = getRequestById(requestId);

        // Enforce lifecycle: only PENDING requests can transition to APPROVED
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be approved.");
        }

        // Deduct inventory for each requested item via Feign Client
        // The admin JWT is forwarded so inventory-service can authorize the deduction
        for (RequestItem item : request.getItems()) {
            try {
                inventoryClient.deductQuantity(token, item.getItemId(), item.getQuantity());
            } catch (feign.FeignException.NotFound e) {
                throw new BusinessException("Item not found in inventory (ID: " + item.getItemId() + ")");
            } catch (feign.FeignException.BadRequest e) {
                throw new BusinessException("Insufficient stock or invalid request for item (ID: " + item.getItemId() + ")");
            }
        }

        request.setStatus(RequestStatus.APPROVED);
        StationeryRequest saved = requestRepository.save(request);
        logAction("APPROVE", adminEmail, "Approved request " + requestId);
        log.info("Request {} approved by {}", requestId, adminEmail);
        notificationService.sendApprovalNotification(request.getStudentEmail(), requestId);
        return mapToDto(saved);
    }

    /**
     * Circuit Breaker fallback for approveRequest.
     *
     * Invoked when the inventory-service Feign call fails repeatedly or times out.
     * Throws a descriptive error to inform the admin that approval is temporarily unavailable.
     * Stock is NOT deducted and request status remains PENDING.
     *
     * @param requestId  Request being approved
     * @param adminEmail Admin email
     * @param token      JWT token
     * @param t          The exception that triggered the fallback
     */
    public RequestResponseDto approveRequestFallback(Long requestId, String adminEmail, String token, Throwable t) {
        if (t instanceof BusinessException) {
            throw (BusinessException) t;
        }
        log.error("Circuit Breaker open for request {}: {}", requestId, t.getMessage());
        throw new RuntimeException(
            "Inventory Service is currently unavailable. Cannot approve request at this time. Circuit Breaker open."
        );
    }

    /**
     * Rejects a PENDING request with a mandatory reason.
     *
     * No stock changes are made on rejection.
     * The rejection reason is stored on the request for student visibility.
     *
     * Business Rule: Only PENDING requests can be rejected.
     *
     * @param requestId  ID of the request to reject
     * @param adminEmail Email of the rejecting admin (from JWT)
     * @param reason     Mandatory human-readable reason for rejection
     * @return Updated request with REJECTED status and stored reason
     */
    @Override
    public RequestResponseDto rejectRequest(Long requestId, String adminEmail, String reason) {
        StationeryRequest request = getRequestById(requestId);

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new IllegalStateException("Only PENDING requests can be rejected.");
        }

        request.setStatus(RequestStatus.REJECTED);
        request.setRejectionReason(reason);
        StationeryRequest saved = requestRepository.save(request);
        logAction("REJECT", adminEmail, "Rejected request " + requestId + ". Reason: " + reason);
        log.info("Request {} rejected by {}", requestId, adminEmail);
        notificationService.sendRejectionNotification(request.getStudentEmail(), requestId, reason);
        return mapToDto(saved);
    }

    /**
     * Marks an APPROVED request as FULFILLED.
     *
     * Fulfillment represents the physical dispensing of items to the student.
     * Stock has already been deducted at approval time, so no further
     * inventory changes are made here.
     *
     * Business Rule: Only APPROVED requests can be fulfilled.
     *
     * @param requestId  ID of the approved request
     * @param adminEmail Email of the admin marking fulfillment
     * @return Updated request with FULFILLED status
     */
    @Override
    public RequestResponseDto fulfillRequest(Long requestId, String adminEmail) {
        StationeryRequest request = getRequestById(requestId);

        if (request.getStatus() != RequestStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED requests can be fulfilled.");
        }

        request.setStatus(RequestStatus.FULFILLED);
        StationeryRequest saved = requestRepository.save(request);
        logAction("FULFILL", adminEmail, "Fulfilled request " + requestId);
        log.info("Request {} fulfilled by {}", requestId, adminEmail);
        return mapToDto(saved);
    }

    /**
     * Returns a paginated list of requests submitted by a specific student.
     * Sorted by creation date descending (most recent first).
     *
     * @param studentEmail Student's email (from JWT)
     * @param page         Zero-based page index
     * @param size         Items per page
     * @return Paginated page of the student's requests
     */
    @Override
    public Page<RequestResponseDto> getStudentRequests(String studentEmail, RequestStatus status, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        if (status != null) {
            return requestRepository.findByStudentEmailAndStatus(studentEmail, status, pageable).map(this::mapToDto);
        }
        return requestRepository.findByStudentEmail(studentEmail, pageable).map(this::mapToDto);
    }

    /**
     * Returns a paginated list of all requests across all students.
     * Sorted by creation date descending (most recent first).
     * Only accessible by admins.
     *
     * @param page Zero-based page index
     * @param size Items per page
     * @return Paginated page of all requests
     */
    @Override
    public Page<RequestResponseDto> getAllRequests(RequestStatus status, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        if (status != null) {
            return requestRepository.findByStatus(status, pageable).map(this::mapToDto);
        }
        return requestRepository.findAll(pageable).map(this::mapToDto);
    }

    // -------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------

    /** Retrieves a request by ID or throws if not found. */
    private StationeryRequest getRequestById(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
    }

    /**
     * Writes an immutable audit log entry for every significant action.
     *
     * Audit logs capture WHO did WHAT and WHEN for compliance and traceability.
     * Actions include: SUBMIT, APPROVE, REJECT, FULFILL.
     */
    private void logAction(String action, String performedBy, String details) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    /**
     * Maps a StationeryRequest entity to a RequestResponseDto for API responses.
     * Converts embedded RequestItem objects to RequestItemDto objects.
     */
    private RequestResponseDto mapToDto(StationeryRequest entity) {
        RequestResponseDto dto = new RequestResponseDto();
        dto.setRequestId(entity.getRequestId());
        dto.setStudentEmail(entity.getStudentEmail());
        dto.setStatus(entity.getStatus());
        dto.setRejectionReason(entity.getRejectionReason());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setItems(entity.getItems().stream().map(i -> {
            RequestItemDto iDto = new RequestItemDto();
            iDto.setItemId(i.getItemId());
            iDto.setQuantity(i.getQuantity());
            return iDto;
        }).collect(Collectors.toList()));
        return dto;
    }
}



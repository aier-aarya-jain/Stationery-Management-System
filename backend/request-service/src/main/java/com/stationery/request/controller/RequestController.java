/**
 * RequestController.java — REST Controller for Request Management
 *
 * Exposes HTTP endpoints for the stationery request lifecycle.
 * All endpoints are JWT-protected and role-restricted.
 *
 * Base URL: /api/requests
 *
 * Request Lifecycle:
 *   POST /api/requests          (Student submits)
 *   POST /{id}/approve          (Admin approves → stock deducted)
 *   POST /{id}/reject           (Admin rejects with reason)
 *   POST /{id}/fulfill          (Admin marks as dispensed)
 *
 * Role Summary:
 * - ROLE_STUDENT : Submit and view own requests only
 * - ROLE_ADMIN   : View all requests, approve, reject, fulfill
 *
 * Architecture:
 * Delegates all business logic to RequestService.
 * The admin's JWT Authorization header is forwarded to RequestService
 * during approval to enable the internal Feign call to inventory-service.
 */
package com.stationery.request.controller;

import com.stationery.request.dto.RequestSubmissionDto;
import com.stationery.request.dto.RequestResponseDto;
import com.stationery.request.service.RequestService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller managing the stationery request lifecycle.
 *
 * Authentication.getName() extracts the student or admin email from the
 * validated JWT token, which is used as the principal identifier
 * for business operations and audit logging.
 */
@RestController
@RequestMapping("/api/requests")
@Slf4j
public class RequestController {

    private final RequestService requestService;

    public RequestController(RequestService requestService) {
        this.requestService = requestService;
    }

    /**
     * POST /api/requests
     *
     * Submits a new stationery request for admin review.
     * Request is created with PENDING status. No stock is deducted at this point.
     *
     * Access: ROLE_STUDENT only
     * Request Body: { items: [{ itemId, quantity }] }
     * Response: 201 Created with the new request details
     *
     * @param dto  Validated list of requested items
     * @param auth Spring Security authentication context (provides student email)
     * @return 201 with created RequestResponseDto
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<RequestResponseDto> submitRequest(
            @Valid @RequestBody RequestSubmissionDto dto, Authentication auth) {
        log.info("Received request submission from student: {}", auth.getName());
        return new ResponseEntity<>(requestService.submitRequest(auth.getName(), dto), HttpStatus.CREATED);
    }

    /**
     * GET /api/requests/me
     *
     * Returns the authenticated student's own request history (paginated).
     * Students cannot access other students' requests.
     *
     * Access: ROLE_STUDENT only
     * Response: 200 OK with paginated request list
     *
     * @param page Page index (0-based, default 0)
     * @param size Items per page (default 10)
     * @param auth Authentication context (provides student email)
     * @return 200 with paginated RequestResponseDto page
     */
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    public ResponseEntity<Page<RequestResponseDto>> getMyRequests(
            @RequestParam(required = false) com.stationery.request.entity.RequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication auth) {
        return ResponseEntity.ok(requestService.getStudentRequests(auth.getName(), status, page, size, sortBy, sortDir));
    }

    /**
     * GET /api/requests
     *
     * Returns all student requests across the system (paginated).
     * Used by the Admin Requests management page.
     *
     * Access: ROLE_ADMIN only
     *
     * @param page Page index (0-based, default 0)
     * @param size Items per page (default 10)
     * @return 200 with paginated RequestResponseDto page
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<RequestResponseDto>> getAllRequests(
            @RequestParam(required = false) com.stationery.request.entity.RequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(requestService.getAllRequests(status, page, size, sortBy, sortDir));
    }

    /**
     * POST /api/requests/{id}/approve
     *
     * Approves a PENDING request and triggers stock deduction via Feign.
     *
     * The Authorization header is forwarded to RequestService so it can
     * be passed to inventory-service's deduct endpoint, which requires
     * admin authentication.
     *
     * Access: ROLE_ADMIN only
     * Response: 200 OK with updated request (status: APPROVED)
     *
     * @param id    Request ID to approve
     * @param auth  Authentication context (provides admin email for audit)
     * @param token Raw Authorization header (e.g., "Bearer eyJ...") forwarded to inventory-service
     * @return 200 with updated RequestResponseDto
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RequestResponseDto> approveRequest(
            @PathVariable Long id,
            Authentication auth,
            @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(requestService.approveRequest(id, auth.getName(), token));
    }

    /**
     * POST /api/requests/{id}/reject
     *
     * Rejects a PENDING request with a mandatory reason.
     * No stock changes are made on rejection.
     *
     * Access: ROLE_ADMIN only
     * Query Param: reason (required) — human-readable rejection reason
     * Response: 200 OK with updated request (status: REJECTED)
     *
     * @param id     Request ID to reject
     * @param reason Mandatory rejection reason stored on the request
     * @param auth   Authentication context (provides admin email for audit)
     * @return 200 with updated RequestResponseDto
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RequestResponseDto> rejectRequest(
            @PathVariable Long id,
            @RequestParam String reason,
            Authentication auth) {
        return ResponseEntity.ok(requestService.rejectRequest(id, auth.getName(), reason));
    }

    @PostMapping("/{id}/items/{itemId}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RequestResponseDto> approveItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            Authentication auth,
            @RequestHeader("Authorization") String token) {
        return ResponseEntity.ok(requestService.approveItem(id, itemId, auth.getName(), token));
    }

    @PostMapping("/{id}/items/{itemId}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RequestResponseDto> rejectItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @RequestParam String reason,
            Authentication auth) {
        return ResponseEntity.ok(requestService.rejectItem(id, itemId, auth.getName(), reason));
    }

    /**
     * POST /api/requests/{id}/fulfill
     *
     * Marks an APPROVED request as FULFILLED (items physically dispensed).
     * Stock was already deducted at approval time; no further inventory changes.
     *
     * Access: ROLE_ADMIN only
     * Response: 200 OK with updated request (status: FULFILLED)
     *
     * @param id   Request ID to fulfill
     * @param auth Authentication context (provides admin email for audit)
     * @return 200 with updated RequestResponseDto
     */
    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<RequestResponseDto> fulfillRequest(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(requestService.fulfillRequest(id, auth.getName()));
    }

    @GetMapping("/logs")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<java.util.List<com.stationery.request.dto.RequestAuditLogDto>> getLogs() {
        return ResponseEntity.ok(requestService.getAuditLogs());
    }
}


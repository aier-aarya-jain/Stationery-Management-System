package com.stationery.request.service;

import com.stationery.request.dto.RequestSubmissionDto;
import com.stationery.request.dto.RequestResponseDto;
import com.stationery.request.entity.RequestStatus;
import org.springframework.data.domain.Page;

public interface RequestService {
    RequestResponseDto submitRequest(String studentEmail, RequestSubmissionDto dto);
    RequestResponseDto approveRequest(Long requestId, String adminEmail, String token);
    RequestResponseDto rejectRequest(Long requestId, String adminEmail, String reason);
    RequestResponseDto fulfillRequest(Long requestId, String adminEmail);
    Page<RequestResponseDto> getStudentRequests(String studentEmail, RequestStatus status, int page, int size, String sortBy, String sortDir);
    Page<RequestResponseDto> getAllRequests(RequestStatus status, int page, int size, String sortBy, String sortDir);

    RequestResponseDto approveItem(Long requestId, Long itemId, String adminEmail, String token);
    RequestResponseDto rejectItem(Long requestId, Long itemId, String adminEmail, String reason);

    java.util.List<com.stationery.request.dto.RequestAuditLogDto> getAuditLogs();
}

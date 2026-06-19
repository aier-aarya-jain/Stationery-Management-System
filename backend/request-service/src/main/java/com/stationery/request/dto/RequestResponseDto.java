package com.stationery.request.dto;
import com.stationery.request.entity.RequestStatus;
import java.time.LocalDateTime;
import java.util.List;

public class RequestResponseDto {
    private Long requestId;
    private String studentEmail;
    private RequestStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private List<RequestItemDto> items;

    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public List<RequestItemDto> getItems() { return items; }
    public void setItems(List<RequestItemDto> items) { this.items = items; }
}


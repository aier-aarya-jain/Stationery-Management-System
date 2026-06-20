package com.stationery.request.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RequestAuditLogDto {
    private Long logId;
    private String action;
    private String performedBy;
    private String details;
    private LocalDateTime timestamp;
}

package com.stationery.auth.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuthAuditLogDto {
    private Long id;
    private String action;
    private String email;
    private String details;
    private LocalDateTime createdAt;
}

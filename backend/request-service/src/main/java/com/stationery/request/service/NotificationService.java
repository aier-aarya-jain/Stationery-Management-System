package com.stationery.request.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    public void sendApprovalNotification(String email, Long requestId) {
        log.info("Sending email to {}: Your request {} has been approved.", email, requestId);
    }

    public void sendRejectionNotification(String email, Long requestId, String reason) {
        log.info("Sending email to {}: Your request {} has been rejected. Reason: {}", email, requestId, reason);
    }
}

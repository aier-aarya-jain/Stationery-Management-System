package com.stationery.request.service.impl;

import com.stationery.request.client.InventoryClient;
import com.stationery.request.dto.RequestItemDto;
import com.stationery.request.dto.RequestSubmissionDto;
import com.stationery.request.dto.RequestResponseDto;
import com.stationery.request.entity.RequestItem;
import com.stationery.request.entity.RequestStatus;
import com.stationery.request.entity.StationeryRequest;
import com.stationery.request.entity.AuditLog;
import com.stationery.request.repository.AuditLogRepository;
import com.stationery.request.repository.RequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RequestServiceImplTest {

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private InventoryClient inventoryClient;

    @InjectMocks
    private RequestServiceImpl requestService;

    private StationeryRequest request;
    private RequestSubmissionDto submissionDto;

    @BeforeEach
    void setUp() {
        request = new StationeryRequest();
        request.setRequestId(1L);
        request.setStudentEmail("student@test.com");
        request.setStatus(RequestStatus.PENDING);
        
        RequestItem item = new RequestItem();
        item.setItemId(10L);
        item.setQuantity(5);
        request.addItem(item);

        submissionDto = new RequestSubmissionDto();
        RequestItemDto itemDto = new RequestItemDto();
        itemDto.setItemId(10L);
        itemDto.setQuantity(5);
        submissionDto.setItems(Collections.singletonList(itemDto));
    }

    @Test
    void submitRequest_Successful() {
        when(requestRepository.save(any(StationeryRequest.class))).thenReturn(request);

        RequestResponseDto response = requestService.submitRequest("student@test.com", submissionDto);

        assertNotNull(response);
        assertEquals(RequestStatus.PENDING, response.getStatus());
        verify(requestRepository, times(1)).save(any(StationeryRequest.class));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void approveRequest_Successful() {
        when(requestRepository.findById(anyLong())).thenReturn(Optional.of(request));
        when(requestRepository.save(any(StationeryRequest.class))).thenReturn(request);

        RequestResponseDto response = requestService.approveRequest(1L, "admin@test.com", "mockToken");

        assertEquals(RequestStatus.APPROVED, response.getStatus());
        verify(inventoryClient, times(1)).deductQuantity(eq("mockToken"), eq(10L), eq(5));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void approveRequest_StatusNotPending_ThrowsException() {
        request.setStatus(RequestStatus.APPROVED);
        when(requestRepository.findById(anyLong())).thenReturn(Optional.of(request));

        assertThrows(IllegalStateException.class, () -> requestService.approveRequest(1L, "admin@test.com", "mockToken"));
        verify(inventoryClient, never()).deductQuantity(anyString(), anyLong(), anyInt());
    }
}

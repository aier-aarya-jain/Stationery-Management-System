package com.stationery.inventory.service.impl;

import com.stationery.inventory.dto.StationeryItemDto;
import com.stationery.inventory.entity.StationeryItem;
import com.stationery.inventory.exception.ResourceNotFoundException;
import com.stationery.inventory.repository.InventoryAuditLogRepository;
import com.stationery.inventory.repository.StationeryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Test class for InventoryServiceImpl.
 * Tests inventory operations like adding items, retrieving items, and deducting quantity.
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
public class InventoryServiceImplTest {

    @Mock
    private StationeryItemRepository repository;

    @Mock
    private InventoryAuditLogRepository auditLogRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private StationeryItem item;
    private StationeryItemDto dto;

    @BeforeEach
    // Set up mock data before each test
    void setUp() {
        item = new StationeryItem();
        item.setId(1L);
        item.setName("Pen");
        item.setCategory("Writing");
        item.setUnit("Box");
        item.setAvailableQuantity(100);
        item.setMinimumQuantity(10);

        dto = new StationeryItemDto();
        dto.setName("Pen");
        dto.setCategory("Writing");
        dto.setUnit("Box");
        dto.setAvailableQuantity(100);
        dto.setMinimumQuantity(10);
    }

    @Test
    // Test successful addition of a new stationery item
    void addItem_Successful() {
        when(repository.save(any(StationeryItem.class))).thenReturn(item);

        StationeryItemDto result = inventoryService.addItem(dto, "admin@test.com");

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Pen", result.getName());
        verify(repository, times(1)).save(any(StationeryItem.class));
    }

    @Test
    // Test successful retrieval of an item by its ID
    void getItemById_Successful() {
        when(repository.findById(anyLong())).thenReturn(Optional.of(item));

        StationeryItemDto result = inventoryService.getItemById(1L);

        assertNotNull(result);
        assertEquals("Pen", result.getName());
    }

    @Test
    // Test exception handling when item ID is not found
    void getItemById_ItemNotFound_ThrowsException() {
        when(repository.findById(anyLong())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> inventoryService.getItemById(1L));
    }

    @Test
    // Test successful deduction of item quantity
    void deductQuantity_Successful() {
        when(repository.findById(anyLong())).thenReturn(Optional.of(item));

        inventoryService.deductQuantity(1L, 10, "admin@test.com");

        assertEquals(90, item.getAvailableQuantity());
        verify(repository, times(1)).save(item);
    }

    @Test
    // Test exception handling when deducting quantity exceeds available stock
    void deductQuantity_InsufficientStock_ThrowsException() {
        when(repository.findById(anyLong())).thenReturn(Optional.of(item));

        assertThrows(IllegalArgumentException.class, () -> inventoryService.deductQuantity(1L, 110, "admin@test.com"));
        verify(repository, never()).save(any(StationeryItem.class));
    }
}

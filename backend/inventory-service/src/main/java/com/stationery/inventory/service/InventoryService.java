package com.stationery.inventory.service;

import com.stationery.inventory.dto.StationeryItemDto;
import org.springframework.data.domain.Page;

public interface InventoryService {
    StationeryItemDto addItem(StationeryItemDto dto, String adminEmail);
    StationeryItemDto updateItem(Long id, StationeryItemDto dto, String adminEmail);
    void deleteItem(Long id, String adminEmail);
    StationeryItemDto getItemById(Long id);
    Page<StationeryItemDto> getAllItems(int page, int size, String sortBy, String username, boolean isStudent);
    Page<StationeryItemDto> getLowStockItems(int page, int size);
    void deductQuantity(Long id, Integer quantityToDeduct, String adminEmail);
    java.util.List<com.stationery.inventory.dto.InventoryAuditLogDto> getAuditLogs();
}


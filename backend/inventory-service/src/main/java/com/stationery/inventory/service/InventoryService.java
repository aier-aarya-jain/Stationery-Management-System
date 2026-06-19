package com.stationery.inventory.service;

import com.stationery.inventory.dto.StationeryItemDto;
import org.springframework.data.domain.Page;

public interface InventoryService {
    StationeryItemDto addItem(StationeryItemDto dto);
    StationeryItemDto updateItem(Long id, StationeryItemDto dto);
    void deleteItem(Long id);
    StationeryItemDto getItemById(Long id);
    Page<StationeryItemDto> getAllItems(int page, int size, String sortBy);
    Page<StationeryItemDto> getLowStockItems(int page, int size);
    void deductQuantity(Long id, Integer quantityToDeduct);
}


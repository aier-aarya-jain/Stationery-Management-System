/**
 * InventoryServiceImpl.java
 *
 * Core business logic implementation for the Inventory Service.
 *
 * Responsibilities:
 * - Full CRUD operations on stationery items stored in MySQL
 * - Paginated retrieval with configurable sorting
 * - Low-stock detection (items where availableQuantity ≤ minimumQuantity)
 * - Stock deduction triggered by the Request Service on approval
 *
 * Architecture:
 * Implements {@link InventoryService}. Called by InventoryController for
 * HTTP-triggered operations and by InventoryClient (Feign) from request-service
 * for internal stock deduction during request approval.
 *
 * Database: stationery_inventory (MySQL table: stationery_items)
 */
package com.stationery.inventory.service.impl;

import com.stationery.inventory.dto.StationeryItemDto;
import com.stationery.inventory.entity.StationeryItem;
import com.stationery.inventory.exception.ResourceNotFoundException;
import com.stationery.inventory.repository.StationeryItemRepository;
import com.stationery.inventory.service.InventoryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;

/**
 * Implementation of the InventoryService interface.
 *
 * Encapsulates all inventory business rules including stock management,
 * low-stock threshold checks, and quantity deduction logic used during
 * request approval workflows.
 */
@Service
@Slf4j
@Transactional
public class InventoryServiceImpl implements InventoryService {

    private final StationeryItemRepository repository;

    public InventoryServiceImpl(StationeryItemRepository repository) {
        this.repository = repository;
    }

    /**
     * Adds a new stationery item to the inventory.
     *
     * @param dto Item details including name, category, unit, and quantities
     * @return Persisted item with generated ID and timestamps
     */
    @Override
    public StationeryItemDto addItem(StationeryItemDto dto) {
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException("An item with this name already exists.");
        }
        StationeryItem item = mapToEntity(dto);
        StationeryItem saved = repository.save(item);
        log.info("Item added successfully: {}", saved.getName());
        return mapToDto(saved);
    }

    /**
     * Updates an existing stationery item by ID.
     *
     * All mutable fields (name, category, unit, quantities) are replaced.
     * The updatedAt timestamp is refreshed automatically.
     *
     * @param id  ID of the item to update
     * @param dto New values to apply
     * @return Updated item DTO
     * @throws ResourceNotFoundException if no item exists with the given ID
     */
    @Override
    public StationeryItemDto updateItem(Long id, StationeryItemDto dto) {
        StationeryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        repository.findByNameIgnoreCase(dto.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Another item with this name already exists.");
            }
        });

        item.setName(dto.getName());
        item.setCategory(dto.getCategory());
        item.setUnit(dto.getUnit());
        item.setAvailableQuantity(dto.getAvailableQuantity());
        item.setMinimumQuantity(dto.getMinimumQuantity());
        item.setUpdatedAt(LocalDateTime.now());

        log.info("Item updated successfully with id: {}", id);
        return mapToDto(repository.save(item));
    }

    /**
     * Deletes a stationery item permanently from the inventory.
     *
     * Business Rule: Deletion is permanent. No soft-delete is applied.
     * Admins should verify no pending requests reference this item before deletion.
     *
     * @param id ID
     * @throws ResourceNotFoundException if no item exists with the given ID
     */
    @Override
    public void deleteItem(Long id) {
        if (!repository.existsById(id)) {
            log.error("Failed to delete. Item not found with id: {}", id);
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }
        repository.deleteById(id);
        log.info("Item deleted successfully with id: {}", id);
    }

    /**
     * Retrieves a single item by its ID.
     *
     * @param id ID
     * @return Item DTO
     * @throws ResourceNotFoundException if no item exists with the given ID
     */
    @Override
    public StationeryItemDto getItemById(Long id) {
        StationeryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        return mapToDto(item);
    }

    /**
     * Returns a paginated, sorted list of all inventory items.
     *
     * @param page   Zero-based page index
     * @param size   Number of items per page
     * @param sortBy Field name to sort by (e.g., "name", "category")
     * @return Paginated page of item DTOs
     */
    @Override
    public Page<StationeryItemDto> getAllItems(int page, int size, String sortBy) {
        return repository.findAll(PageRequest.of(page, size, Sort.by(sortBy))).map(this::mapToDto);
    }

    /**
     * Returns items where availableQuantity is at or below the minimumQuantity threshold.
     *
     * Used by the admin Low Stock Alerts page and for operational monitoring.
     * The custom query is defined in {@link StationeryItemRepository}.
     *
     * @param page Zero-based page index
     * @param size Number of items per page
     * @return Paginated page of low-stock item DTOs
     */
    @Override
    public Page<StationeryItemDto> getLowStockItems(int page, int size) {
        return repository.findLowStockItems(PageRequest.of(page, size)).map(this::mapToDto);
    }

    /**
     * Deducts a specified quantity from an item's available stock.
     *
     * Called internally by the Request Service (via Feign) when a student
     * request is approved by an admin. Stock is deducted at approval time,
     * not at submission time — this prevents reserving stock for requests
     * that may ultimately be rejected.
     *
     * Business Rule: If available stock is less than the requested quantity,
     * the deduction is rejected to prevent negative inventory.
     *
     * @param id               ID of the item
     * @param quantityToDeduct Amount to subtract from availableQuantity
     * @throws ResourceNotFoundException  if the item does not exist
     * @throws IllegalArgumentException   if stock is insufficient
     */
    @Override
    public void deductQuantity(Long id, Integer quantityToDeduct) {
        StationeryItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));

        // Guard against over-deduction — stock cannot go negative
        if (item.getAvailableQuantity() < quantityToDeduct) {
            log.error("Insufficient stock for item: {}. Available: {}, Requested: {}", item.getName(), item.getAvailableQuantity(), quantityToDeduct);
            throw new IllegalArgumentException("Insufficient stock for item: " + item.getName());
        }

        item.setAvailableQuantity(item.getAvailableQuantity() - quantityToDeduct);
        repository.save(item);
        log.info("Deducted quantity {} for item id: {}", quantityToDeduct, id);
    }

    // -------------------------------------------------------
    // Private mapping helpers — isolate entity/DTO concerns
    // -------------------------------------------------------

    /**
     * Maps a DTO to a new StationeryItem entity for persistence.
     * ID and timestamps are intentionally omitted (set by MySQL and @PrePersist).
     */
    private StationeryItem mapToEntity(StationeryItemDto dto) {
        StationeryItem item = new StationeryItem();
        item.setName(dto.getName());
        item.setCategory(dto.getCategory());
        item.setUnit(dto.getUnit());
        item.setAvailableQuantity(dto.getAvailableQuantity());
        item.setMinimumQuantity(dto.getMinimumQuantity());
        return item;
    }

    /**
     * Maps a StationeryItem entity to a DTO for API responses.
     * Includes all fields including ID and timestamps.
     */
    private StationeryItemDto mapToDto(StationeryItem entity) {
        StationeryItemDto dto = new StationeryItemDto();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCategory(entity.getCategory());
        dto.setUnit(entity.getUnit());
        dto.setAvailableQuantity(entity.getAvailableQuantity());
        dto.setMinimumQuantity(entity.getMinimumQuantity());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}



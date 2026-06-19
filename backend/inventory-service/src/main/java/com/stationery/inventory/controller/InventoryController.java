/**
 * InventoryController.java — REST Controller for Inventory Management
 *
 * Exposes HTTP endpoints for managing stationery inventory items.
 * All endpoints are protected by JWT and role-based access control.
 *
 * Base URL: /api/inventory
 *
 * Role Summary:
 * - ROLE_ADMIN  : Full access (read, add, update, delete, deduct, low-stock)
 * - ROLE_STUDENT: Read-only access (browse items only)
 *
 * Architecture:
 * Delegates all business logic to InventoryService.
 * Accessed via the API Gateway at http://localhost:8085/inventory/...
 */
package com.stationery.inventory.controller;

import com.stationery.inventory.dto.StationeryItemDto;
import com.stationery.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller exposing all inventory management operations.
 *
 * Enforces role-based access via @PreAuthorize annotations.
 * Students can only browse; admins have full management capability.
 */
@RestController
@RequestMapping("/api/inventory")
@Slf4j
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * GET /api/inventory
     *
     * Returns a paginated, sorted list of all stationery items.
     *
     * Access: ROLE_ADMIN, ROLE_STUDENT
     * Note: Students receive the full item data but the frontend
     *       intentionally hides quantity numbers from the student UI.
     *
     * @param page   Page index (0-based, default 0)
     * @param size   Items per page (default 10)
     * @param sortBy Field to sort by (default "name")
     * @return 200 OK with paginated StationeryItemDto list
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_STUDENT')")
    public ResponseEntity<Page<StationeryItemDto>> getAllItems(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "name") String sortBy) {
        log.info("Fetching all items. Page: {}, Size: {}, SortBy: {}", page, size, sortBy);
        return ResponseEntity.ok(inventoryService.getAllItems(page, size, sortBy));
    }

    /**
     * POST /api/inventory
     *
     * Creates a new stationery item in the inventory.
     *
     * Access: ROLE_ADMIN only
     * Request Body: StationeryItemDto (name, category, unit, availableQuantity, minimumQuantity)
     * Response: 201 Created with the persisted item including generated ID
     *
     * @param dto Validated item details
     * @return 201 with the created StationeryItemDto
     */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<StationeryItemDto> addItem(@Valid @RequestBody StationeryItemDto dto) {
        return new ResponseEntity<>(inventoryService.addItem(dto), HttpStatus.CREATED);
    }

    /**
     * PUT /api/inventory/{id}
     *
     * Updates all fields of an existing stationery item.
     *
     * Access: ROLE_ADMIN only
     * Request Body: StationeryItemDto with updated values
     * Response: 200 OK with the updated item
     *
     * @param id  ID of the item
     * @param dto Updated item values
     * @return 200 with the updated StationeryItemDto
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<StationeryItemDto> updateItem(@PathVariable("id") Long id, @Valid @RequestBody StationeryItemDto dto) {
        return ResponseEntity.ok(inventoryService.updateItem(id, dto));
    }

    /**
     * DELETE /api/inventory/{id}
     *
     * Permanently removes a stationery item from inventory.
     *
     * Access: ROLE_ADMIN only
     * Response: 204 No Content on success
     *
     * @param id ID of the item to delete
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteItem(@PathVariable("id") Long id) {
        inventoryService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/inventory/low-stock
     *
     * Returns items where availableQuantity is at or below minimumQuantity.
     * Used by the Admin Low Stock Alerts page.
     *
     * Access: ROLE_ADMIN only
     *
     * @param page Page index (0-based)
     * @param size Items per page
     * @return 200 OK with paginated low-stock items
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Page<StationeryItemDto>> getLowStockItems(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        return ResponseEntity.ok(inventoryService.getLowStockItems(page, size));
    }

    /**
     * POST /api/inventory/{id}/deduct
     *
     * Deducts a quantity from an item's available stock.
     * Called internally by the Request Service (via Feign Client) when a
     * student request is approved — not directly by the frontend.
     *
     * Access: ROLE_ADMIN only
     * Note: The request-service passes its own admin JWT when calling this endpoint.
     *
     * @param id       ID of the item
     * @param quantity Amount to deduct from availableQuantity
     * @return 200 OK on success
     */
    @PostMapping("/{id}/deduct")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deductQuantity(@PathVariable("id") Long id, @RequestParam("quantity") Integer quantity) {
        inventoryService.deductQuantity(id, quantity);
        return ResponseEntity.ok().build();
    }
}



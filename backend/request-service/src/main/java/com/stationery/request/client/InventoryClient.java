/**
 * InventoryClient.java — Feign Client for Inventory Service Communication
 *
 * Declares the inter-service HTTP contract between request-service and inventory-service.
 * Used exclusively during the request approval workflow to deduct stock.
 *
 * Architecture:
 * OpenFeign uses the Eureka service registry to resolve "inventory-service"
 * to the actual running container's network address at runtime.
 * No hardcoded URLs — service discovery handles routing.
 *
 * Resilience:
 * This client is wrapped by a Resilience4j Circuit Breaker in RequestServiceImpl.
 * If this call fails repeatedly, the circuit opens and the fallback is triggered.
 *
 * Security:
 * The admin's original JWT Authorization header is forwarded with each call.
 * inventory-service validates this token and enforces ROLE_ADMIN access on /deduct.
 */
package com.stationery.request.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * Feign-based HTTP client for inventory-service.
 *
 * Provides a type-safe, declarative interface for calling inventory endpoints.
 * Spring Cloud OpenFeign generates the HTTP client implementation at runtime
 * based on the annotations defined here.
 */
@FeignClient(name = "inventory-service")
public interface InventoryClient {

    /**
     * Calls POST /api/inventory/{id}/deduct on inventory-service.
     *
     * Deducts the specified quantity from the inventory item's available stock.
     * Called once per item in a request during the approval process.
     *
     * The Authorization header must contain the admin's valid JWT so that
     * inventory-service can authorize the deduction (requires ROLE_ADMIN).
     *
     * @param token    Admin JWT token (e.g., "Bearer eyJ...")
     * @param id       ID of the inventory item
     * @param quantity Number of units to deduct from availableQuantity
     */
    @PostMapping("/api/inventory/{id}/deduct")
    void deductQuantity(
            @RequestHeader("Authorization") String token,
            @PathVariable("id") Long id,
            @RequestParam("quantity") Integer quantity
    );
}



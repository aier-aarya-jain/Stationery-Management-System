package com.stationery.inventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main entry point for the Inventory Service.
 * 
 * Manages all operations related to stationery items including CRUD 
 * functionality, stock tracking, and providing item details to other 
 * services via API endpoints. Registers with Eureka for service discovery.
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableJpaAuditing
public class InventoryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(InventoryServiceApplication.class, args);
    }
}

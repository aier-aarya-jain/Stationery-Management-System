package com.stationery.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Main entry point for the API Gateway.
 * 
 * Routes all incoming external requests from the React frontend 
 * to the appropriate internal microservices (Auth, Inventory, Request).
 * Acts as the single entry point, handling CORS and routing using 
 * Spring Cloud Gateway and Eureka Service Discovery.
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}

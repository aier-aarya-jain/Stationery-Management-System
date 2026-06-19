package com.stationery.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main entry point for the Authentication Service.
 * 
 * Manages user identities, registration, login, and JWT generation.
 * Acts as the centralized security authority for the microservices ecosystem.
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableJpaAuditing
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}

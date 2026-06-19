package com.stationery.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

/**
 * Main entry point for the Eureka Service Registry.
 * 
 * This service acts as a discovery server for all other microservices
 * in the Stationery Management System, allowing them to find and communicate
 * with each other dynamically without hardcoded hostnames or ports.
 */
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}

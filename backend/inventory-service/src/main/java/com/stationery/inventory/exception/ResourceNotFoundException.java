package com.stationery.inventory.exception;

/**
 * Exception thrown when a requested stationery item cannot be found in the database.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

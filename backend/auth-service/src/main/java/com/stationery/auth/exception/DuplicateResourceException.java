package com.stationery.auth.exception;

/**
 * Exception thrown when attempting to create a resource that already exists 
 * (e.g., registering an email that is already taken).
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}

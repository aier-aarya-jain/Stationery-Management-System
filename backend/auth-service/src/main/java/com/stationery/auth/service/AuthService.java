package com.stationery.auth.service;

import com.stationery.auth.dto.AuthRequest;
import com.stationery.auth.dto.AuthResponse;
import com.stationery.auth.dto.RegisterRequest;

/**
 * Business logic interface for authentication operations.
 */
public interface AuthService {
    
    /**
     * Registers a new user after verifying email uniqueness.
     * 
     * @param request The registration details
     * @return AuthResponse containing JWT token
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticates a user and generates a JWT token.
     * 
     * @param request Login credentials
     * @return AuthResponse containing JWT token
     */
    AuthResponse login(AuthRequest request);

    /**
     * Refreshes a user's JWT token using a valid refresh token.
     * 
     * @param request Refresh token request
     * @return AuthResponse containing new JWT token and refresh token
     */
    AuthResponse refreshToken(com.stationery.auth.dto.RefreshTokenRequest request);
}

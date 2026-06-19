/**
 * AuthController.java — REST Controller for Authentication Endpoints
 *
 * Exposes public HTTP endpoints for user registration and login.
 * Delegates all business logic to AuthService.
 *
 * Base URL: /api/auth
 * Access: Public (no authentication required — these endpoints issue tokens)
 *
 * Architecture:
 * Acts as the entry point into the Auth Service from the API Gateway.
 * The gateway routes /api/auth/** directly to this service.
 */
package com.stationery.auth.controller;

import com.stationery.auth.dto.AuthRequest;
import com.stationery.auth.dto.AuthResponse;
import com.stationery.auth.dto.RegisterRequest;
import com.stationery.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

/**
 * Handles incoming HTTP requests for user authentication.
 *
 * All endpoints are publicly accessible — they are exempt from JWT validation
 * because they are the mechanism by which tokens are obtained.
 * Input validation is enforced via @Valid and Bean Validation annotations on DTOs.
 */
@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/register
     *
     * Registers a new user (student or admin) and returns a JWT token.
     * The user is automatically authenticated upon successful registration.
     *
     * Access: Public
     * Request Body: { email, password, fullName, role }
     * Response: 201 Created — { token, email, fullName, role }
     *
     * @param request validated registration payload
     * @return 201 with AuthResponse containing JWT and user details
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for email: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * POST /api/auth/login
     *
     * Authenticates an existing user and returns a fresh JWT token.
     *
     * Access: Public
     * Request Body: { email, password }
     * Response: 200 OK — { token, email, fullName, role }
     *
     * Returns 401 Unauthorized automatically if credentials are invalid
     * (handled by Spring Security's AuthenticationManager).
     *
     * @param request validated login credentials
     * @return 200 with AuthResponse containing JWT and user details
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        log.info("Received login request for email: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody com.stationery.auth.dto.RefreshTokenRequest request) {
        log.info("Received refresh token request");
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }
}

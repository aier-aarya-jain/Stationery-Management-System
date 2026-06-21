/**
 * AuthServiceImpl.java
 *
 * Core business logic for the Auth Service.
 * Responsible for user registration and login workflows.
 *
 * Responsibilities:
 * - Validates uniqueness of email before saving a new user
 * - Hashes passwords using BCrypt before persistence
 * - Authenticates credentials via Spring's AuthenticationManager
 * - Generates JWT tokens upon successful login or registration
 * - Returns a unified AuthResponse containing token, email, name, and role
 *
 * Architecture:
 * Called by AuthController → delegates to UserRepository, JwtUtil, and PasswordEncoder.
 * Does NOT interact with other microservices.
 */
package com.stationery.auth.service.impl;

import com.stationery.auth.dto.AuthRequest;
import com.stationery.auth.dto.AuthResponse;
import com.stationery.auth.dto.RegisterRequest;
import com.stationery.auth.entity.User;
import com.stationery.auth.exception.DuplicateResourceException;
import com.stationery.auth.repository.UserRepository;
import com.stationery.auth.security.CustomUserDetailsService;
import com.stationery.auth.security.JwtUtil;
import com.stationery.auth.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of {@link AuthService}.
 *
 * Handles credential validation, user persistence, and JWT issuance.
 * Acts as the central coordinator between Spring Security, the user repository,
 * and the JWT utility for all authentication operations.
 */
@Service
@Slf4j
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final com.stationery.auth.repository.AuthAuditLogRepository authAuditLogRepository;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                           CustomUserDetailsService userDetailsService,
                           com.stationery.auth.repository.AuthAuditLogRepository authAuditLogRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.authAuditLogRepository = authAuditLogRepository;
    }

    // Function to log an audit action
    private void logAction(String action, String email, String details) {
        com.stationery.auth.entity.AuthAuditLog logEntry = new com.stationery.auth.entity.AuthAuditLog();
        logEntry.setAction(action);
        logEntry.setEmail(email);
        logEntry.setDetails(details);
        authAuditLogRepository.save(logEntry);
    }

    @Override
    // Function to register a new user
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Registration failed: Email {} is already taken", request.getEmail());
            throw new DuplicateResourceException("Email is already taken");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        logAction("REGISTER", user.getEmail(), "User registered with role " + user.getRole());
        log.info("User registered successfully with email: {}", request.getEmail());
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getFullName(), user.getRole());
    }

    @Override
    // Function to authenticate and login user
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        logAction("LOGIN", user.getEmail(), "User logged in");
        log.info("User logged in successfully with email: {}", request.getEmail());
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getFullName(), user.getRole());
    }

    @Override
    // Function to refresh the JWT token
    public AuthResponse refreshToken(com.stationery.auth.dto.RefreshTokenRequest request) {
        String reqToken = request.getRefreshToken();
        String username = jwtUtil.extractUsername(reqToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (jwtUtil.validateToken(reqToken, userDetails)) {
            String newToken = jwtUtil.generateToken(userDetails);
            String newRefreshToken = jwtUtil.generateRefreshToken(userDetails);
            User user = userRepository.findByEmail(username).orElseThrow();
            return new AuthResponse(newToken, newRefreshToken, user.getEmail(), user.getFullName(), user.getRole());
        }
        throw new RuntimeException("Invalid refresh token");
    }

    @Override
    // Function to log the user out
    public void logout(String email) {
        logAction("LOGOUT", email, "User logged out");
    }

    @Override
    // Function to retrieve auth audit logs
    public java.util.List<com.stationery.auth.dto.AuthAuditLogDto> getAuditLogs() {
        return authAuditLogRepository.findAll().stream().map(l -> {
            com.stationery.auth.dto.AuthAuditLogDto dto = new com.stationery.auth.dto.AuthAuditLogDto();
            dto.setId(l.getId());
            dto.setAction(l.getAction());
            dto.setEmail(l.getEmail());
            dto.setDetails(l.getDetails());
            dto.setCreatedAt(l.getCreatedAt());
            return dto;
        }).collect(java.util.stream.Collectors.toList());
    }
}

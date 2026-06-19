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

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                           CustomUserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Registers a new user in the system.
     *
     * Business Rules:
     * - Email must be unique across all accounts (admin or student)
     * - Password is BCrypt-hashed before storage; plaintext is never persisted
     * - User is automatically logged in after registration (token is returned)
     *
     * @param request Registration details including email, password, fullName, and role
     * @return AuthResponse containing the JWT, email, fullName, and role
     * @throws DuplicateResourceException if the email is already registered
     */
    @Override
    public AuthResponse register(RegisterRequest request) {
        // Business Rule: Emails must be globally unique across all roles
        if (userRepository.existsByEmail(request.getEmail())) {
            log.error("Registration failed: Email {} is already taken", request.getEmail());
            throw new DuplicateResourceException("Email is already taken");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());

        // Password is BCrypt-hashed before saving — plaintext is never stored
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        userRepository.save(user);

        // Auto-issue token on registration so the user is logged in immediately
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        log.info("User registered successfully with email: {}", request.getEmail());
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getFullName(), user.getRole());
    }

    /**
     * Authenticates an existing user and issues a JWT.
     *
     * Delegates credential verification to Spring's AuthenticationManager,
     * which internally loads the user via CustomUserDetailsService and
     * verifies the BCrypt password hash.
     *
     * @param request Login credentials (email and password)
     * @return AuthResponse containing a fresh JWT, email, fullName, and role
     * @throws org.springframework.security.authentication.BadCredentialsException if credentials are invalid
     */
    @Override
    public AuthResponse login(AuthRequest request) {
        // Spring Security's AuthenticationManager handles password comparison against the BCrypt hash
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        log.info("User logged in successfully with email: {}", request.getEmail());
        return new AuthResponse(token, refreshToken, user.getEmail(), user.getFullName(), user.getRole());
    }

    @Override
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
}

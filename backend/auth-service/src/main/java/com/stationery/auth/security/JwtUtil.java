/**
 * JwtUtil.java
 *
 * Utility component for creating, parsing, and validating JSON Web Tokens (JWT).
 *
 * Responsibilities:
 * - Generates signed JWT tokens for authenticated users
 * - Embeds the user's role as a custom claim for downstream RBAC enforcement
 * - Validates token signature and expiry
 * - Extracts claims (username, role, expiration) from tokens
 *
 * Algorithm: HMAC-SHA512 (HS512) — symmetric key signing
 * Secret and expiry are injected from application configuration (jwt.secret, jwt.expiration).
 *
 * Architecture:
 * Used by AuthServiceImpl (token generation) and downstream services' JwtAuthenticationFilter
 * (token parsing and validation on each protected request).
 */
package com.stationery.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

/**
 * Stateless JWT utility bean.
 *
 * Generates tokens after login/registration and validates them on incoming
 * requests across all microservices. The role claim embedded in the token
 * drives access control decisions in inventory-service and request-service.
 */
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expirationMs;

    @Value("${jwt.refreshExpiration:604800000}")
    private long refreshExpirationMs;

    /**
     * Derives a secure HMAC-SHA key from the configured secret string.
     * The key must be sufficiently long (≥ 64 bytes for HS512) to avoid weak-key exceptions.
     */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Extracts the subject (email) from the token payload.
     *
     * @param token JWT string
     * @return email address stored as the token subject
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Generic claim extractor — applies a resolver function to the full claims payload.
     *
     * @param token          JWT string
     * @param claimsResolver function that extracts a specific field from Claims
     * @return the resolved claim value
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Parses and verifies the JWT signature, returning all embedded claims.
     * Throws JwtException if the token is tampered with or uses an invalid signature.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Returns true if the token's expiration timestamp is in the past. */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /** Extracts the expiration Date from the token payload. */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Generates a signed JWT token for the authenticated user.
     *
     * The token payload contains:
     * - sub: user's email (used as the principal identifier)
     * - role: user's authority (e.g., ROLE_ADMIN or ROLE_STUDENT)
     *         — embedded so downstream services can enforce RBAC
     *           without a database call on every request
     * - iat: issued-at timestamp
     * - exp: expiration timestamp (now + expirationMs)
     *
     * @param userDetails Spring Security user object
     * @return compact, URL-safe JWT string
     */
    public String generateToken(UserDetails userDetails) {
        // Extract the single granted authority (role) to embed in the token claim
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("role", role)                                            // RBAC claim for downstream services
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validates a token against the current user's details.
     *
     * Checks that:
     * 1. The subject (email) matches the authenticated user
     * 2. The token has not expired
     *
     * @param token       JWT to validate
     * @param userDetails the currently authenticated user
     * @return true if the token is valid for this user
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}

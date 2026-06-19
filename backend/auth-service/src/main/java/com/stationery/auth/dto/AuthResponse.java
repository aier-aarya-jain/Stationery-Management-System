package com.stationery.auth.dto;

/**
 * Response object returned upon successful authentication or registration.
 * Contains the JWT token and basic user info needed by the frontend.
 */
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String email;
    private String fullName;
    private String role;

    public AuthResponse(String token, String refreshToken, String email, String fullName, String role) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
    }

    public String getToken() { return token; }
    public String getRefreshToken() { return refreshToken; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
}

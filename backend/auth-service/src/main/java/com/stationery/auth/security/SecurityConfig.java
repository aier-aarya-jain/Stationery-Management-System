/**
 * SecurityConfig.java — Auth Service Security Configuration
 *
 * Configures Spring Security for the Auth Service.
 *
 * Key Decisions:
 * - CSRF is disabled because this is a stateless REST API using JWTs;
 *   CSRF protection is only relevant for session-based browser apps.
 * - Session policy is STATELESS — no server-side session is ever created.
 *   Each request must carry a valid JWT.
 * - /api/auth/** endpoints are public because they are the entry points
 *   for obtaining tokens (no token exists yet at this point).
 * - BCryptPasswordEncoder is used for password hashing with adaptive
 *   work factor to resist brute-force attacks.
 *
 * Architecture:
 * This config applies only to the Auth Service. Downstream services
 * (inventory-service, request-service) have their own SecurityConfig
 * that validates JWTs rather than credentials.
 */
package com.stationery.auth.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Spring Security configuration for the Auth Service.
 *
 * Establishes a stateless, JWT-compatible security filter chain.
 * Wires the DaoAuthenticationProvider with BCrypt password encoding
 * so that Spring's AuthenticationManager can verify credentials
 * during the login flow.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;

    public SecurityConfig(CustomUserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    /**
     * Defines the HTTP security filter chain.
     *
     * - Disables CSRF (not applicable for stateless JWT APIs)
     * - Permits /api/auth/register and /api/auth/login without authentication
     * - Requires authentication for all other endpoints
     * - Configures STATELESS session management (no HttpSession created)
     *
     * @param http HttpSecurity builder from Spring
     * @return configured SecurityFilterChain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF disabled — no session cookies are used; JWT is sent via Authorization header
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — token does not exist yet when hitting these
                .requestMatchers("/api/auth/register", "/api/auth/login", "/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            // Do not create or use HTTP sessions — every request is independently authenticated via JWT
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider());

        return http.build();
    }

    /**
     * Configures the DAO-based authentication provider.
     *
     * Loads users from MySQL via CustomUserDetailsService and compares
     * the submitted password against the BCrypt hash stored in the database.
     *
     * @return configured DaoAuthenticationProvider
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        // BCrypt handles the hash comparison internally during authentication
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Exposes Spring's AuthenticationManager as a bean.
     * Required by AuthServiceImpl to programmatically authenticate credentials.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * BCryptPasswordEncoder bean.
     * BCrypt includes a random salt per password, making rainbow table attacks infeasible.
     * Default strength factor (10) provides a good security/performance balance.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}


package com.stationery.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Global CORS Configuration for the API Gateway.
 * 
 * Essential for allowing the React frontend (running on a different port, e.g., 3000 or 5173)
 * to communicate with the backend services without being blocked by the browser's 
 * Same-Origin Policy.
 */
@Configuration
public class CorsConfig {

    /**
     * Configures the CORS Web Filter to allow requests from the React frontend.
     * 
     * @return CorsWebFilter configured with allowed origins, methods, and headers.
     */
    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allow all local dev origins easily
        corsConfig.addAllowedOriginPattern("http://localhost:*");
        corsConfig.addAllowedOriginPattern("http://127.0.0.1:*");
        corsConfig.setMaxAge(3600L); // Cache preflight response for 1 hour
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        corsConfig.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        corsConfig.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply these CORS settings to all routes mapped in the gateway
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}

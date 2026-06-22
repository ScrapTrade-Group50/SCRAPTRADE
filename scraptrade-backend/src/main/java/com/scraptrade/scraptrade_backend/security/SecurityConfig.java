package com.scraptrade.scraptrade_backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// 1. NEW IMPORTS FOR CORS
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 2. THE CORS FIX: Tell the Bouncer to check our web rules
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Disable CSRF because we are using tokens, not browser cookies
            .csrf(csrf -> csrf.disable())
            
            // The Rulebook for our API endpoints
            .authorizeHttpRequests(auth -> auth
                // Let anyone view listings and search without logging in
                .requestMatchers(HttpMethod.GET, "/api/listings/**").permitAll()
                // Let anyone hit our future Login/Register endpoints
                .requestMatchers("/api/auth/**").permitAll()
                // EVERY other request (like POSTing a listing or checking out) requires a token!
                .anyRequest().authenticated()
            )
            
            // APIs are stateless, so we don't save sessions
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Put our custom bouncer at the front of the line
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 3. THE CORS RULEBOOK: Explicitly allow React Native Web to talk to us
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allow the React Native Web interface (often 8081 or 8082)
        configuration.setAllowedOrigins(List.of("http://localhost:8081", "http://localhost:8082")); 
        
        // Allow all standard HTTP methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // Allow the headers we use (especially the Authorization header for our JWT)
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply these rules to every single API endpoint we have
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
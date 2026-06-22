package com.scraptrade.scraptrade_backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // This creates a secure, randomized cryptographic key to sign the tokens.
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    
    // The token will expire in 24 hours
    private final long expirationTime = 1000 * 60 * 60 * 24;

    // 1. Give the user a wristband
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }

    // 2. Read the name on the wristband
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 3. Check if the wristband is fake or expired
    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // WE ADDED THIS LINE! The Bouncer will now tell us why he rejected it.
            System.out.println("🚨 BOUNCER REJECTED TOKEN BECAUSE: " + e.getMessage());
            return false; 
        }
    }
}
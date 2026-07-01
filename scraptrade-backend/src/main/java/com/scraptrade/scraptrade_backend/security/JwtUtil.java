package com.scraptrade.scraptrade_backend.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders; // <-- Added this import
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // 1. We replace the random key generator with a static, secure Base64 string
    private static final String SECRET_KEY = "NDQ1ZjQ1ZDg0YjcyNWM0ZmE5YWUzNTRiYWI3OGE5M2RmNTFhOTNmMGZhY2E0MzE4MjkxMGMxYjVlMTM0ZjZkZA==";
    
    // 2. We tell Spring Boot to build the key from our specific string every time
    private final Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_KEY));
    
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
            // The Bouncer will tell us why he rejected it
            System.out.println("🚨 BOUNCER REJECTED TOKEN BECAUSE: " + e.getMessage());
            return false; 
        }
    }
}
package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.security.JwtUtil;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // URL: POST http://localhost:8080/api/auth/login
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> credentials) {
        
        String email = credentials.get("email");
        String password = credentials.get("password");

        // 1. Find the user in the database
        User user = userRepository.findByEmail(email);

        // 2. Check if the user exists and the password matches
        if (user != null && user.getPasswordHash().equals(password)) {
            
            // 3. Generate the VIP wristband (JWT)
            String token = jwtUtil.generateToken(email);
            
            // 4. Hand the token back to the user
            return Map.of(
                    "message", "Login successful!",
                    "token", token
            );
        } else {
            throw new RuntimeException("Invalid email or password!");
        }
    }
}
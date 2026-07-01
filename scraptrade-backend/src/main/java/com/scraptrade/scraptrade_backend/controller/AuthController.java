package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        User user = userRepository.findByEmail(email);

        if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            String token = jwtUtil.generateToken(email);
            return Map.of(
                    "message", "Login successful!",
                    "token", token,
                    "userId", user.getId(),
                    "role", user.getRole().name(),
                    "companyName", user.getCompanyName()
            );
        }

        throw new IllegalArgumentException("Invalid email or password!");
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String roleStr = body.get("role");
        String companyName = body.get("companyName");

        if (email == null || password == null || roleStr == null) {
            throw new IllegalArgumentException("Email, password, and role are required.");
        }

        if (userRepository.findByEmail(email) != null) {
            throw new IllegalStateException("An account with this email already exists.");
        }

        User.Role role;
        try {
            role = User.Role.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role. Use FACTORY_SELLER or ARTISAN_BUYER.");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setCompanyName(companyName != null ? companyName : email);
        user.setPhoneNumber(body.getOrDefault("phoneNumber", ""));

        userRepository.save(user);

        String token = jwtUtil.generateToken(email);
        return Map.of(
                "message", "Registration successful!",
                "token", token,
                "userId", user.getId(),
                "role", user.getRole().name(),
                "companyName", user.getCompanyName()
        );
    }

    @GetMapping("/me")
    public Map<String, Object> me(org.springframework.security.core.Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        return Map.of(
                "userId", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "companyName", user.getCompanyName()
        );
    }
}

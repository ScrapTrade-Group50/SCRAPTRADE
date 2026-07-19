package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.AppNotificationRepository;
import com.scraptrade.scraptrade_backend.repository.MomoWalletRepository;
import com.scraptrade.scraptrade_backend.repository.SavedListingRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.repository.WarehouseLocationRepository;
import com.scraptrade.scraptrade_backend.security.JwtUtil;
import com.scraptrade.scraptrade_backend.service.PasswordResetService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;
    private final SavedListingRepository savedListingRepository;
    private final MomoWalletRepository momoWalletRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final AppNotificationRepository notificationRepository;

    public AuthController(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            PasswordResetService passwordResetService,
            SavedListingRepository savedListingRepository,
            MomoWalletRepository momoWalletRepository,
            WarehouseLocationRepository warehouseLocationRepository,
            AppNotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
        this.savedListingRepository = savedListingRepository;
        this.momoWalletRepository = momoWalletRepository;
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.notificationRepository = notificationRepository;
    }

    private Map<String, Object> userProfile(User user) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", user.getId());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole().name());
        profile.put("companyName", user.getCompanyName());
        profile.put("phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
        return profile;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        User user = userRepository.findByEmail(email);

        if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            String token = jwtUtil.generateToken(email);
            Map<String, Object> response = new HashMap<>(userProfile(user));
            response.put("message", "Login successful!");
            response.put("token", token);
            return response;
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
        Map<String, Object> response = new HashMap<>(userProfile(user));
        response.put("message", "Registration successful!");
        response.put("token", token);
        return response;
    }

    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        return userProfile(user);
    }

    @PatchMapping("/me")
    public Map<String, Object> updateProfile(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }

        if (body.containsKey("companyName") && body.get("companyName") != null) {
            user.setCompanyName(body.get("companyName").trim());
        }
        if (body.containsKey("phoneNumber") && body.get("phoneNumber") != null) {
            user.setPhoneNumber(body.get("phoneNumber").trim());
        }

        userRepository.save(user);
        return userProfile(user);
    }

    @PostMapping("/forgot-password")
    public Map<String, Object> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        return passwordResetService.requestReset(email.trim());
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody Map<String, String> body) {
        passwordResetService.resetPassword(body.get("token"), body.get("newPassword"));
        return Map.of("message", "Password updated successfully. You can now sign in.");
    }

    @PostMapping("/change-password")
    public Map<String, String> changePassword(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return Map.of("message", "Password changed successfully.");
    }

    @DeleteMapping("/me")
    @Transactional
    public Map<String, String> deleteAccount(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }

        String password = body.get("password");
        if (password == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Password is incorrect.");
        }

        notificationRepository.deleteByUser(user);
        savedListingRepository.deleteByUser(user);
        momoWalletRepository.deleteByUser(user);
        warehouseLocationRepository.deleteByUser(user);

        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException(
                    "Cannot delete an account that still has active listings or orders. "
                            + "Please resolve them before deleting your account.");
        }

        return Map.of("message", "Your account has been deleted.");
    }
}

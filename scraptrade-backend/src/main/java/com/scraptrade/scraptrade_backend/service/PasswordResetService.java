package com.scraptrade.scraptrade_backend.service;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final int TOKEN_EXPIRY_HOURS = 1;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final boolean exposeTokenInResponse;
    private final String webResetUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            @Value("${app.password-reset.expose-token:false}") boolean exposeTokenInResponse,
            @Value("${app.password-reset.web-reset-url:}") String webResetUrl) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.exposeTokenInResponse = exposeTokenInResponse;
        this.webResetUrl = webResetUrl == null ? "" : webResetUrl.trim();
    }

    public Map<String, Object> requestReset(String email) {
        User user = userRepository.findByEmail(email);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "If an account exists for that email, a reset link has been sent.");

        if (user == null) {
            return response;
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        user.setResetToken(token);
        user.setResetTokenExpiresAt(LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS));
        userRepository.save(user);

        if (exposeTokenInResponse) {
            response.put("resetToken", token);
            response.put("message", "Reset token generated (dev mode). Use it on the reset password screen.");
            return response;
        }

        if (webResetUrl.isBlank()) {
            log.error(
                    "Password reset requested for {} but app.password-reset.web-reset-url is not configured.",
                    email);
            return response;
        }

        if (!emailService.isEnabled()) {
            log.error(
                    "Password reset requested for {} but mail is disabled (app.mail.enabled=false).",
                    email);
            return response;
        }

        String resetLink = buildResetLink(token);
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        return response;
    }

    private String buildResetLink(String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        if (webResetUrl.contains("?")) {
            return webResetUrl + "&token=" + encodedToken;
        }
        return webResetUrl + "?token=" + encodedToken;
    }

    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Reset token is required.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        User user = userRepository.findByResetToken(token);
        if (user == null) {
            throw new IllegalArgumentException("Invalid or expired reset token.");
        }

        if (user.getResetTokenExpiresAt() == null
                || user.getResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            user.setResetToken(null);
            user.setResetTokenExpiresAt(null);
            userRepository.save(user);
            throw new IllegalArgumentException("Invalid or expired reset token.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiresAt(null);
        userRepository.save(user);
    }
}

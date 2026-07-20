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

    public Map<String, Object> requestReset(String email, String clientOrigin) {
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

        String resetBaseUrl = resolveResetBaseUrl(clientOrigin);

        if (exposeTokenInResponse) {
            response.put("resetToken", token);
            if (!resetBaseUrl.isBlank()) {
                response.put("resetLink", buildResetLink(token, resetBaseUrl));
            }
            response.put("message", "Reset token generated. Use the link below to set your password.");
            return response;
        }

        if (resetBaseUrl.isBlank()) {
            log.error(
                    "Password reset requested for {} but no web reset URL is configured.",
                    email);
            return response;
        }

        String resetLink = buildResetLink(token, resetBaseUrl);

        if (!emailService.isEnabled()) {
            log.warn("Mail disabled — returning reset link in API response for {}", email);
            response.put("resetLink", resetLink);
            response.put(
                    "message",
                    "Email is not configured yet. Use the reset link below to set your password.");
            return response;
        }

        boolean sent = emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
        if (!sent) {
            log.warn("Password reset email failed — returning reset link in API response for {}", email);
            response.put("resetLink", resetLink);
            response.put(
                    "message",
                    "We could not send email right now. Use the reset link below to set your password.");
            return response;
        }

        return response;
    }

    private String resolveResetBaseUrl(String clientOrigin) {
        if (clientOrigin != null && !clientOrigin.isBlank()) {
            String origin = clientOrigin.trim().replaceAll("/+$", "");
            if (origin.startsWith("http://") || origin.startsWith("https://")) {
                return origin + "/reset-password";
            }
        }
        return webResetUrl;
    }

    private String buildResetLink(String token, String baseUrl) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        if (baseUrl.contains("?")) {
            return baseUrl + "&token=" + encodedToken;
        }
        return baseUrl + "?token=" + encodedToken;
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

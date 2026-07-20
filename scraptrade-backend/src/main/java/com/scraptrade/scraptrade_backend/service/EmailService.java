package com.scraptrade.scraptrade_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final Optional<JavaMailSender> mailSender;
    private final boolean enabled;
    private final String fromAddress;

    public EmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${app.mail.from:SCRAPTRADE <noreply@scraptrade.com>}") String fromAddress) {
        this.mailSender = Optional.ofNullable(mailSender);
        this.enabled = enabled;
        this.fromAddress = fromAddress;
    }

    public boolean isEnabled() {
        return enabled && mailSender.isPresent();
    }

    public boolean sendPasswordResetEmail(String toEmail, String resetLink) {
        if (!isEnabled()) {
            log.warn("Mail is disabled or not configured — password reset email not sent to {}", toEmail);
            return false;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Reset your SCRAPTRADE password");
        message.setText(buildPasswordResetBody(resetLink));

        try {
            mailSender.get().send(message);
            log.info("Password reset email sent to {}", toEmail);
            return true;
        } catch (Exception ex) {
            log.error("Failed to send password reset email to {}", toEmail, ex);
            return false;
        }
    }

    private static String buildPasswordResetBody(String resetLink) {
        return """
                You requested a password reset for your SCRAPTRADE account.

                Open this link in your browser to choose a new password (expires in 1 hour):
                %s

                If you did not request this, you can ignore this email.

                — SCRAPTRADE
                """.formatted(resetLink);
    }
}

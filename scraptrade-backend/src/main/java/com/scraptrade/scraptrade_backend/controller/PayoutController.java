package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.service.PaystackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payouts")
public class PayoutController {

    private final UserRepository userRepository;
    private final Optional<PaystackService> paystackService;
    private final String paymentProvider;

    public PayoutController(
            UserRepository userRepository,
            @Autowired(required = false) PaystackService paystackService,
            @Value("${payment.provider:simulated}") String paymentProvider) {
        this.userRepository = userRepository;
        this.paystackService = Optional.ofNullable(paystackService);
        this.paymentProvider = paymentProvider;
    }

    private User requireFactorySeller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("Authentication required.");
        }
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        if (user.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can manage payout accounts.");
        }
        return user;
    }

    @GetMapping("/status")
    public Map<String, Object> status(Authentication authentication) {
        User user = requireFactorySeller(authentication);

        Map<String, Object> status = new HashMap<>();
        boolean paystackActive = "paystack".equalsIgnoreCase(paymentProvider)
                && paystackService.map(PaystackService::isConfigured).orElse(false);
        status.put("paystackEnabled", paystackActive);
        status.put("configured", user.getPaystackRecipientCode() != null && !user.getPaystackRecipientCode().isBlank());
        status.put("accountLabel", user.getPayoutAccountLabel() != null ? user.getPayoutAccountLabel() : "");
        return status;
    }

    @PostMapping("/setup")
    public Map<String, Object> setup(@RequestBody Map<String, String> body, Authentication authentication) {
        User user = requireFactorySeller(authentication);

        if (!"paystack".equalsIgnoreCase(paymentProvider)) {
            throw new IllegalStateException("Payout setup is only available when Paystack is enabled.");
        }

        PaystackService paystack = paystackService.orElseThrow(() ->
                new IllegalStateException("Paystack is not configured on the server."));

        String msisdn = normalizeMsisdn(body.get("msisdn"));
        String accountName = body.get("accountName");
        if (accountName == null || accountName.isBlank()) {
            accountName = user.getCompanyName() != null ? user.getCompanyName() : user.getEmail();
        }
        String provider = normalizeProvider(body.get("provider"));

        PaystackService.RecipientResult recipient = paystack.createMobileMoneyRecipient(
                accountName.trim(), msisdn, provider);

        user.setPaystackRecipientCode(recipient.recipientCode());
        user.setPayoutAccountLabel(provider + " · " + msisdn);
        userRepository.save(user);

        return Map.of(
                "message", "Payout account linked. Escrow funds will transfer here after gate-pass scan.",
                "configured", true,
                "accountLabel", user.getPayoutAccountLabel());
    }

    private static String normalizeMsisdn(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("MoMo number is required.");
        }
        String msisdn = raw.replaceAll("\\D", "");
        if (msisdn.length() < 10) {
            throw new IllegalArgumentException("Please enter a valid 10-digit MoMo number.");
        }
        if (msisdn.startsWith("233") && msisdn.length() >= 12) {
            msisdn = "0" + msisdn.substring(3);
        }
        return msisdn;
    }

    private static String normalizeProvider(String raw) {
        if (raw == null || raw.isBlank()) {
            return "MTN";
        }
        return switch (raw.trim().toUpperCase()) {
            case "MTN", "MTN_MOMO" -> "MTN";
            case "VOD", "VODAFONE", "TELECEL" -> "VOD";
            case "TIG", "AIRTELTIGO", "AIRTEL" -> "TIG";
            default -> raw.trim().toUpperCase();
        };
    }
}

package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.service.PaystackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final String paymentProvider;
    private final Optional<PaystackService> paystackService;

    public PaymentController(
            @Value("${payment.provider:simulated}") String paymentProvider,
            @Autowired(required = false) PaystackService paystackService) {
        this.paymentProvider = paymentProvider;
        this.paystackService = Optional.ofNullable(paystackService);
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        Map<String, Object> config = new HashMap<>();
        config.put("provider", paymentProvider);
        boolean paystackReady = "paystack".equalsIgnoreCase(paymentProvider)
                && paystackService.map(PaystackService::isConfigured).orElse(false);
        config.put("paystackEnabled", paystackReady);
        if (paystackReady) {
            config.put("publicKey", paystackService.get().publicKey());
        }
        return config;
    }
}

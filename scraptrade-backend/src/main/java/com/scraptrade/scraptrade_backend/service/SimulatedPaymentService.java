package com.scraptrade.scraptrade_backend.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "simulated", matchIfMissing = true)
public class SimulatedPaymentService implements PaymentService {

    @Override
    public PaymentResult charge(String momoNumber, BigDecimal amount, String reference) {
        if (momoNumber == null || momoNumber.replaceAll("\\D", "").length() < 10) {
            return new PaymentResult(false, null, "Invalid MoMo number.");
        }
        String txnId = "SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new PaymentResult(
                true,
                txnId,
                "Simulated payment of GHS " + amount + " accepted (demo mode).");
    }
}

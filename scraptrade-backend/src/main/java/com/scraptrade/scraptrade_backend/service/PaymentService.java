package com.scraptrade.scraptrade_backend.service;

import java.math.BigDecimal;

public interface PaymentService {

    PaymentResult charge(String momoNumber, BigDecimal amount, String reference);

    record PaymentResult(boolean success, String transactionId, String message) {}
}

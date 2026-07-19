package com.scraptrade.scraptrade_backend.exception;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PaystackApiException extends RuntimeException {

    private static final Pattern MESSAGE_PATTERN = Pattern.compile("\"message\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern CODE_PATTERN = Pattern.compile("\"code\"\\s*:\\s*\"([^\"]+)\"");

    private final String paystackCode;

    public PaystackApiException(String message, String paystackCode) {
        super(message);
        this.paystackCode = paystackCode;
    }

    public String paystackCode() {
        return paystackCode;
    }

    public boolean isTransferUnavailable() {
        return "transfer_unavailable".equalsIgnoreCase(paystackCode);
    }

    public static PaystackApiException fromResponseBody(String body) {
        if (body == null || body.isBlank()) {
            return new PaystackApiException("Paystack request failed.", null);
        }

        String code = extractJsonString(body, CODE_PATTERN);
        String message = extractJsonString(body, MESSAGE_PATTERN);
        if (message == null || message.isBlank()) {
            message = body.length() > 200 ? body.substring(0, 200) : body;
        }

        if ("transfer_unavailable".equalsIgnoreCase(code)
                || message.toLowerCase().contains("starter business")
                || message.toLowerCase().contains("third party payouts")) {
            message = "Paystack transfers need a Registered Business account (Starter plans cannot payout). "
                    + "Upgrade at dashboard.paystack.com, or ask your admin to enable skip-transfers for local testing.";
        }

        return new PaystackApiException(message, code);
    }

    private static String extractJsonString(String body, Pattern pattern) {
        Matcher matcher = pattern.matcher(body);
        return matcher.find() ? matcher.group(1) : null;
    }
}

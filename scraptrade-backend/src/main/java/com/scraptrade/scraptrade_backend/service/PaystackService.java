package com.scraptrade.scraptrade_backend.service;

import com.scraptrade.scraptrade_backend.exception.PaystackApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "paystack")
public class PaystackService {

    private static final Logger log = LoggerFactory.getLogger(PaystackService.class);
    private static final String API_BASE = "https://api.paystack.co";

    private final String secretKey;
    private final String publicKey;
    private final String callbackUrl;
    private final RestClient restClient;

    public PaystackService(
            @Value("${payment.paystack.secret-key:}") String secretKey,
            @Value("${payment.paystack.public-key:}") String publicKey,
            @Value("${payment.paystack.callback-url:scraptrade://checkout}") String callbackUrl) {
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.publicKey = publicKey == null ? "" : publicKey.trim();
        this.callbackUrl = callbackUrl == null ? "scraptrade://checkout" : callbackUrl.trim();
        this.restClient = RestClient.builder()
                .baseUrl(API_BASE)
                .defaultHeader("Authorization", "Bearer " + this.secretKey)
                .build();
    }

    public boolean isConfigured() {
        return !secretKey.isBlank() && !publicKey.isBlank();
    }

    public String publicKey() {
        return publicKey;
    }

    public String generateReference(Long listingId) {
        return "ST-" + listingId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }

    public InitializeResult initializeTransaction(
            String buyerEmail, BigDecimal amountGhs, String reference, Long listingId) {
        return initializeTransaction(buyerEmail, amountGhs, reference, listingId, null);
    }

    public InitializeResult initializeTransaction(
            String buyerEmail,
            BigDecimal amountGhs,
            String reference,
            Long listingId,
            String callbackUrlOverride) {
        ensureConfigured();

        long amountPesewas = toPesewas(amountGhs);
        String effectiveCallback = callbackUrlOverride == null || callbackUrlOverride.isBlank()
                ? callbackUrl
                : callbackUrlOverride.trim();
        Map<String, Object> body = new HashMap<>();
        body.put("email", buyerEmail);
        body.put("amount", amountPesewas);
        body.put("reference", reference);
        body.put("currency", "GHS");
        body.put("callback_url", effectiveCallback);
        body.put("metadata", Map.of("listing_id", listingId));

        Map<String, Object> data = post("/transaction/initialize", body);
        String authorizationUrl = stringValue(data.get("authorization_url"));
        String returnedReference = stringValue(data.get("reference"));
        if (returnedReference.isBlank()) {
            returnedReference = reference;
        }
        if (authorizationUrl.isBlank()) {
            throw new IllegalStateException("Paystack did not return an authorization URL.");
        }
        return new InitializeResult(authorizationUrl, returnedReference, amountGhs);
    }

    public VerifyResult verifyTransaction(String reference, BigDecimal expectedAmountGhs) {
        ensureConfigured();

        Map<String, Object> data = get("/transaction/verify/" + reference);
        String status = stringValue(data.get("status"));
        long paidPesewas = longValue(data.get("amount"));
        long expectedPesewas = toPesewas(expectedAmountGhs);

        if (!"success".equalsIgnoreCase(status)) {
            return new VerifyResult(false, "Payment was not completed.", paidPesewas, reference);
        }
        if (paidPesewas != expectedPesewas) {
            log.warn("Paystack amount mismatch for {}: paid {} expected {}", reference, paidPesewas, expectedPesewas);
            return new VerifyResult(false, "Payment amount does not match the order total.", paidPesewas, reference);
        }
        String verifiedReference = stringValue(data.get("reference"));
        if (verifiedReference.isBlank()) {
            verifiedReference = reference;
        }
        return new VerifyResult(true, "Payment verified.", paidPesewas, verifiedReference);
    }

    public RecipientResult createMobileMoneyRecipient(String name, String msisdn, String providerCode) {
        ensureConfigured();

        Map<String, Object> body = new HashMap<>();
        body.put("type", "mobile_money");
        body.put("name", name);
        body.put("account_number", msisdn);
        body.put("bank_code", providerCode);
        body.put("currency", "GHS");

        Map<String, Object> data = post("/transferrecipient", body);
        String recipientCode = stringValue(data.get("recipient_code"));
        if (recipientCode.isBlank()) {
            throw new IllegalStateException("Paystack did not return a transfer recipient code.");
        }
        return new RecipientResult(recipientCode, stringValue(data.get("details")));
    }

    public TransferResult initiateTransfer(
            String recipientCode, BigDecimal amountGhs, String reference, String reason) {
        ensureConfigured();

        Map<String, Object> body = new HashMap<>();
        body.put("source", "balance");
        body.put("amount", toPesewas(amountGhs));
        body.put("reference", reference);
        body.put("recipient", recipientCode);
        body.put("reason", reason);
        body.put("currency", "GHS");

        Map<String, Object> data = post("/transfer", body);
        String status = stringValue(data.get("status"));
        String transferCode = stringValue(data.get("transfer_code"));
        if (!"success".equalsIgnoreCase(status) && !"pending".equalsIgnoreCase(status)) {
            throw new IllegalStateException("Paystack transfer failed with status: " + status);
        }
        return new TransferResult(
                true,
                status,
                transferCode,
                stringValue(data.get("reference"), reference),
                toPesewas(amountGhs));
    }

    public TransferResult verifyTransfer(String reference) {
        ensureConfigured();

        Map<String, Object> data = get("/transfer/verify/" + reference);
        String status = stringValue(data.get("status"));
        return new TransferResult(
                "success".equalsIgnoreCase(status),
                status,
                stringValue(data.get("transfer_code")),
                stringValue(data.get("reference"), reference),
                longValue(data.get("amount")));
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Paystack is not configured. Set PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY.");
        }
    }

    private static long toPesewas(BigDecimal amountGhs) {
        return amountGhs.multiply(BigDecimal.valueOf(100)).longValue();
    }

    private Map<String, Object> post(String path, Map<String, Object> body) {
        Map<String, Object> root = restClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> status.value() >= 400, this::handlePaystackError)
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        return unwrapData(root);
    }

    private Map<String, Object> get(String path) {
        Map<String, Object> root = restClient.get()
                .uri(path)
                .retrieve()
                .onStatus(status -> status.value() >= 400, this::handlePaystackError)
                .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        return unwrapData(root);
    }

    private void handlePaystackError(org.springframework.http.HttpRequest request, ClientHttpResponse response) {
        try {
            String body = StreamUtils.copyToString(response.getBody(), StandardCharsets.UTF_8);
            throw PaystackApiException.fromResponseBody(body);
        } catch (PaystackApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new PaystackApiException("Paystack request failed.", null);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapData(Map<String, Object> root) {
        if (root == null) {
            throw new PaystackApiException("Empty response from Paystack.", null);
        }
        if (!Boolean.TRUE.equals(root.get("status"))) {
            String code = stringValue(root.get("code"));
            String message = stringValue(root.get("message"), "Paystack API error");
            if ("transfer_unavailable".equalsIgnoreCase(code)) {
                message = "Paystack transfers need a Registered Business account (Starter plans cannot payout). "
                        + "Upgrade at dashboard.paystack.com, or enable skip-transfers for local testing.";
            }
            throw new PaystackApiException(message, code.isBlank() ? null : code);
        }
        Object data = root.get("data");
        if (data instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        throw new IllegalStateException("Unexpected Paystack response format.");
    }

    private static String stringValue(Object value) {
        return stringValue(value, "");
    }

    private static String stringValue(Object value, String fallback) {
        return value == null ? fallback : String.valueOf(value);
    }

    private static long longValue(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(stringValue(value, "0"));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    public record InitializeResult(String authorizationUrl, String reference, BigDecimal amountGhs) {}

    public record VerifyResult(boolean success, String message, long amountPesewas, String reference) {}

    public record RecipientResult(String recipientCode, String details) {}

    public record TransferResult(
            boolean success, String status, String transferCode, String reference, long amountPesewas) {}
}

package com.scraptrade.scraptrade_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "payment.provider", havingValue = "momo")
public class MomoPaymentService implements PaymentService {

    private final String apiUser;
    private final String apiKey;
    private final String subscriptionKey;
    private final String targetEnvironment;
    private final String callbackUrl;

    public MomoPaymentService(
            @Value("${payment.momo.api-user:}") String apiUser,
            @Value("${payment.momo.api-key:}") String apiKey,
            @Value("${payment.momo.subscription-key:}") String subscriptionKey,
            @Value("${payment.momo.environment:sandbox}") String targetEnvironment,
            @Value("${payment.momo.callback-url:}") String callbackUrl) {
        this.apiUser = apiUser;
        this.apiKey = apiKey;
        this.subscriptionKey = subscriptionKey;
        this.targetEnvironment = targetEnvironment;
        this.callbackUrl = callbackUrl;
    }

    @Override
    public PaymentResult charge(String momoNumber, BigDecimal amount, String reference) {
        if (apiUser.isBlank() || apiKey.isBlank() || subscriptionKey.isBlank()) {
            throw new IllegalStateException(
                    "MTN MoMo is not configured. Set payment.momo.api-user, api-key, and subscription-key.");
        }

        String msisdn = momoNumber.replaceAll("\\D", "");
        if (msisdn.length() < 10) {
            return new PaymentResult(false, null, "Invalid MoMo number.");
        }

        try {
            String accessToken = fetchAccessToken();
            String externalId = reference != null ? reference : UUID.randomUUID().toString();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("X-Reference-Id", externalId);
            headers.set("X-Target-Environment", targetEnvironment);
            headers.set("Ocp-Apim-Subscription-Key", subscriptionKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "amount", amount.toPlainString(),
                    "currency", "GHS",
                    "externalId", externalId,
                    "payer", Map.of("partyIdType", "MSISDN", "partyId", msisdn),
                    "payerMessage", "SCRAPTRADE purchase",
                    "payeeNote", "Escrow payment");

            RestClient client = RestClient.create();
            ResponseEntity<Void> response = client.post()
                    .uri("https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay")
                    .headers(h -> {
                        h.addAll(headers);
                        if (callbackUrl != null && !callbackUrl.isBlank()) {
                            h.set("X-Callback-Url", callbackUrl);
                        }
                    })
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();

            if (response.getStatusCode().is2xxSuccessful()) {
                return new PaymentResult(true, externalId, "MoMo payment request sent. Approve on your phone.");
            }
            return new PaymentResult(false, null, "MoMo payment request failed.");
        } catch (Exception e) {
            return new PaymentResult(false, null, "MoMo payment failed: " + e.getMessage());
        }
    }

    private String fetchAccessToken() {
        RestClient client = RestClient.create();
        @SuppressWarnings("unchecked")
        Map<String, Object> tokenResponse = client.post()
                .uri("https://sandbox.momodeveloper.mtn.com/collection/token/")
                .header("Ocp-Apim-Subscription-Key", subscriptionKey)
                .headers(h -> h.setBasicAuth(apiUser, apiKey))
                .retrieve()
                .body(Map.class);

        if (tokenResponse == null || !tokenResponse.containsKey("access_token")) {
            throw new IllegalStateException("Could not obtain MoMo access token.");
        }
        return tokenResponse.get("access_token").toString();
    }
}

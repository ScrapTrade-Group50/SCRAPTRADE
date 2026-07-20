package com.scraptrade.scraptrade_backend.dto;

public record ListingSummary(
        Long id,
        String title,
        Double weight,
        String category,
        String pickupLocation,
        SellerSummary seller) {}

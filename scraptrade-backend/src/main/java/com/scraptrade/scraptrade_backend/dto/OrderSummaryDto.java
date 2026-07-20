package com.scraptrade.scraptrade_backend.dto;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.Order;
import com.scraptrade.scraptrade_backend.model.User;

import java.math.BigDecimal;

public record OrderSummaryDto(
        Long id,
        String gatePassCode,
        BigDecimal totalAmount,
        String status,
        ListingSummary listing,
        BuyerSummary buyer) {

    public static OrderSummaryDto fromOrder(Order order, boolean includeBuyer) {
        Listing listing = order.getListing();
        ListingSummary listingSummary = null;

        if (listing != null) {
            User seller = listing.getSeller();
            SellerSummary sellerSummary =
                    seller != null ? new SellerSummary(seller.getCompanyName()) : null;
            listingSummary = new ListingSummary(
                    listing.getId(),
                    listing.getTitle(),
                    listing.getWeight(),
                    listing.getCategory(),
                    listing.getPickupLocation(),
                    sellerSummary);
        }

        BuyerSummary buyerSummary = null;
        if (includeBuyer && order.getBuyer() != null) {
            User buyer = order.getBuyer();
            buyerSummary = new BuyerSummary(buyer.getCompanyName(), buyer.getPhoneNumber());
        }

        String status = order.getStatus() != null ? order.getStatus().name() : null;

        return new OrderSummaryDto(
                order.getId(),
                order.getGatePassCode(),
                order.getTotalAmount(),
                status,
                listingSummary,
                buyerSummary);
    }
}

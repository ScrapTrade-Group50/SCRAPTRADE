package com.scraptrade.scraptrade_backend.dto;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.User;

import java.math.BigDecimal;

public record ListingCardDto(
        Long id,
        String title,
        String description,
        String category,
        Double weight,
        String dimensions,
        String pickupLocation,
        BigDecimal pricePerUnit,
        String imageUrl,
        String status,
        SellerSummary seller) {

    public static ListingCardDto from(Listing listing) {
        if (listing == null) {
            return null;
        }
        User seller = listing.getSeller();
        SellerSummary sellerSummary =
                seller != null ? new SellerSummary(seller.getCompanyName()) : null;
        String status = listing.getStatus() != null ? listing.getStatus().name() : null;

        return new ListingCardDto(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getCategory(),
                listing.getWeight(),
                listing.getDimensions(),
                listing.getPickupLocation(),
                listing.getPricePerUnit(),
                listing.getImageUrl(),
                status,
                sellerSummary);
    }
}

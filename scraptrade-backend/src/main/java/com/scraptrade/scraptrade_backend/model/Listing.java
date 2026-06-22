package com.scraptrade.scraptrade_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "listings")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;

    private Double weight; 
    
    private String dimensions;

    @Column(name = "price_per_unit")
    private BigDecimal pricePerUnit;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        AVAILABLE, PENDING_PICKUP, SOLD
    }
}
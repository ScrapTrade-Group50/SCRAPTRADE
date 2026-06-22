package com.scraptrade.scraptrade_backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "orders") // "order" is a reserved word in SQL, so we use "orders"
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    @Column(name = "gate_pass_code")
    private String gatePassCode;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        PAID_TO_ESCROW, PICKED_UP, COMPLETED
    }
}
package com.scraptrade.scraptrade_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "orders")
public class Order {

    public static final BigDecimal ESCROW_FEE = BigDecimal.valueOf(15);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
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

    @Column(name = "momo_number")
    private String momoNumber;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status {
        PAID_TO_ESCROW, COMPLETED
    }
}

package com.scraptrade.scraptrade_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "momo_wallets")
public class MomoWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String label;

    @Column(name = "msisdn", nullable = false)
    private String msisdn;

    @Column(name = "is_default")
    private boolean isDefault;

    // Explicit getter so Jackson emits "isDefault" (Lombok would otherwise strip the "is").
    @JsonProperty("isDefault")
    public boolean isDefault() {
        return isDefault;
    }
}

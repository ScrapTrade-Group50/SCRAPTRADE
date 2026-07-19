package com.scraptrade.scraptrade_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name")
    private String companyName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false)
    @JsonIgnore
    private String passwordHash;

    @JsonIgnore
    @Column(name = "reset_token")
    private String resetToken;

    @JsonIgnore
    @Column(name = "reset_token_expires_at")
    private LocalDateTime resetTokenExpiresAt;

    @Enumerated(EnumType.STRING)
    private Role role;

    /** Paystack transfer recipient for factory payout after gate-pass scan */
    @Column(name = "paystack_recipient_code")
    private String paystackRecipientCode;

    @Column(name = "payout_account_label")
    private String payoutAccountLabel;

    public enum Role {
        FACTORY_SELLER, ARTISAN_BUYER, ADMIN
    }
}
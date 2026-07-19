package com.scraptrade.scraptrade_backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "warehouse_locations")
public class WarehouseLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "is_primary")
    private boolean isPrimary;

    // Explicit getter so Jackson emits "isPrimary" (Lombok would otherwise strip the "is").
    @JsonProperty("isPrimary")
    public boolean isPrimary() {
        return isPrimary;
    }
}

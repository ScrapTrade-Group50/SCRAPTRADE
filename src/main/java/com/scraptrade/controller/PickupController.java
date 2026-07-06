package com.scraptrade.controller;

import com.scraptrade.entity.Order;
import com.scraptrade.enums.OrderStatus;
import com.scraptrade.service.EscrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class PickupController {

    private final EscrowService escrowService;

    /**
     * Factory Seller calls this endpoint to confirm pickup.
     * Body: the 6-digit gate pass code shown on the Artisan's app.
     */
    @PostMapping("/{orderId}/verify-pickup")
    public ResponseEntity<?> verifyPickup(
            @PathVariable Long orderId,
            @RequestBody String submittedCode) {

        try {
            Order completedOrder = escrowService.verifyGatePass(orderId, submittedCode);
            return ResponseEntity.ok(completedOrder);

        } catch (SecurityException e) {
            // Wrong code → 403 Forbidden
            return ResponseEntity.status(403).body(e.getMessage());

        } catch (IllegalStateException e) {
            // Wrong order state → 400 Bad Request
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (IllegalArgumentException e) {
            // Order not found → 404
            return ResponseEntity.notFound().build();
        }
    }
}

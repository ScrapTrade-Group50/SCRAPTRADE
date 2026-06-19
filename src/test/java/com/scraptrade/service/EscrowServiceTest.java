package com.scraptrade.service;

import com.scraptrade.entity.Order;
import com.scraptrade.enums.OrderStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class EscrowServiceTest {

    @Autowired
    private EscrowService escrowService;

    @Test
    void shouldTransitionFromCreatedToFundsSecured() {
        // Use a real order id that exists in your test DB
        Long orderId = 1L;

        Order updated = escrowService.transitionOrder(orderId, OrderStatus.FUNDS_SECURED);

        assertEquals(OrderStatus.FUNDS_SECURED, updated.getStatus());
    }

    @Test
    void shouldRejectInvalidStateJump() {
        Long orderId = 1L; // order is currently FUNDS_SECURED

        // Attempt illegal jump — FUNDS_SECURED → FUNDS_RELEASED (skips steps)
        IllegalStateException ex = assertThrows(
            IllegalStateException.class,
            () -> escrowService.transitionOrder(orderId, OrderStatus.FUNDS_RELEASED)
        );

        assertTrue(ex.getMessage().contains("Invalid state transition"));
    }
}

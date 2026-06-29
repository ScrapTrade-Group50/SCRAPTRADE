package com.service;

public class EscrowService {

}
package com.scraptrade.service;

import com.scraptrade.entity.Order;
import com.scraptrade.entity.Transaction;
import com.scraptrade.enums.OrderStatus;
import com.scraptrade.enums.TransactionStatus;
import com.scraptrade.enums.TransactionType;
import com.scraptrade.repository.OrderRepository;
import com.scraptrade.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EscrowService {

    private final OrderRepository orderRepository;
    private final TransactionRepository transactionRepository;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = Map.of(
        OrderStatus.CREATED,         Set.of(OrderStatus.FUNDS_SECURED),
        OrderStatus.FUNDS_SECURED,   Set.of(OrderStatus.AWAITING_PICKUP),
        OrderStatus.AWAITING_PICKUP, Set.of(OrderStatus.COMPLETED),
        OrderStatus.COMPLETED,       Set.of(OrderStatus.FUNDS_RELEASED),
        OrderStatus.FUNDS_RELEASED,  Set.of()
    );

    @Transactional
    public Order transitionOrder(Long orderId, OrderStatus newStatus) {

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Order not found with id: " + orderId));

        OrderStatus currentStatus = order.getStatus();

        Set<OrderStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());

        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(String.format(
                "Invalid state transition: cannot move from %s to %s",
                currentStatus, newStatus));
        }

        // ── Gate Pass: generate when funds are secured ─────────────────────────
        if (newStatus == OrderStatus.FUNDS_SECURED) {
            order.setGatePassCode(generateGatePass());
        }

        order.setStatus(newStatus);
        orderRepository.save(order);

        logTransaction(order, newStatus);

        return order;
    }

    /**
     * Verifies the submitted gate pass code and completes the order.
     * Called by the Factory Seller at pickup.
     */
    @Transactional
    public Order verifyGatePass(Long orderId, String submittedCode) {

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Order not found with id: " + orderId));

        // Guard: order must be in AWAITING_PICKUP before verification
        if (order.getStatus() != OrderStatus.AWAITING_PICKUP) {
            throw new IllegalStateException(
                "Order is not in AWAITING_PICKUP state. Current state: "
                + order.getStatus());
        }

        // Verify the code
        if (!order.getGatePassCode().equals(submittedCode)) {
            throw new SecurityException("Invalid gate pass code. Access denied.");
        }

        // Code matches → complete the order
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

        logTransaction(order, OrderStatus.COMPLETED);

        return order;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Generates a cryptographically secure 6-digit numeric gate pass.
     * Range: 100000–999999 (always 6 digits, never starts with 0).
     */
    private String generateGatePass() {
        SecureRandom random = new SecureRandom();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private void logTransaction(Order order, OrderStatus newStatus) {
        TransactionType type = resolveTransactionType(newStatus);

        Transaction transaction = Transaction.builder()
            .order(order)
            .amount(order.getTotalAmount())
            .paymentReference("ESCROW-" + order.getId() + "-" + newStatus.name())
            .transactionType(type)
            .status(TransactionStatus.SUCCESS)
            .build();

        transactionRepository.save(transaction);
    }

    private TransactionType resolveTransactionType(OrderStatus newStatus) {
        return switch (newStatus) {
            case FUNDS_SECURED -> TransactionType.DEPOSIT;
            case FUNDS_RELEASED -> TransactionType.PAYOUT;
            default -> TransactionType.DEPOSIT;
        };
    }
}

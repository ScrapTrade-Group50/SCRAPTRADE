package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.Order;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.OrderRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public OrderController(OrderRepository orderRepository, ListingRepository listingRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    private User requireUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        return user;
    }

    @PostMapping("/checkout")
    @Transactional
    public Order processCheckout(
            @RequestParam Long listingId,
            @RequestParam(required = false) String momoNumber,
            Authentication authentication) {

        User buyer = requireUser(authentication);

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        if (!listing.getStatus().equals(Listing.Status.AVAILABLE)) {
            throw new IllegalStateException("Sorry, this item was just sold!");
        }

        BigDecimal price = listing.getPricePerUnit() != null ? listing.getPricePerUnit() : BigDecimal.ZERO;
        Double weight = listing.getWeight() != null ? listing.getWeight() : 0.0;
        BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(weight));
        BigDecimal total = itemTotal.add(Order.ESCROW_FEE);

        Order newOrder = new Order();
        newOrder.setBuyer(buyer);
        newOrder.setListing(listing);
        newOrder.setTotalAmount(total);
        newOrder.setMomoNumber(momoNumber);
        newOrder.setStatus(Order.Status.PAID_TO_ESCROW);
        newOrder.setGatePassCode("QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        listing.setStatus(Listing.Status.PENDING_PICKUP);
        listingRepository.save(listing);

        return orderRepository.save(newOrder);
    }

    @PostMapping("/verify-pickup")
    @Transactional
    public ResponseEntity<?> verifyPickup(@RequestParam String gatePassCode, Authentication authentication) {

        User factoryUser = requireUser(authentication);

        if (factoryUser.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can verify gate passes.");
        }

        Order order = orderRepository.findByGatePassCode(gatePassCode);

        if (order == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Gate Pass Code! Please check your typing."));
        }

        if (!order.getListing().getSeller().getId().equals(factoryUser.getId())) {
            throw new SecurityException("You can only verify pickups for your own listings.");
        }

        if (order.getStatus() != Order.Status.PAID_TO_ESCROW) {
            return ResponseEntity.badRequest().body(Map.of("message", "This order has already been processed and picked up."));
        }

        order.setStatus(Order.Status.COMPLETED);

        Listing listing = order.getListing();
        listing.setStatus(Listing.Status.SOLD);
        listingRepository.save(listing);

        orderRepository.save(order);

        return ResponseEntity.ok(Map.of("message", "Verification successful! Funds released."));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<Order>> getMyOrders(Authentication authentication) {
        User buyer = requireUser(authentication);
        return ResponseEntity.ok(orderRepository.findByBuyer(buyer));
    }

    @GetMapping("/my-sales")
    public ResponseEntity<List<Order>> getMySales(Authentication authentication) {
        User seller = requireUser(authentication);

        if (seller.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can view sales history.");
        }

        return ResponseEntity.ok(orderRepository.findByListingSeller(seller));
    }
}

package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.Order;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.OrderRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

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

    // URL: POST http://localhost:8080/api/orders/checkout?buyerId=2&listingId=1
    @PostMapping("/checkout")
    public Order processCheckout(@RequestParam Long buyerId, @RequestParam Long listingId) {
        
        // 1. Find the buyer and the listing
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found!"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found!"));

        // 2. Create the new Escrow Order
        Order newOrder = new Order();
        newOrder.setBuyer(buyer);
        newOrder.setListing(listing);
        newOrder.setTotalAmount(listing.getPricePerUnit()); // Grabbing the price from the listing
        newOrder.setStatus(Order.Status.PAID_TO_ESCROW);
        
        // Generate a random 8-character Gate Pass code!
        newOrder.setGatePassCode("QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        // 3. Update the listing so no one else can buy it
        listing.setStatus(Listing.Status.PENDING_PICKUP);
        listingRepository.save(listing);

        // 4. Save and return the order
        return orderRepository.save(newOrder);
    }

    // THE NEW VERIFY-PICKUP ENDPOINT
    // URL: POST http://localhost:8080/api/orders/verify-pickup?gatePassCode=QR-XXXXX
    @PostMapping("/verify-pickup")
    public Order verifyPickup(@RequestParam String gatePassCode) {
        
        // 1. Find the order using the QR code
        Order order = orderRepository.findByGatePassCode(gatePassCode);
        
        // Security check: Does the code exist?
        if (order == null) {
            throw new RuntimeException("Invalid Gate Pass Code! Access Denied.");
        }
        
        // Security check: Has it already been picked up?
        if (order.getStatus() != Order.Status.PAID_TO_ESCROW) {
            throw new RuntimeException("This order has already been processed.");
        }

        // 2. Mark the Order as Completed (This would trigger the MoMo payout in real life)
        order.setStatus(Order.Status.COMPLETED);
        
        // 3. Update the associated Listing to show it's officially gone
        Listing listing = order.getListing();
        listing.setStatus(Listing.Status.SOLD);
        listingRepository.save(listing);

        // 4. Save and return the updated order
        return orderRepository.save(order);
    }
}
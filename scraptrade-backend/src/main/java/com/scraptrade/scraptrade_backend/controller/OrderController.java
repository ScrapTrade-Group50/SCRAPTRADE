package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.exception.PaystackApiException;
import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.Order;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.OrderRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.service.NotificationService;
import com.scraptrade.scraptrade_backend.service.PaymentService;
import com.scraptrade.scraptrade_backend.service.PaystackService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderRepository orderRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final Optional<PaymentService> paymentService;
    private final NotificationService notificationService;
    private final Optional<PaystackService> paystackService;
    private final String paymentProvider;
    private final boolean skipPaystackTransfers;

    public OrderController(
            OrderRepository orderRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            @Autowired(required = false) PaymentService paymentService,
            NotificationService notificationService,
            @Autowired(required = false) PaystackService paystackService,
            @Value("${payment.provider:simulated}") String paymentProvider,
            @Value("${payment.paystack.skip-transfers:false}") boolean skipPaystackTransfers) {
        this.orderRepository = orderRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.paymentService = Optional.ofNullable(paymentService);
        this.notificationService = notificationService;
        this.paystackService = Optional.ofNullable(paystackService);
        this.paymentProvider = paymentProvider;
        this.skipPaystackTransfers = skipPaystackTransfers;
    }

    private User requireUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new SecurityException("Authentication required.");
        }
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        return user;
    }

    private User requireArtisanBuyer(Authentication authentication) {
        User buyer = requireUser(authentication);
        if (buyer.getRole() != User.Role.ARTISAN_BUYER) {
            throw new SecurityException("Only artisan buyers can place orders.");
        }
        return buyer;
    }

    private Listing requireAvailableListing(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));
        if (!listing.getStatus().equals(Listing.Status.AVAILABLE)) {
            throw new IllegalStateException("Sorry, this item was just sold!");
        }
        return listing;
    }

    private BigDecimal calculateTotal(Listing listing) {
        BigDecimal price = listing.getPricePerUnit() != null ? listing.getPricePerUnit() : BigDecimal.ZERO;
        Double weight = listing.getWeight() != null ? listing.getWeight() : 0.0;
        return price.multiply(BigDecimal.valueOf(weight)).add(Order.ESCROW_FEE);
    }

    @PostMapping("/checkout/init")
    public Map<String, Object> initCheckout(
            @RequestParam Long listingId,
            @RequestParam(required = false) String callbackUrl,
            Authentication authentication) {

        User buyer = requireArtisanBuyer(authentication);
        Listing listing = requireAvailableListing(listingId);
        BigDecimal total = calculateTotal(listing);

        if ("paystack".equalsIgnoreCase(paymentProvider)) {
            PaystackService paystack = paystackService.orElseThrow(() ->
                    new IllegalStateException("Paystack is enabled but not configured on the server."));
            String reference = paystack.generateReference(listingId);
            PaystackService.InitializeResult initialized = paystack.initializeTransaction(
                    buyer.getEmail(), total, reference, listingId, callbackUrl);
            return Map.of(
                    "provider", "paystack",
                    "authorizationUrl", initialized.authorizationUrl(),
                    "reference", initialized.reference(),
                    "amount", total,
                    "listingId", listingId,
                    "publicKey", paystack.publicKey());
        }

        return Map.of(
                "provider", "simulated",
                "amount", total,
                "listingId", listingId);
    }

    @PostMapping("/checkout/complete")
    @Transactional
    public Order completeCheckout(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        User buyer = requireArtisanBuyer(authentication);
        String reference = body.get("reference");
        if (reference == null || reference.isBlank()) {
            throw new IllegalArgumentException("Payment reference is required.");
        }

        Order existing = orderRepository.findByPaymentReference(reference);
        if (existing != null) {
            if (!existing.getBuyer().getId().equals(buyer.getId())) {
                throw new SecurityException("This payment belongs to another account.");
            }
            return existing;
        }

        if (!reference.startsWith("ST-")) {
            throw new IllegalArgumentException("Invalid payment reference.");
        }

        Long listingId = parseListingIdFromReference(reference);
        Listing listing = requireAvailableListing(listingId);
        BigDecimal total = calculateTotal(listing);

        PaystackService paystack = paystackService.orElseThrow(() ->
                new IllegalStateException("Paystack is not configured on the server."));
        PaystackService.VerifyResult verified = paystack.verifyTransaction(reference, total);
        if (!verified.success()) {
            throw new IllegalStateException(verified.message());
        }

        return fulfillOrder(buyer, listing, total, reference, null);
    }

    /** Simulated/demo checkout — kept for local dev when payment.provider=simulated */
    @PostMapping("/checkout")
    @Transactional
    public Order processCheckout(
            @RequestParam Long listingId,
            @RequestParam(required = false) String momoNumber,
            Authentication authentication) {

        if ("paystack".equalsIgnoreCase(paymentProvider)) {
            throw new IllegalStateException("Use /orders/checkout/init and /orders/checkout/complete for Paystack payments.");
        }

        User buyer = requireArtisanBuyer(authentication);
        Listing listing = requireAvailableListing(listingId);
        BigDecimal total = calculateTotal(listing);

        PaymentService processor = paymentService.orElseThrow(() ->
                new IllegalStateException("Simulated payment is not configured on the server."));
        PaymentService.PaymentResult payment = processor.charge(
                momoNumber, total, "LISTING-" + listingId);
        if (!payment.success()) {
            throw new IllegalStateException(payment.message());
        }

        return fulfillOrder(buyer, listing, total, payment.transactionId(), momoNumber);
    }

    private Order fulfillOrder(
            User buyer,
            Listing listing,
            BigDecimal total,
            String paymentReference,
            String momoNumber) {

        Order newOrder = new Order();
        newOrder.setBuyer(buyer);
        newOrder.setListing(listing);
        newOrder.setTotalAmount(total);
        newOrder.setMomoNumber(momoNumber);
        newOrder.setPaymentReference(paymentReference);
        newOrder.setPayoutStatus(
                "paystack".equalsIgnoreCase(paymentProvider)
                        ? Order.PayoutStatus.PENDING
                        : Order.PayoutStatus.NOT_APPLICABLE);
        newOrder.setStatus(Order.Status.PAID_TO_ESCROW);
        newOrder.setGatePassCode("QR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        listing.setStatus(Listing.Status.PENDING_PICKUP);
        listingRepository.save(listing);

        Order savedOrder = orderRepository.save(newOrder);

        notificationService.create(
                listing.getSeller(),
                "New order received",
                "\"" + listing.getTitle() + "\" was purchased and paid into escrow. "
                        + "Scan the buyer's gate pass at pickup to release funds.",
                "ORDER_PAID",
                savedOrder.getId());

        return savedOrder;
    }

    private static Long parseListingIdFromReference(String reference) {
        String[] parts = reference.split("-");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Invalid payment reference format.");
        }
        try {
            return Long.parseLong(parts[1]);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid payment reference format.");
        }
    }

    @PostMapping("/verify-pickup")
    @Transactional
    public ResponseEntity<?> verifyPickup(@RequestParam String gatePassCode, Authentication authentication) {

        User factoryUser = requireUser(authentication);

        if (factoryUser.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can verify gate passes.");
        }

        String normalizedCode = gatePassCode == null ? "" : gatePassCode.trim().toUpperCase();
        if (normalizedCode.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a gate pass code."));
        }

        Order order = orderRepository.findByGatePassCode(normalizedCode);

        if (order == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid Gate Pass Code! Please check your typing."));
        }

        if (!order.getListing().getSeller().getId().equals(factoryUser.getId())) {
            throw new SecurityException(
                    "This gate pass is for another factory's order and cannot be verified at your location.");
        }

        if (order.getStatus() != Order.Status.PAID_TO_ESCROW) {
            return ResponseEntity.badRequest().body(Map.of("message", "This order has already been processed and picked up."));
        }

        User seller = order.getListing().getSeller();
        boolean payoutSkipped = releaseEscrowFunds(order, seller);

        order.setStatus(Order.Status.COMPLETED);

        Listing listing = order.getListing();
        listing.setStatus(Listing.Status.SOLD);
        listingRepository.save(listing);

        orderRepository.save(order);

        notificationService.create(
                order.getBuyer(),
                "Pickup confirmed",
                "Your pickup for \"" + listing.getTitle() + "\" was verified at the factory gate. "
                        + "The order is now complete.",
                "PICKUP_COMPLETED",
                order.getId());

        return ResponseEntity.ok(Map.of(
                "message", payoutSkipped
                        ? "Verification successful! Pickup complete (Paystack payout skipped — upgrade account for live transfers)."
                        : "Verification successful! Funds released to seller.",
                "payoutStatus", order.getPayoutStatus() != null ? order.getPayoutStatus().name() : "NOT_APPLICABLE",
                "payoutSkipped", payoutSkipped));
    }

    /** @return true when pickup completed without a Paystack transfer (dev / skip-transfers mode) */
    private boolean releaseEscrowFunds(Order order, User seller) {
        if (!"paystack".equalsIgnoreCase(paymentProvider)) {
            order.setPayoutStatus(Order.PayoutStatus.NOT_APPLICABLE);
            return false;
        }

        if (order.getPayoutStatus() == Order.PayoutStatus.RELEASED) {
            return false;
        }

        if (skipPaystackTransfers) {
            log.info("Skipping Paystack transfer for order {} (payment.paystack.skip-transfers=true)", order.getId());
            order.setPayoutStatus(Order.PayoutStatus.NOT_APPLICABLE);
            return true;
        }

        String recipientCode = seller.getPaystackRecipientCode();
        if (recipientCode == null || recipientCode.isBlank()) {
            throw new IllegalStateException(
                    "Set up your payout MoMo account (Profile → Payout Account) before scanning gate passes.");
        }

        PaystackService paystack = paystackService.orElseThrow(() ->
                new IllegalStateException("Paystack is not configured on the server."));

        BigDecimal sellerAmount = order.getTotalAmount().subtract(Order.ESCROW_FEE);
        if (sellerAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalStateException("Invalid seller payout amount.");
        }

        String payoutRef = order.getPayoutReference();
        if (payoutRef == null || payoutRef.isBlank()) {
            payoutRef = "PAYOUT-ORDER-" + order.getId();
        }

        try {
            PaystackService.TransferResult transfer = paystack.initiateTransfer(
                    recipientCode,
                    sellerAmount,
                    payoutRef,
                    "SCRAPTRADE escrow release for order " + order.getId());

            order.setPayoutReference(transfer.reference());
            order.setSellerPayoutAmount(sellerAmount);
            order.setPayoutStatus(Order.PayoutStatus.RELEASED);
            return false;
        } catch (PaystackApiException ex) {
            throw new IllegalStateException(ex.getMessage());
        }
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

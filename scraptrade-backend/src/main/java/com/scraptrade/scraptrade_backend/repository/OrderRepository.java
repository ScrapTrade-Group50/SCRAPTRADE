package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.Order;
import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Order findByGatePassCode(String gatePassCode);

    Order findByPaymentReference(String paymentReference);

    List<Order> findByBuyer(User buyer);

    List<Order> findByListingSeller(User seller);

    @Query(
            "SELECT o FROM Order o JOIN FETCH o.listing l LEFT JOIN FETCH l.seller WHERE o.buyer = :buyer ORDER BY o.id DESC")
    List<Order> findByBuyerWithDetails(@Param("buyer") User buyer);

    @Query(
            "SELECT o FROM Order o JOIN FETCH o.listing l LEFT JOIN FETCH l.seller JOIN FETCH o.buyer WHERE l.seller = :seller ORDER BY o.id DESC")
    List<Order> findByListingSellerWithDetails(@Param("seller") User seller);

    void deleteByBuyer(User buyer);

    void deleteByListing(Listing listing);
}

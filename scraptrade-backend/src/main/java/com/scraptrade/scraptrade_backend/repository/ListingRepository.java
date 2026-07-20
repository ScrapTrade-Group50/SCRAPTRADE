package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByStatus(Listing.Status status);

    List<Listing> findByTitleContainingIgnoreCaseAndStatus(String title, Listing.Status status);

    List<Listing> findBySeller(User seller);

    @Query("SELECT l FROM Listing l JOIN FETCH l.seller WHERE l.status = :status ORDER BY l.id DESC")
    List<Listing> findByStatusWithSeller(@Param("status") Listing.Status status);

    @Query("SELECT l FROM Listing l JOIN FETCH l.seller WHERE l.seller = :seller")
    List<Listing> findBySellerWithSeller(@Param("seller") User seller);

    @Query("SELECT l FROM Listing l JOIN FETCH l.seller WHERE l.id = :id")
    Optional<Listing> findByIdWithSeller(@Param("id") Long id);
}

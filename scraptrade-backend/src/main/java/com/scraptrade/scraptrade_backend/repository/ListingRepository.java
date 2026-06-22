package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByStatus(Listing.Status status);
    List<Listing> findByTitleContainingIgnoreCaseAndStatus(String title, Listing.Status status);
}
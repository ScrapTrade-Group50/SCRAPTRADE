package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.SavedListing;
import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedListingRepository extends JpaRepository<SavedListing, Long> {
    List<SavedListing> findByUserOrderBySavedAtDesc(User user);

    boolean existsByUserAndListing(User user, Listing listing);

    SavedListing findByUserAndListing(User user, Listing listing);

    void deleteByUserAndListing(User user, Listing listing);

    void deleteByUser(User user);

    void deleteByListing(Listing listing);
}

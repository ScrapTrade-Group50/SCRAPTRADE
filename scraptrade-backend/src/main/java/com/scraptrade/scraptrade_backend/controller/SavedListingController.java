package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.SavedListing;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.SavedListingRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-listings")
public class SavedListingController {

    private final SavedListingRepository savedListingRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public SavedListingController(
            SavedListingRepository savedListingRepository,
            ListingRepository listingRepository,
            UserRepository userRepository) {
        this.savedListingRepository = savedListingRepository;
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

    @GetMapping
    public List<Listing> getSavedListings(Authentication authentication) {
        User user = requireUser(authentication);
        return savedListingRepository.findByUserOrderBySavedAtDesc(user).stream()
                .map(SavedListing::getListing)
                .toList();
    }

    @GetMapping("/ids")
    public List<Long> getSavedListingIds(Authentication authentication) {
        User user = requireUser(authentication);
        return savedListingRepository.findByUserOrderBySavedAtDesc(user).stream()
                .map(saved -> saved.getListing().getId())
                .toList();
    }

    @PostMapping("/{listingId}")
    public ResponseEntity<?> saveListing(@PathVariable Long listingId, Authentication authentication) {
        User user = requireUser(authentication);
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        if (!savedListingRepository.existsByUserAndListing(user, listing)) {
            SavedListing saved = new SavedListing();
            saved.setUser(user);
            saved.setListing(listing);
            saved.setSavedAt(LocalDateTime.now());
            savedListingRepository.save(saved);
        }

        return ResponseEntity.ok(Map.of("message", "Listing saved.", "saved", true));
    }

    @DeleteMapping("/{listingId}")
    @Transactional
    public ResponseEntity<?> unsaveListing(@PathVariable Long listingId, Authentication authentication) {
        User user = requireUser(authentication);
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        savedListingRepository.deleteByUserAndListing(user, listing);
        return ResponseEntity.ok(Map.of("message", "Listing removed.", "saved", false));
    }
}

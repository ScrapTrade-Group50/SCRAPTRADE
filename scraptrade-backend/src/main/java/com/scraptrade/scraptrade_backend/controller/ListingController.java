package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.SavedListingRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.service.FileUploadService;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final SavedListingRepository savedListingRepository;

    public ListingController(
            ListingRepository listingRepository,
            UserRepository userRepository,
            FileUploadService fileUploadService,
            SavedListingRepository savedListingRepository) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.fileUploadService = fileUploadService;
        this.savedListingRepository = savedListingRepository;
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

    @GetMapping
    public List<Listing> getAvailableListings() {
        return listingRepository.findByStatus(Listing.Status.AVAILABLE);
    }

    @GetMapping("/mine")
    public List<Listing> getMyListings(Authentication authentication) {
        User seller = requireUser(authentication);
        if (seller.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can view their inventory.");
        }
        return listingRepository.findBySeller(seller);
    }

    @GetMapping("/search")
    public List<Listing> searchListings(@RequestParam String keyword) {
        return listingRepository.findByTitleContainingIgnoreCaseAndStatus(keyword, Listing.Status.AVAILABLE);
    }

    @PostMapping
    public Listing createListing(@RequestBody Listing newListing, Authentication authentication) {
        User seller = requireUser(authentication);

        if (seller.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can create listings.");
        }

        newListing.setSeller(seller);
        newListing.setStatus(Listing.Status.AVAILABLE);

        return listingRepository.save(newListing);
    }

    @PostMapping("/{id}/image")
    public Listing uploadListingImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) throws Exception {
        User seller = requireUser(authentication);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new SecurityException("You can only upload images for your own listings.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No image file was received. Choose a photo and try again.");
        }

        String cloudUrl = fileUploadService.uploadImage(file);
        listing.setImageUrl(cloudUrl);
        return listingRepository.save(listing);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deleteListing(@PathVariable Long id, Authentication authentication) {
        User seller = requireUser(authentication);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new SecurityException("You can only delete your own listings.");
        }

        if (listing.getStatus() != Listing.Status.AVAILABLE) {
            throw new IllegalStateException("Cannot delete a listing that has an active order.");
        }

        savedListingRepository.deleteByListing(listing);
        listingRepository.delete(listing);
    }

    @PutMapping("/{id}")
    public Listing updateListing(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates,
            Authentication authentication) {

        User seller = requireUser(authentication);

        if (seller.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can update listings.");
        }

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new SecurityException("You can only update your own listings.");
        }

        if (listing.getStatus() != Listing.Status.AVAILABLE) {
            throw new IllegalStateException("Cannot edit a listing that is pending pickup or sold.");
        }

        if (updates.containsKey("title") && updates.get("title") != null) {
            listing.setTitle(updates.get("title").toString());
        }
        if (updates.containsKey("description")) {
            listing.setDescription(updates.get("description") != null ? updates.get("description").toString() : null);
        }
        if (updates.containsKey("category") && updates.get("category") != null) {
            listing.setCategory(updates.get("category").toString());
        }
        if (updates.containsKey("weight") && updates.get("weight") != null) {
            listing.setWeight(Double.valueOf(updates.get("weight").toString()));
        }
        if (updates.containsKey("dimensions")) {
            listing.setDimensions(updates.get("dimensions") != null ? updates.get("dimensions").toString() : null);
        }
        if (updates.containsKey("pickupLocation") && updates.get("pickupLocation") != null) {
            listing.setPickupLocation(updates.get("pickupLocation").toString());
        }
        if (updates.containsKey("pricePerUnit") && updates.get("pricePerUnit") != null) {
            listing.setPricePerUnit(new java.math.BigDecimal(updates.get("pricePerUnit").toString()));
        }

        return listingRepository.save(listing);
    }

    @GetMapping("/{id}")
    public Listing getListingById(@PathVariable Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));
    }
}

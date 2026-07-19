package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.service.FileUploadService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    public ListingController(ListingRepository listingRepository, UserRepository userRepository, FileUploadService fileUploadService) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.fileUploadService = fileUploadService;
    }

    private User requireUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        return user;
    }

    @GetMapping("/test")
    public String testEndpoint() {
        return "SCRAPTRADE API is live and working!";
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
    public Listing uploadListingImage(@PathVariable Long id, @RequestParam("file") MultipartFile file, Authentication authentication) throws Exception {
        User seller = requireUser(authentication);

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));

        if (!listing.getSeller().getId().equals(seller.getId())) {
            throw new SecurityException("You can only upload images for your own listings.");
        }

        String cloudUrl = fileUploadService.uploadImage(file);
        listing.setImageUrl(cloudUrl);
        return listingRepository.save(listing);
    }

    @DeleteMapping("/{id}")
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

        listingRepository.delete(listing);
    }

    @GetMapping("/{id}")
    public Listing getListingById(@PathVariable Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found!"));
    }
}

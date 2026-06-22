package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.service.FileUploadService; // 1. The new service import
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // 2. Required for handling the image file

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService; // 3. Clean and simple

    // 4. The Constructor (Notice the "this." keywords!)
    public ListingController(ListingRepository listingRepository, UserRepository userRepository, FileUploadService fileUploadService) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.fileUploadService = fileUploadService; 
    }

    @GetMapping("/test")
    public String testEndpoint() {
        return "SCRAPTRADE API is live and working!";
    }

    @GetMapping
    public List<Listing> getAvailableListings() {
        return listingRepository.findByStatus(Listing.Status.AVAILABLE);
    }

    @GetMapping("/search")
    public List<Listing> searchListings(@RequestParam String keyword) {
        return listingRepository.findByTitleContainingIgnoreCaseAndStatus(keyword, Listing.Status.AVAILABLE);
    }

    @PostMapping
    public Listing createListing(@RequestBody Listing newListing, @RequestParam Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found!"));
        
        newListing.setSeller(seller);
        newListing.setStatus(Listing.Status.AVAILABLE);
        
        return listingRepository.save(newListing);
    }

    // THE NEW IMAGE UPLOAD ENDPOINT
    // URL: POST http://localhost:8080/api/listings/1/image
    @PostMapping("/{id}/image")
    public Listing uploadListingImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws Exception {
        
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found!"));

        String cloudUrl = fileUploadService.uploadImage(file);

        listing.setImageUrl(cloudUrl);
        return listingRepository.save(listing);
    }

    // THE NEW DELETE ENDPOINT
    // URL: DELETE http://localhost:8080/api/listings/{id}
    @DeleteMapping("/{id}")
    public void deleteListing(@PathVariable Long id) {
        // Find it, and if it exists, delete it!
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found!"));
        
        listingRepository.delete(listing);
    }

    // THE NEW SINGLE ITEM ENDPOINT
    // URL: GET http://localhost:8080/api/listings/{id}
    @GetMapping("/{id}")
    public Listing getListingById(@PathVariable Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found!"));
    }
}
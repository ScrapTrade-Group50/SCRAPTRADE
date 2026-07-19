package com.scraptrade.scraptrade_backend.config;

import com.scraptrade.scraptrade_backend.model.Listing;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.ListingRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@Configuration
@Profile("dev")
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            ListingRepository listingRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            User factory = seedUser(userRepository, passwordEncoder,
                    "factory@test.com", "Kumasi Steel Works", "0241234567",
                    "hashed_password_123", User.Role.FACTORY_SELLER);

            seedUser(userRepository, passwordEncoder,
                    "artisan@test.com", "Suame Welders Hub", "0249876543",
                    "hashed_password_456", User.Role.ARTISAN_BUYER);

            seedSampleListing(listingRepository, factory);
        };
    }

    private User seedUser(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String companyName,
            String phone,
            String rawPassword,
            User.Role role) {

        User existing = userRepository.findByEmail(email);
        if (existing == null) {
            User user = new User();
            user.setEmail(email);
            user.setCompanyName(companyName);
            user.setPhoneNumber(phone);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            userRepository.save(user);
            System.out.println("TEST USER CREATED: " + email);
            return user;
        }

        if (!existing.getPasswordHash().startsWith("$2a$")) {
            existing.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(existing);
            System.out.println("TEST USER PASSWORD RE-HASHED: " + email);
        }
        return existing;
    }

    /** Gives artisans something to buy and factory@test.com a listing to scan against in dev. */
    private void seedSampleListing(ListingRepository listingRepository, User factory) {
        boolean hasListing = listingRepository.findBySeller(factory).stream()
                .anyMatch(l -> "Dev Sample Copper Off-Cuts".equals(l.getTitle()));

        if (hasListing) {
            return;
        }

        Listing listing = new Listing();
        listing.setSeller(factory);
        listing.setTitle("Dev Sample Copper Off-Cuts");
        listing.setDescription("Seeded listing for local testing. Buy as artisan@test.com, then scan as factory@test.com.");
        listing.setCategory("METAL");
        listing.setWeight(25.0);
        listing.setDimensions("Mixed lengths, 2–4 m");
        listing.setPickupLocation("Plot 12, Spintex Road, Accra");
        listing.setPricePerUnit(new BigDecimal("5.50"));
        listing.setStatus(Listing.Status.AVAILABLE);
        listingRepository.save(listing);
        System.out.println("DEV SAMPLE LISTING CREATED for factory@test.com");
    }
}

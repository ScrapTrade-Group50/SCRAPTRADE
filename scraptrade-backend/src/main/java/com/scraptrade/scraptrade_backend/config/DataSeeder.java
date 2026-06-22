package com.scraptrade.scraptrade_backend.config;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            // Only create the user if the database is completely empty
            if (userRepository.count() == 0) {
                // 1. Create the Factory Seller
                User factoryUser = new User();
                factoryUser.setCompanyName("Kumasi Steel Works");
                factoryUser.setEmail("factory@test.com");
                factoryUser.setPhoneNumber("0241234567");
                factoryUser.setPasswordHash("hashed_password_123"); 
                factoryUser.setRole(User.Role.FACTORY_SELLER);
                userRepository.save(factoryUser);
                System.out.println("🤖 TEST FACTORY CREATED: ID 1");

                // 2. Create the Artisan Buyer
                User artisanUser = new User();
                artisanUser.setCompanyName("Suame Welders Hub");
                artisanUser.setEmail("artisan@test.com");
                artisanUser.setPhoneNumber("0249876543");
                artisanUser.setPasswordHash("hashed_password_456");
                artisanUser.setRole(User.Role.ARTISAN_BUYER);
                userRepository.save(artisanUser);
                System.out.println("🤖 TEST ARTISAN CREATED: ID 2");
            }
        };
    }
}
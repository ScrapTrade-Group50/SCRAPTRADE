package com.scraptrade.scraptrade_backend.config;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            seedUser(userRepository, passwordEncoder,
                    "factory@test.com", "Kumasi Steel Works", "0241234567",
                    "hashed_password_123", User.Role.FACTORY_SELLER);

            seedUser(userRepository, passwordEncoder,
                    "artisan@test.com", "Suame Welders Hub", "0249876543",
                    "hashed_password_456", User.Role.ARTISAN_BUYER);
        };
    }

    private void seedUser(
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
        } else if (!existing.getPasswordHash().startsWith("$2a$")) {
            existing.setPasswordHash(passwordEncoder.encode(rawPassword));
            userRepository.save(existing);
            System.out.println("TEST USER PASSWORD RE-HASHED: " + email);
        }
    }
}

package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    User findByResetToken(String resetToken);
}
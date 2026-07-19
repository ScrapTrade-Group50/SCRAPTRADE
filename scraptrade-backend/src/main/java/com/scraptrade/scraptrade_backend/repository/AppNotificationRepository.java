package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.AppNotification;
import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByUserOrderByCreatedAtDesc(User user);

    long countByUserAndReadIsFalse(User user);

    void deleteByUser(User user);
}

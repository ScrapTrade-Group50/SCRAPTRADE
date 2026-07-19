package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.AppNotification;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.AppNotificationRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final AppNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationController(
            AppNotificationRepository notificationRepository,
            UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
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
    public List<AppNotification> getNotifications(Authentication authentication) {
        User user = requireUser(authentication);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication authentication) {
        User user = requireUser(authentication);
        return Map.of("count", notificationRepository.countByUserAndReadIsFalse(user));
    }

    @PatchMapping("/{id}/read")
    public AppNotification markRead(@PathVariable Long id, Authentication authentication) {
        User user = requireUser(authentication);
        AppNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found!"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You can only update your own notifications.");
        }
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        User user = requireUser(authentication);
        List<AppNotification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        for (AppNotification n : notifications) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}

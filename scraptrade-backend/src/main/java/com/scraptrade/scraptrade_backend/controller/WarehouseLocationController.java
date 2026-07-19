package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.model.WarehouseLocation;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import com.scraptrade.scraptrade_backend.repository.WarehouseLocationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warehouse-locations")
public class WarehouseLocationController {

    private final WarehouseLocationRepository warehouseLocationRepository;
    private final UserRepository userRepository;

    public WarehouseLocationController(
            WarehouseLocationRepository warehouseLocationRepository,
            UserRepository userRepository) {
        this.warehouseLocationRepository = warehouseLocationRepository;
        this.userRepository = userRepository;
    }

    private User requireFactory(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        if (user.getRole() != User.Role.FACTORY_SELLER) {
            throw new SecurityException("Only factory sellers can manage warehouse locations.");
        }
        return user;
    }

    @GetMapping
    public List<WarehouseLocation> getLocations(Authentication authentication) {
        User user = requireFactory(authentication);
        return warehouseLocationRepository.findByUserOrderByIsPrimaryDescIdAsc(user);
    }

    @PostMapping
    @Transactional
    public WarehouseLocation addLocation(@RequestBody Map<String, Object> body, Authentication authentication) {
        User user = requireFactory(authentication);

        WarehouseLocation location = new WarehouseLocation();
        location.setUser(user);
        location.setName(requireText(body.get("name"), "Warehouse name is required."));
        location.setAddress(body.get("address") != null ? body.get("address").toString().trim() : null);

        boolean makePrimary = Boolean.TRUE.equals(body.get("isPrimary"))
                || warehouseLocationRepository.countByUser(user) == 0;
        if (makePrimary) {
            clearPrimary(user);
            location.setPrimary(true);
        }

        return warehouseLocationRepository.save(location);
    }

    @PutMapping("/{id}")
    @Transactional
    public WarehouseLocation updateLocation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        User user = requireFactory(authentication);
        WarehouseLocation location = ownedLocation(id, user);

        if (body.containsKey("name") && body.get("name") != null) {
            location.setName(requireText(body.get("name"), "Warehouse name is required."));
        }
        if (body.containsKey("address")) {
            location.setAddress(body.get("address") != null ? body.get("address").toString().trim() : null);
        }
        if (Boolean.TRUE.equals(body.get("isPrimary"))) {
            clearPrimary(user);
            location.setPrimary(true);
        }

        return warehouseLocationRepository.save(location);
    }

    @PatchMapping("/{id}/primary")
    @Transactional
    public WarehouseLocation setPrimary(@PathVariable Long id, Authentication authentication) {
        User user = requireFactory(authentication);
        WarehouseLocation location = ownedLocation(id, user);
        clearPrimary(user);
        location.setPrimary(true);
        return warehouseLocationRepository.save(location);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteLocation(@PathVariable Long id, Authentication authentication) {
        User user = requireFactory(authentication);
        WarehouseLocation location = ownedLocation(id, user);
        boolean wasPrimary = location.isPrimary();
        warehouseLocationRepository.delete(location);

        if (wasPrimary) {
            List<WarehouseLocation> remaining = warehouseLocationRepository.findByUserOrderByIsPrimaryDescIdAsc(user);
            if (!remaining.isEmpty()) {
                WarehouseLocation next = remaining.get(0);
                next.setPrimary(true);
                warehouseLocationRepository.save(next);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Location removed."));
    }

    private WarehouseLocation ownedLocation(Long id, User user) {
        WarehouseLocation location = warehouseLocationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Location not found!"));
        if (!location.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You can only manage your own locations.");
        }
        return location;
    }

    private void clearPrimary(User user) {
        List<WarehouseLocation> locations = warehouseLocationRepository.findByUserOrderByIsPrimaryDescIdAsc(user);
        for (WarehouseLocation w : locations) {
            if (w.isPrimary()) {
                w.setPrimary(false);
                warehouseLocationRepository.save(w);
            }
        }
    }

    private String requireText(Object raw, String message) {
        if (raw == null || raw.toString().trim().isEmpty()) {
            throw new IllegalArgumentException(message);
        }
        return raw.toString().trim();
    }
}

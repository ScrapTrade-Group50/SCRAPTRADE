package com.scraptrade.scraptrade_backend.controller;

import com.scraptrade.scraptrade_backend.model.MomoWallet;
import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.repository.MomoWalletRepository;
import com.scraptrade.scraptrade_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/momo-wallets")
public class MomoWalletController {

    private final MomoWalletRepository momoWalletRepository;
    private final UserRepository userRepository;

    public MomoWalletController(MomoWalletRepository momoWalletRepository, UserRepository userRepository) {
        this.momoWalletRepository = momoWalletRepository;
        this.userRepository = userRepository;
    }

    private User requireUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found!");
        }
        return user;
    }

    private String normalizeMsisdn(Object raw) {
        if (raw == null) {
            throw new IllegalArgumentException("MoMo number is required.");
        }
        String msisdn = raw.toString().replaceAll("\\D", "");
        if (msisdn.length() < 10) {
            throw new IllegalArgumentException("Please enter a valid 10-digit MoMo number.");
        }
        return msisdn;
    }

    @GetMapping
    public List<MomoWallet> getWallets(Authentication authentication) {
        User user = requireUser(authentication);
        return momoWalletRepository.findByUserOrderByIsDefaultDescIdAsc(user);
    }

    @PostMapping
    @Transactional
    public MomoWallet addWallet(@RequestBody Map<String, Object> body, Authentication authentication) {
        User user = requireUser(authentication);

        MomoWallet wallet = new MomoWallet();
        wallet.setUser(user);
        wallet.setMsisdn(normalizeMsisdn(body.get("msisdn")));
        wallet.setLabel(body.get("label") != null ? body.get("label").toString().trim() : "MTN MoMo");

        boolean makeDefault = Boolean.TRUE.equals(body.get("isDefault"))
                || momoWalletRepository.countByUser(user) == 0;
        if (makeDefault) {
            clearDefaults(user);
            wallet.setDefault(true);
        }

        return momoWalletRepository.save(wallet);
    }

    @PutMapping("/{id}")
    @Transactional
    public MomoWallet updateWallet(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        User user = requireUser(authentication);
        MomoWallet wallet = ownedWallet(id, user);

        if (body.containsKey("msisdn")) {
            wallet.setMsisdn(normalizeMsisdn(body.get("msisdn")));
        }
        if (body.containsKey("label") && body.get("label") != null) {
            wallet.setLabel(body.get("label").toString().trim());
        }
        if (Boolean.TRUE.equals(body.get("isDefault"))) {
            clearDefaults(user);
            wallet.setDefault(true);
        }

        return momoWalletRepository.save(wallet);
    }

    @PatchMapping("/{id}/default")
    @Transactional
    public MomoWallet setDefault(@PathVariable Long id, Authentication authentication) {
        User user = requireUser(authentication);
        MomoWallet wallet = ownedWallet(id, user);
        clearDefaults(user);
        wallet.setDefault(true);
        return momoWalletRepository.save(wallet);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteWallet(@PathVariable Long id, Authentication authentication) {
        User user = requireUser(authentication);
        MomoWallet wallet = ownedWallet(id, user);
        boolean wasDefault = wallet.isDefault();
        momoWalletRepository.delete(wallet);

        if (wasDefault) {
            List<MomoWallet> remaining = momoWalletRepository.findByUserOrderByIsDefaultDescIdAsc(user);
            if (!remaining.isEmpty()) {
                MomoWallet next = remaining.get(0);
                next.setDefault(true);
                momoWalletRepository.save(next);
            }
        }

        return ResponseEntity.ok(Map.of("message", "Wallet removed."));
    }

    private MomoWallet ownedWallet(Long id, User user) {
        MomoWallet wallet = momoWalletRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Wallet not found!"));
        if (!wallet.getUser().getId().equals(user.getId())) {
            throw new SecurityException("You can only manage your own wallets.");
        }
        return wallet;
    }

    private void clearDefaults(User user) {
        List<MomoWallet> wallets = momoWalletRepository.findByUserOrderByIsDefaultDescIdAsc(user);
        for (MomoWallet w : wallets) {
            if (w.isDefault()) {
                w.setDefault(false);
                momoWalletRepository.save(w);
            }
        }
    }
}

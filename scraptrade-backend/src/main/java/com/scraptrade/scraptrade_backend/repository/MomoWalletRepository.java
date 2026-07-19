package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.MomoWallet;
import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MomoWalletRepository extends JpaRepository<MomoWallet, Long> {
    List<MomoWallet> findByUserOrderByIsDefaultDescIdAsc(User user);

    long countByUser(User user);

    void deleteByUser(User user);
}

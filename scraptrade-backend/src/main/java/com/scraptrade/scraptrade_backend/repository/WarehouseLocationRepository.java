package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.User;
import com.scraptrade.scraptrade_backend.model.WarehouseLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarehouseLocationRepository extends JpaRepository<WarehouseLocation, Long> {
    List<WarehouseLocation> findByUserOrderByIsPrimaryDescIdAsc(User user);

    long countByUser(User user);

    void deleteByUser(User user);
}

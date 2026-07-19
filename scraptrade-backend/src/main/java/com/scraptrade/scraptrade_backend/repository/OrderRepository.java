package com.scraptrade.scraptrade_backend.repository;

import com.scraptrade.scraptrade_backend.model.Order;
import com.scraptrade.scraptrade_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Order findByGatePassCode(String gatePassCode);

    Order findByPaymentReference(String paymentReference);

    List<Order> findByBuyer(User buyer);

    List<Order> findByListingSeller(User seller);
}

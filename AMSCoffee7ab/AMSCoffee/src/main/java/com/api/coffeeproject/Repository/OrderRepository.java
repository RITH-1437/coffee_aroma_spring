package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.OrderModel;
import com.api.coffeeproject.Model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<OrderModel, Long> {
    
    // Find orders by status
    List<OrderModel> findByStatus(OrderStatus status);
    
    // Find orders by customer email
    List<OrderModel> findByCustomerEmail(String customerEmail);
    
    // Find orders by user ID
    List<OrderModel> findByUserId(Long userId);
    
    // Find order by order number
    Optional<OrderModel> findByOrderNumber(String orderNumber);
    
    // Find orders ordered by creation date (newest first)
    @Query("SELECT o FROM OrderModel o ORDER BY o.createdAt DESC")
    List<OrderModel> findAllOrderByCreatedAtDesc();
    
    // Count orders by status
    long countByStatus(OrderStatus status);
    
    // Get total revenue from completed orders
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM OrderModel o WHERE o.status = :status")
    Double getTotalRevenueByStatus(@Param("status") OrderStatus status);
}

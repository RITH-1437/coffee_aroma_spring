package com.api.coffeeproject.Service;

import com.api.coffeeproject.Model.OrderModel;
import com.api.coffeeproject.Model.OrderStatus;
import com.api.coffeeproject.Repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private TelegramService telegramService;

    // Get all orders (newest first)
    public List<OrderModel> getAllOrders() {
        try {
            return orderRepository.findAllOrderByCreatedAtDesc();
        } catch (Exception e) {
            System.err.println("❌ Error fetching all orders: " + e.getMessage());
            return orderRepository.findAll(); // Fallback to default order
        }
    }

    // Get order by ID
    public Optional<OrderModel> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    // Save or update order
    public OrderModel saveOrder(OrderModel order) {
        try {
            if (order.getId() == null) {
                // New order - generate order number if not provided
                if (order.getOrderNumber() == null || order.getOrderNumber().isEmpty()) {
                    order.setOrderNumber(generateOrderNumber());
                }
                order.setCreatedAt(LocalDateTime.now());
                System.out.println("💾 Creating new order: " + order.getOrderNumber());
            } else {
                System.out.println("💾 Updating existing order: " + order.getOrderNumber());
            }
            
            order.setUpdatedAt(LocalDateTime.now());
            
            // Validate required fields
            if (order.getCustomerName() == null || order.getCustomerName().trim().isEmpty()) {
                throw new IllegalArgumentException("Customer name is required");
            }
            if (order.getCustomerEmail() == null || order.getCustomerEmail().trim().isEmpty()) {
                throw new IllegalArgumentException("Customer email is required");
            }
            if (order.getTotalAmount() == null || order.getTotalAmount() <= 0) {
                throw new IllegalArgumentException("Valid total amount is required");
            }
            
            // Check if this is a new order before saving
            boolean isNewOrder = (order.getId() == null);
            
            OrderModel savedOrder = orderRepository.save(order);
            System.out.println("✅ Successfully saved order: " + savedOrder.getOrderNumber() + " (ID: " + savedOrder.getId() + ")");
            
            // Debug: Verify the order was actually saved
            Optional<OrderModel> verifyOrder = orderRepository.findById(savedOrder.getId());
            if (verifyOrder.isPresent()) {
                System.out.println("🔍 VERIFIED: Order " + savedOrder.getId() + " exists in database");
            } else {
                System.err.println("⚠️ WARNING: Order " + savedOrder.getId() + " NOT found in database after save!");
            }
            
            // Send Telegram notification for new orders asynchronously
            if (isNewOrder) {
                try {
                    System.out.println("📱 Scheduling Telegram notification for new order: " + savedOrder.getOrderNumber());
                    // Use async method - this won't block the order creation
                    telegramService.sendOrderNotificationAsync(savedOrder)
                        .whenComplete((result, error) -> {
                            if (error != null) {
                                System.err.println("⚠️ Failed to send Telegram notification for order " + savedOrder.getOrderNumber() + ": " + error.getMessage());
                                error.printStackTrace();
                            } else {
                                System.out.println("✅ Telegram notification sent successfully for order: " + savedOrder.getOrderNumber());
                            }
                        });
                    System.out.println("📱 Telegram notification scheduled - order creation continuing...");
                } catch (Exception e) {
                    // Don't fail the order creation if Telegram notification scheduling fails
                    System.err.println("⚠️ Failed to schedule Telegram notification for order " + savedOrder.getOrderNumber() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
            
            return savedOrder;
            
        } catch (Exception e) {
            System.err.println("❌ Error saving order: " + e.getMessage());
            throw new RuntimeException("Failed to save order: " + e.getMessage(), e);
        }
    }

    // Delete order
    public void deleteOrder(Long id) {
        try {
            if (!orderRepository.existsById(id)) {
                throw new IllegalArgumentException("Order not found with ID: " + id);
            }
            
            orderRepository.deleteById(id);
            System.out.println("✅ Successfully deleted order with ID: " + id);
            
        } catch (Exception e) {
            System.err.println("❌ Error deleting order: " + e.getMessage());
            throw new RuntimeException("Failed to delete order: " + e.getMessage(), e);
        }
    }

    // Update order status
    public OrderModel updateOrderStatus(Long id, OrderStatus status) {
        try {
            Optional<OrderModel> orderOpt = orderRepository.findById(id);
            if (orderOpt.isEmpty()) {
                throw new IllegalArgumentException("Order not found with ID: " + id);
            }
            
            OrderModel order = orderOpt.get();
            OrderStatus oldStatus = order.getStatus();
            order.setStatus(status);
            order.setUpdatedAt(LocalDateTime.now());
            
            OrderModel savedOrder = orderRepository.save(order);
            System.out.println("✅ Successfully updated order status: " + savedOrder.getOrderNumber() + " from " + oldStatus + " to " + status);
            return savedOrder;
            
        } catch (Exception e) {
            System.err.println("❌ Error updating order status: " + e.getMessage());
            throw new RuntimeException("Failed to update order status: " + e.getMessage(), e);
        }
    }

    // Get orders by status
    public List<OrderModel> getOrdersByStatus(OrderStatus status) {
        try {
            return orderRepository.findByStatus(status);
        } catch (Exception e) {
            System.err.println("❌ Error fetching orders by status: " + e.getMessage());
            // Fallback to stream filtering
            return orderRepository.findAll().stream()
                    .filter(order -> order.getStatus() == status)
                    .toList();
        }
    }

    // Get orders by user ID
    public List<OrderModel> getOrdersByUserId(Long userId) {
        try {
            return orderRepository.findByUserId(userId);
        } catch (Exception e) {
            System.err.println("❌ Error fetching orders by user ID: " + e.getMessage());
            // Fallback to stream filtering
            return orderRepository.findAll().stream()
                    .filter(order -> order.getUserId() != null && order.getUserId().equals(userId))
                    .toList();
        }
    }

    // Generate unique order number
    private String generateOrderNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        return "ORD-" + timestamp.substring(timestamp.length() - 8);
    }

    // Get orders count by status
    public long getOrdersCountByStatus(OrderStatus status) {
        try {
            return orderRepository.countByStatus(status);
        } catch (Exception e) {
            System.err.println("❌ Error counting orders by status: " + e.getMessage());
            // Fallback to stream counting
            return orderRepository.findAll().stream()
                    .filter(order -> order.getStatus() == status)
                    .count();
        }
    }

    // Get total orders count
    public long getTotalOrdersCount() {
        return orderRepository.count();
    }

    // Get total revenue from completed orders
    public double getTotalRevenue() {
        try {
            Double revenue = orderRepository.getTotalRevenueByStatus(OrderStatus.completed);
            return revenue != null ? revenue : 0.0;
        } catch (Exception e) {
            System.err.println("❌ Error calculating total revenue: " + e.getMessage());
            // Fallback to stream calculation
            return orderRepository.findAll().stream()
                    .filter(order -> order.getStatus() == OrderStatus.completed)
                    .mapToDouble(OrderModel::getTotalAmount)
                    .sum();
        }
    }
    
    // Additional utility methods
    
    // Find order by order number
    public Optional<OrderModel> getOrderByOrderNumber(String orderNumber) {
        try {
            return orderRepository.findByOrderNumber(orderNumber);
        } catch (Exception e) {
            System.err.println("❌ Error finding order by number: " + e.getMessage());
            return Optional.empty();
        }
    }
    
    // Check if order exists
    public boolean existsById(Long id) {
        try {
            return orderRepository.existsById(id);
        } catch (Exception e) {
            System.err.println("❌ Error checking order existence: " + e.getMessage());
            return false;
        }
    }
}
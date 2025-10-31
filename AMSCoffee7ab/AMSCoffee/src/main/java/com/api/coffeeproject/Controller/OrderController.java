package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.OrderModel;
import com.api.coffeeproject.Model.OrderStatus;
import com.api.coffeeproject.Service.OrderService;
import com.api.coffeeproject.Service.TelegramService;
import com.api.coffeeproject.Util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final JwtUtil jwtUtil;
    private final TelegramService telegramService;

    public OrderController(OrderService orderService, JwtUtil jwtUtil, TelegramService telegramService) {
        this.orderService = orderService;
        this.jwtUtil = jwtUtil;
        this.telegramService = telegramService;
    }

    // Helper method to validate admin authentication
    private boolean isValidAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        String token = authHeader.substring(7);
        return jwtUtil.validateToken(token);
    }

    // 🧪 Test endpoint
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Orders controller is working! Order count: " + orderService.getTotalOrdersCount());
    }

    // 📱 Test Telegram notification
    @GetMapping("/test-telegram")
    public ResponseEntity<String> testTelegram() {
        try {
            telegramService.sendTestMessage();
            return ResponseEntity.ok("✅ Telegram test message sent successfully!");
        } catch (Exception e) {
            System.err.println("❌ Telegram test failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body("❌ Telegram test failed: " + e.getMessage());
        }
    }

    // 🔍 Debug database contents
    @GetMapping("/debug-db")
    public ResponseEntity<Object> debugDatabase() {
        try {
            List<OrderModel> allOrders = orderService.getAllOrders();
            long totalCount = orderService.getTotalOrdersCount();
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("totalOrdersInDB", totalCount);
            debugInfo.put("ordersFromQuery", allOrders.size());
            debugInfo.put("latestOrders", allOrders.stream().limit(5).toList());
            
            System.out.println("🔍 Debug - Total orders in DB: " + totalCount);
            System.out.println("🔍 Debug - Orders from query: " + allOrders.size());
            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            System.err.println("❌ Debug failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body("❌ Debug failed: " + e.getMessage());
        }
    }

    // 📊 Dashboard statistics endpoint (public)
    @GetMapping("/stats")
    public ResponseEntity<Object> getDashboardStats() {
        try {
            List<OrderModel> orders = orderService.getAllOrders();
            long totalOrders = orders.size();
            double totalRevenue = orders.stream()
                    .mapToDouble(order -> order.getTotalAmount() != null ? order.getTotalAmount() : 0.0)
                    .sum();
            long completedOrders = orders.stream()
                    .filter(order -> order.getStatus() == com.api.coffeeproject.Model.OrderStatus.completed)
                    .count();
            
            java.util.Map<String, Object> stats = java.util.Map.of(
                "totalOrders", totalOrders,
                "totalRevenue", totalRevenue,
                "completedOrders", completedOrders,
                "orders", orders
            );
            
            System.out.println("📊 Dashboard stats: " + totalOrders + " orders, $" + totalRevenue + " revenue");
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            System.err.println("❌ Error getting dashboard stats: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error getting dashboard stats: " + e.getMessage());
        }
    }

    // 🧪 Test endpoint without authentication (temporary)
    @GetMapping("/all")
    public ResponseEntity<Object> getAllOrdersTest() {
        try {
            List<OrderModel> orders = orderService.getAllOrders();
            System.out.println("📋 Retrieved " + orders.size() + " orders (test endpoint)");
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("❌ Error fetching orders: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching orders: " + e.getMessage());
        }
    }

    // ✅ GET all orders (admin only)
    @GetMapping
    public ResponseEntity<Object> getAllOrders(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            List<OrderModel> orders = orderService.getAllOrders();
            System.out.println("📋 Retrieved " + orders.size() + " orders");
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("❌ Error fetching orders: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching orders: " + e.getMessage());
        }
    }

    // ✅ GET order by ID (admin only)
    @GetMapping("/{id}")
    public ResponseEntity<Object> getOrderById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            Optional<OrderModel> order = orderService.getOrderById(id);
            if (order.isPresent()) {
                System.out.println("📋 Retrieved order: " + order.get().getOrderNumber());
                return ResponseEntity.ok(order.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching order: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching order: " + e.getMessage());
        }
    }

    // ✅ CREATE new order (public for customer orders)
    @PostMapping
    public ResponseEntity<Object> createOrder(
            @RequestBody OrderModel order,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Allow public access for customer orders
        // Admin validation only required for admin-specific operations

        try {
            System.out.println("📥 Received order data: " + order.toString());
            
            // Validation
            if (order.getCustomerName() == null || order.getCustomerName().trim().isEmpty()) {
                System.err.println("❌ Validation failed: Customer name is required");
                return ResponseEntity.badRequest().body("Customer name is required");
            }
            if (order.getCustomerEmail() == null || order.getCustomerEmail().trim().isEmpty()) {
                System.err.println("❌ Validation failed: Customer email is required");
                return ResponseEntity.badRequest().body("Customer email is required");
            }
            if (order.getTotalAmount() == null || order.getTotalAmount() <= 0) {
                System.err.println("❌ Validation failed: Valid total amount is required. Received: " + order.getTotalAmount());
                return ResponseEntity.badRequest().body("Valid total amount is required");
            }

            // Set default values for required fields
            if (order.getOrderType() == null) {
                order.setOrderType(com.api.coffeeproject.Model.OrderType.pickup);
            }
            if (order.getStatus() == null) {
                order.setStatus(com.api.coffeeproject.Model.OrderStatus.pending);
            }
            if (order.getPaymentStatus() == null) {
                order.setPaymentStatus(com.api.coffeeproject.Model.PaymentStatus.pending);
            }

            System.out.println("💾 Attempting to save order...");
            OrderModel savedOrder = orderService.saveOrder(order);
            System.out.println("✅ Created order: " + savedOrder.getOrderNumber() + " (ID: " + savedOrder.getId() + ")");
            return ResponseEntity.ok(savedOrder);

        } catch (Exception e) {
            System.err.println("❌ Error creating order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error creating order: " + e.getMessage());
        }
    }

    // ✅ UPDATE order (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateOrder(
            @PathVariable Long id,
            @RequestBody OrderModel updatedOrder,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            Optional<OrderModel> existingOrderOpt = orderService.getOrderById(id);
            if (existingOrderOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            OrderModel existingOrder = existingOrderOpt.get();
            
            // Update fields only if provided
            if (updatedOrder.getCustomerName() != null) {
                existingOrder.setCustomerName(updatedOrder.getCustomerName());
            }
            if (updatedOrder.getCustomerEmail() != null) {
                existingOrder.setCustomerEmail(updatedOrder.getCustomerEmail());
            }
            if (updatedOrder.getCustomerPhone() != null) {
                existingOrder.setCustomerPhone(updatedOrder.getCustomerPhone());
            }
            if (updatedOrder.getOrderType() != null) {
                existingOrder.setOrderType(updatedOrder.getOrderType());
            }
            if (updatedOrder.getStatus() != null) {
                existingOrder.setStatus(updatedOrder.getStatus());
            }
            if (updatedOrder.getSubtotal() != null) {
                existingOrder.setSubtotal(updatedOrder.getSubtotal());
            }
            if (updatedOrder.getTaxAmount() != null) {
                existingOrder.setTaxAmount(updatedOrder.getTaxAmount());
            }
            if (updatedOrder.getDeliveryFee() != null) {
                existingOrder.setDeliveryFee(updatedOrder.getDeliveryFee());
            }
            if (updatedOrder.getTotalAmount() != null) {
                existingOrder.setTotalAmount(updatedOrder.getTotalAmount());
            }
            if (updatedOrder.getPaymentStatus() != null) {
                existingOrder.setPaymentStatus(updatedOrder.getPaymentStatus());
            }
            if (updatedOrder.getPaymentMethod() != null) {
                existingOrder.setPaymentMethod(updatedOrder.getPaymentMethod());
            }
            if (updatedOrder.getSpecialInstructions() != null) {
                existingOrder.setSpecialInstructions(updatedOrder.getSpecialInstructions());
            }
            if (updatedOrder.getEstimatedReadyTime() != null) {
                existingOrder.setEstimatedReadyTime(updatedOrder.getEstimatedReadyTime());
            }
            if (updatedOrder.getDeliveryAddress() != null) {
                existingOrder.setDeliveryAddress(updatedOrder.getDeliveryAddress());
            }

            OrderModel savedOrder = orderService.saveOrder(existingOrder);
            System.out.println("✅ Updated order: " + savedOrder.getOrderNumber());
            return ResponseEntity.ok(savedOrder);

        } catch (Exception e) {
            System.err.println("❌ Error updating order: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating order: " + e.getMessage());
        }
    }

    // ✅ UPDATE order status only (admin only)
    @PutMapping("/{id}/status")
    public ResponseEntity<Object> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> statusUpdate,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            String newStatus = statusUpdate.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Status is required");
            }

            // Validate status first
            OrderStatus status;
            try {
                status = OrderStatus.valueOf(newStatus.toLowerCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Invalid status: " + newStatus + ". Valid statuses: pending, confirmed, preparing, ready, completed, cancelled");
            }

            OrderModel updatedOrder = orderService.updateOrderStatus(id, status);
            if (updatedOrder != null) {
                System.out.println("✅ Updated order status: " + updatedOrder.getOrderNumber() + " -> " + newStatus);
                return ResponseEntity.ok(updatedOrder);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            System.err.println("❌ Error updating order status: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating order status: " + e.getMessage());
        }
    }

    // ✅ DELETE order (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteOrder(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            Optional<OrderModel> order = orderService.getOrderById(id);
            if (order.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            orderService.deleteOrder(id);
            System.out.println("🗑️ Deleted order: " + order.get().getOrderNumber());
            return ResponseEntity.ok("Order deleted successfully");

        } catch (Exception e) {
            System.err.println("❌ Error deleting order: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error deleting order: " + e.getMessage());
        }
    }



    // ✅ GET orders by status (admin only)
    @GetMapping("/status/{status}")
    public ResponseEntity<Object> getOrdersByStatus(
            @PathVariable OrderStatus status,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            List<OrderModel> orders = orderService.getOrdersByStatus(status);
            System.out.println("📋 Retrieved " + orders.size() + " orders with status: " + status);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("❌ Error fetching orders by status: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching orders by status: " + e.getMessage());
        }
    }
}

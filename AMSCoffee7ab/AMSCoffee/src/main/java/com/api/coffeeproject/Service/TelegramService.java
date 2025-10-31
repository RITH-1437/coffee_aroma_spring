package com.api.coffeeproject.Service;

import com.api.coffeeproject.Model.OrderModel;
import com.api.coffeeproject.Model.OrderItemModel;
import com.api.coffeeproject.Model.ProductModel;
import com.api.coffeeproject.Repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.concurrent.CompletableFuture;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
public class TelegramService {

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.bot.chat.id}")
    private String chatId;

    private final WebClient webClient;
    
    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired 
    private ProductService productService;

    public TelegramService() {
        this.webClient = WebClient.builder()
                .baseUrl("https://api.telegram.org")
                .build();
    }

    /**
     * Send order notification to Telegram asynchronously
     */
    @Async("telegramTaskExecutor")
    public CompletableFuture<Void> sendOrderNotificationAsync(OrderModel order) {
        try {
            String message = formatOrderMessage(order);
            sendMessageAsync(message);
            System.out.println("✅ Telegram notification sent for order: " + order.getOrderNumber());
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            System.err.println("❌ Failed to send Telegram notification for order: " + order.getOrderNumber());
            System.err.println("Error: " + e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Send order notification to Telegram (synchronous - for backward compatibility)
     */
    public void sendOrderNotification(OrderModel order) {
        sendOrderNotificationAsync(order);
    }

    /**
     * Format order details into a readable Telegram message
     */
    private String formatOrderMessage(OrderModel order) {
        StringBuilder message = new StringBuilder();
        
        // Header with emoji
        message.append("☕ NEW COFFEE ORDER RECEIVED! ☕\n\n");
        
        // Order details
        message.append("📋 Order Details:\n");
        message.append("• Order Number: ").append(order.getOrderNumber()).append("\n");
        message.append("• Status: ").append(order.getStatus()).append("\n");
        message.append("• Type: ").append(order.getOrderType()).append("\n");
        
        if (order.getCreatedAt() != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
            message.append("• Order Time: ").append(order.getCreatedAt().format(formatter)).append("\n");
        }
        
        message.append("\n👤 Customer Information:\n");
        message.append("• Name: ").append(order.getCustomerName()).append("\n");
        message.append("• Email: ").append(order.getCustomerEmail()).append("\n");
        
        if (order.getCustomerPhone() != null && !order.getCustomerPhone().trim().isEmpty()) {
            message.append("• Phone: ").append(order.getCustomerPhone()).append("\n");
        }
        
        if (order.getDeliveryAddress() != null && !order.getDeliveryAddress().trim().isEmpty()) {
            message.append("• Address: ").append(order.getDeliveryAddress()).append("\n");
        }

        // Order items - optimized with batch product lookup
        try {
            List<OrderItemModel> orderItems = orderItemRepository.findByOrderId(order.getId());
                
            if (!orderItems.isEmpty()) {
                message.append("\n🛒 Order Items:\n");
                
                // Batch fetch all products at once to avoid N+1 queries
                List<Long> productIds = orderItems.stream()
                    .map(OrderItemModel::getProductId)
                    .distinct()
                    .toList();
                
                Map<Long, String> productNames = new HashMap<>();
                if (!productIds.isEmpty()) {
                    try {
                        List<ProductModel> products = productService.getProductsByIds(productIds);
                        products.forEach(product -> 
                            productNames.put(product.getId(), product.getName()));
                    } catch (Exception e) {
                        System.err.println("❌ Error batch fetching products: " + e.getMessage());
                        // Fallback to individual lookups if batch fails
                        for (Long productId : productIds) {
                            try {
                                Optional<ProductModel> product = productService.getProductById(productId);
                                if (product.isPresent()) {
                                    productNames.put(productId, product.get().getName());
                                }
                            } catch (Exception ex) {
                                productNames.put(productId, "Unknown Product");
                            }
                        }
                    }
                }
                
                for (OrderItemModel item : orderItems) {
                    String productName = productNames.getOrDefault(item.getProductId(), "Unknown Product");
                    
                    message.append("• ").append(productName)
                           .append(" x").append(item.getQuantity())
                           .append(" - $").append(String.format("%.2f", item.getTotalPrice()))
                           .append("\n");
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching order items: " + e.getMessage());
        }

        // Payment information
        message.append("\n💰 Payment Information:\n");
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);
        message.append("• Total Amount: ").append(currencyFormat.format(order.getTotalAmount())).append("\n");
        message.append("• Payment Status: ").append(order.getPaymentStatus()).append("\n");
        
        if (order.getPaymentMethod() != null) {
            message.append("• Payment Method: ").append(order.getPaymentMethod()).append("\n");
        }

        // Special notes
        if (order.getSpecialInstructions() != null && !order.getSpecialInstructions().trim().isEmpty()) {
            message.append("\n📝 Special Instructions:\n");
            message.append(order.getSpecialInstructions()).append("\n");
        }

        message.append("\n🎉 Please prepare this order as soon as possible!");
        
        return message.toString();
    }

    /**
     * Send a message to Telegram asynchronously
     */
    private CompletableFuture<Void> sendMessageAsync(String text) {
        return CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("chat_id", chatId);
                requestBody.put("text", text);
                
                System.out.println("📤 Sending Telegram message to chat ID: " + chatId);
                System.out.println("📝 Message: " + text.substring(0, Math.min(100, text.length())) + "...");

                // Use async non-blocking call instead of .block()
                webClient.post()
                        .uri("/bot" + botToken + "/sendMessage")
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .subscribe(
                            response -> System.out.println("📱 Telegram API Response: " + response),
                            error -> {
                                System.err.println("❌ Error in Telegram API response: " + error.getMessage());
                                error.printStackTrace();
                            }
                        );

            } catch (Exception e) {
                System.err.println("❌ Error sending Telegram message: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException(e);
            }
        });
    }

    /**
     * Send a message to Telegram (synchronous - for backward compatibility)
     */
    private void sendMessage(String text) {
        sendMessageAsync(text);
    }

    /**
     * Test method to send a simple message
     */
    public void sendTestMessage() {
        try {
            sendMessage("🧪 Test message from AMS Coffee Bot! The integration is working correctly. ☕");
            System.out.println("✅ Test message sent successfully");
        } catch (Exception e) {
            System.err.println("❌ Failed to send test message: " + e.getMessage());
        }
    }
}
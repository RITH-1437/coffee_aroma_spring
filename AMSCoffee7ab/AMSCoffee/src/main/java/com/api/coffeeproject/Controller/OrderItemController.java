package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.OrderItemModel;
import com.api.coffeeproject.Repository.OrderItemRepository;
import com.api.coffeeproject.Service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/order-items")
public class OrderItemController {

    private final OrderItemRepository orderItems;
    private final ProductService productService;

    public OrderItemController(OrderItemRepository orderItems, ProductService productService) {
        this.orderItems = orderItems;
        this.productService = productService;
    }

    // ✅ GET all order items
    @GetMapping
    public List<OrderItemModel> getAllOrderItems() {
        return orderItems.findAll();
    }

    // ✅ GET order item by ID
    @GetMapping("/{id}")
    public Optional<OrderItemModel> getOrderItemById(@PathVariable Long id) {
        return orderItems.findById(id);
    }

    // ✅ DELETE order item by ID
    @DeleteMapping("/{id}")
    public String deleteOrderItem(@PathVariable Long id) {
        orderItems.deleteById(id);
        return "Deleted Order Item Successfully with id: " + id;
    }

    // ✅ CREATE new order item
    @PostMapping
    public ResponseEntity<String> createOrderItem(@RequestBody OrderItemModel orderItem) {
        // Validate stock availability before creating order item
        if (!productService.hasSufficientStock(orderItem.getProductId(), orderItem.getQuantity())) {
            return ResponseEntity.badRequest().body("Insufficient stock for product ID: " + orderItem.getProductId());
        }

        // Decrease stock quantity
        if (!productService.decreaseStock(orderItem.getProductId(), orderItem.getQuantity())) {
            return ResponseEntity.badRequest().body("Failed to update stock for product ID: " + orderItem.getProductId());
        }

        orderItems.save(orderItem);
        return ResponseEntity.ok("Inserted Order Item Successfully!");
    }

    // ✅ UPDATE existing order item
    @PutMapping("/{id}")
    public String updateOrderItem(@PathVariable Long id, @RequestBody OrderItemModel updatedItem) {
        return orderItems.findById(id).map(item -> {
            item.setOrderId(updatedItem.getOrderId());
            item.setProductId(updatedItem.getProductId());
            item.setQuantity(updatedItem.getQuantity());
            item.setUnitPrice(updatedItem.getUnitPrice());
            item.setTotalPrice(updatedItem.getTotalPrice());
            item.setSpecialRequests(updatedItem.getSpecialRequests());

            orderItems.save(item);
            return "Updated Order Item Successfully with id: " + id;
        }).orElse("Order Item not found with id: " + id);
    }
}

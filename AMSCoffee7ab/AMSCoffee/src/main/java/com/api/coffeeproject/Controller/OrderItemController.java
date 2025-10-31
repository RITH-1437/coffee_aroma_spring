package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.OrderItemModel;
import com.api.coffeeproject.Repository.OrderItemRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/order-items")
public class OrderItemController {

    private final OrderItemRepository orderItems;

    public OrderItemController(OrderItemRepository orderItems) {
        this.orderItems = orderItems;
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
    public String createOrderItem(@RequestBody OrderItemModel orderItem) {
        orderItems.save(orderItem);
        return "Inserted Order Item Successfully!";
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

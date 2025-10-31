package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.ShoppingCartModel;
import com.api.coffeeproject.Repository.ShoppingCartRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/shopping-cart")
public class ShoppingCartController {

    private final ShoppingCartRepository cartRepository;

    public ShoppingCartController(ShoppingCartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    // ✅ Get all shopping cart items
    @GetMapping
    public List<ShoppingCartModel> getAllCarts() {
        return cartRepository.findAll();
    }

    // ✅ Get all items for a specific user
    @GetMapping("/user/{userId}")
    public List<ShoppingCartModel> getCartByUser(@PathVariable Long userId) {
        return cartRepository.findByUserId(userId);
    }

    // ✅ Add product to shopping cart
    @PostMapping
    public String addToCart(@RequestBody ShoppingCartModel item) {
        Optional<ShoppingCartModel> existingItem =
                cartRepository.findByUserIdAndProductId(item.getUserId(), item.getProductId());

        if (existingItem.isPresent()) {
            // Update quantity if product already in cart
            ShoppingCartModel cartItem = existingItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + item.getQuantity());
            cartRepository.save(cartItem);
            return "Updated existing cart item quantity.";
        } else {
            cartRepository.save(item);
            return "Added new item to shopping cart.";
        }
    }

    // ✅ Update product quantity
    @PutMapping("/{id}")
    public String updateCartItem(@PathVariable Long id, @RequestBody ShoppingCartModel updatedItem) {
        return cartRepository.findById(id).map(item -> {
            item.setQuantity(updatedItem.getQuantity());
            cartRepository.save(item);
            return "Updated shopping cart item successfully!";
        }).orElse("Cart item not found!");
    }

    // ✅ Delete item from cart
    @DeleteMapping("/{id}")
    public String deleteCartItem(@PathVariable Long id) {
        cartRepository.deleteById(id);
        return "Deleted shopping cart item successfully!";
    }

    // ✅ Clear all items for a user
    @DeleteMapping("/user/{userId}")
    public String clearCartByUser(@PathVariable Long userId) {
        List<ShoppingCartModel> items = cartRepository.findByUserId(userId);
        cartRepository.deleteAll(items);
        return "Cleared shopping cart for user with id: " + userId;
    }
}

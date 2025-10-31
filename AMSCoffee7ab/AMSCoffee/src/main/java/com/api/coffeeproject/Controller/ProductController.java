package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.ProductModel;
import com.api.coffeeproject.Service.ProductService;
import com.api.coffeeproject.Util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;
    private final JwtUtil jwtUtil;

    public ProductController(ProductService productService, JwtUtil jwtUtil) {
        this.productService = productService;
        this.jwtUtil = jwtUtil;
    }

    // Helper method to validate admin authentication
    private boolean isValidAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        String token = authHeader.substring(7);
        return jwtUtil.validateToken(token);
    }

    // ✅ GET all products (public - no auth required)
    @GetMapping
    public ResponseEntity<Object> getAllProducts() {
        try {
            List<ProductModel> products = productService.getAllProducts();
            System.out.println("🛍️ Found " + products.size() + " products");
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            System.err.println("❌ Error fetching products: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching products: " + e.getMessage());
        }
    }

    // ✅ GET product by ID (public - no auth required)
    @GetMapping("/{id}")
    public ResponseEntity<Object> getProductById(@PathVariable Long id) {
        try {
            Optional<ProductModel> product = productService.getProductById(id);
            if (product.isPresent()) {
                System.out.println("🛍️ Found product: " + product.get().getName());
                return ResponseEntity.ok(product.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching product: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching product: " + e.getMessage());
        }
    }

    // ✅ GET products by category (public - no auth required)
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Object> getProductsByCategory(@PathVariable Long categoryId) {
        try {
            List<ProductModel> products = productService.getByCategory(categoryId);
            System.out.println("🛍️ Found " + products.size() + " products in category " + categoryId);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            System.err.println("❌ Error fetching products by category: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching products: " + e.getMessage());
        }
    }

    // ✅ CREATE product (admin only)
    @PostMapping
    public ResponseEntity<Object> createProduct(
            @RequestBody ProductModel product,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            // Validate required fields
            if (product.getName() == null || product.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Product name is required!");
            }
            if (product.getPrice() == null || product.getPrice() <= 0) {
                return ResponseEntity.badRequest().body("Product price must be greater than 0!");
            }
            if (product.getCategoryId() == null) {
                return ResponseEntity.badRequest().body("Category ID is required!");
            }

            // Set default values
            if (product.getIsAvailable() == null) {
                product.setIsAvailable(true);
            }
            if (product.getIsFeatured() == null) {
                product.setIsFeatured(false);
            }
            if (product.getStockQuantity() == null) {
                product.setStockQuantity(100);
            }
            if (product.getPreparationTime() == null) {
                product.setPreparationTime(5);
            }

            ProductModel savedProduct = productService.saveProduct(product);
            System.out.println("✅ Created product: " + savedProduct.getName() + " with ID: " + savedProduct.getId());
            return ResponseEntity.ok(savedProduct);

        } catch (Exception e) {
            System.err.println("❌ Error creating product: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error creating product: " + e.getMessage());
        }
    }

    // ✅ UPDATE product (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateProduct(
            @PathVariable Long id,
            @RequestBody ProductModel updatedProduct,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            Optional<ProductModel> existingProductOpt = productService.getProductById(id);
            if (existingProductOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ProductModel existingProduct = existingProductOpt.get();
            
            // Update fields only if provided
            if (updatedProduct.getName() != null) {
                existingProduct.setName(updatedProduct.getName());
            }
            if (updatedProduct.getDescription() != null) {
                existingProduct.setDescription(updatedProduct.getDescription());
            }
            if (updatedProduct.getPrice() != null) {
                existingProduct.setPrice(updatedProduct.getPrice());
            }
            if (updatedProduct.getCategoryId() != null) {
                existingProduct.setCategoryId(updatedProduct.getCategoryId());
            }
            if (updatedProduct.getImageUrl() != null) {
                existingProduct.setImageUrl(updatedProduct.getImageUrl());
            }
            if (updatedProduct.getIsAvailable() != null) {
                existingProduct.setIsAvailable(updatedProduct.getIsAvailable());
            }
            if (updatedProduct.getIsFeatured() != null) {
                existingProduct.setIsFeatured(updatedProduct.getIsFeatured());
            }
            if (updatedProduct.getStockQuantity() != null) {
                existingProduct.setStockQuantity(updatedProduct.getStockQuantity());
            }
            if (updatedProduct.getPreparationTime() != null) {
                existingProduct.setPreparationTime(updatedProduct.getPreparationTime());
            }
            if (updatedProduct.getCalories() != null) {
                existingProduct.setCalories(updatedProduct.getCalories());
            }
            if (updatedProduct.getIngredients() != null) {
                existingProduct.setIngredients(updatedProduct.getIngredients());
            }
            if (updatedProduct.getAllergens() != null) {
                existingProduct.setAllergens(updatedProduct.getAllergens());
            }

            ProductModel savedProduct = productService.saveProduct(existingProduct);
            System.out.println("✅ Updated product: " + savedProduct.getName());
            return ResponseEntity.ok(savedProduct);

        } catch (Exception e) {
            System.err.println("❌ Error updating product: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating product: " + e.getMessage());
        }
    }

    // ✅ UPDATE product stock (admin only)
    @PutMapping("/{id}/stock")
    public ResponseEntity<Object> updateProductStock(
            @PathVariable Long id,
            @RequestBody StockUpdateRequest stockUpdate,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            Optional<ProductModel> existingProductOpt = productService.getProductById(id);
            if (existingProductOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ProductModel existingProduct = existingProductOpt.get();
            Integer currentStock = existingProduct.getStockQuantity() != null ? existingProduct.getStockQuantity() : 0;
            Integer newStock;

            if ("add".equals(stockUpdate.getOperation())) {
                newStock = currentStock + stockUpdate.getStockQuantity();
            } else if ("set".equals(stockUpdate.getOperation())) {
                newStock = stockUpdate.getStockQuantity();
            } else {
                return ResponseEntity.badRequest().body("Invalid operation. Use 'add' or 'set'.");
            }

            if (newStock < 0) {
                return ResponseEntity.badRequest().body("Stock quantity cannot be negative.");
            }

            existingProduct.setStockQuantity(newStock);
            ProductModel savedProduct = productService.saveProduct(existingProduct);

            System.out.println("✅ Updated stock for product: " + savedProduct.getName() + " - New stock: " + newStock);
            return ResponseEntity.ok(savedProduct);

        } catch (Exception e) {
            System.err.println("❌ Error updating product stock: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating product stock: " + e.getMessage());
        }
    }

    // ✅ DELETE product (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteProduct(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            if (!productService.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            productService.deleteProduct(id);
            System.out.println("✅ Deleted product with ID: " + id);
            return ResponseEntity.ok("Product deleted successfully");

        } catch (Exception e) {
            System.err.println("❌ Error deleting product: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error deleting product: " + e.getMessage());
        }
    }

    // Inner class for stock update request
    public static class StockUpdateRequest {
        private Integer stockQuantity;
        private String operation; // "add" or "set"

        public StockUpdateRequest() {}

        public StockUpdateRequest(Integer stockQuantity, String operation) {
            this.stockQuantity = stockQuantity;
            this.operation = operation;
        }

        public Integer getStockQuantity() {
            return stockQuantity;
        }

        public void setStockQuantity(Integer stockQuantity) {
            this.stockQuantity = stockQuantity;
        }

        public String getOperation() {
            return operation;
        }

        public void setOperation(String operation) {
            this.operation = operation;
        }
    }
}

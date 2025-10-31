package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.CategoryModel;
import com.api.coffeeproject.Service.CategoryService;
import com.api.coffeeproject.Util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;
    private final JwtUtil jwtUtil;

    public CategoryController(CategoryService categoryService, JwtUtil jwtUtil) {
        this.categoryService = categoryService;
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

    // ✅ GET all categories (public - no auth required)
    @GetMapping
    public ResponseEntity<Object> getAllCategories() {
        try {
            List<CategoryModel> categories = categoryService.getAll();
            System.out.println("📂 Found " + categories.size() + " categories");
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            System.err.println("❌ Error fetching categories: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching categories: " + e.getMessage());
        }
    }

    // ✅ GET category by ID (public - no auth required)
    @GetMapping("/{id}")
    public ResponseEntity<Object> getCategoryById(@PathVariable Long id) {
        try {
            Optional<CategoryModel> category = categoryService.getById(id);
            if (category.isPresent()) {
                System.out.println("📂 Found category: " + category.get().getName());
                return ResponseEntity.ok(category.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error fetching category: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error fetching category: " + e.getMessage());
        }
    }

    // ✅ CREATE category (admin only)
    @PostMapping
    public ResponseEntity<Object> createCategory(
            @RequestBody CategoryModel category,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            // Validate required fields
            if (category.getName() == null || category.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Category name is required!");
            }

            // Set default values
            if (category.getIsActive() == null) {
                category.setIsActive(true);
            }
            if (category.getSortOrder() == null) {
                category.setSortOrder(0);
            }

            CategoryModel savedCategory = categoryService.save(category);
            System.out.println("✅ Created category: " + savedCategory.getName() + " with ID: " + savedCategory.getId());
            return ResponseEntity.ok(savedCategory);

        } catch (Exception e) {
            System.err.println("❌ Error creating category: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error creating category: " + e.getMessage());
        }
    }

    // ✅ UPDATE category (admin only)
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateCategory(
            @PathVariable Long id,
            @RequestBody CategoryModel updatedCategory,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            Optional<CategoryModel> existingCategoryOpt = categoryService.getById(id);
            if (existingCategoryOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            CategoryModel existingCategory = existingCategoryOpt.get();
            
            // Update fields
            if (updatedCategory.getName() != null) {
                existingCategory.setName(updatedCategory.getName());
            }
            if (updatedCategory.getDescription() != null) {
                existingCategory.setDescription(updatedCategory.getDescription());
            }
            if (updatedCategory.getImageUrl() != null) {
                existingCategory.setImageUrl(updatedCategory.getImageUrl());
            }
            if (updatedCategory.getIsActive() != null) {
                existingCategory.setIsActive(updatedCategory.getIsActive());
            }
            if (updatedCategory.getSortOrder() != null) {
                existingCategory.setSortOrder(updatedCategory.getSortOrder());
            }

            CategoryModel savedCategory = categoryService.save(existingCategory);
            System.out.println("✅ Updated category: " + savedCategory.getName());
            return ResponseEntity.ok(savedCategory);

        } catch (Exception e) {
            System.err.println("❌ Error updating category: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error updating category: " + e.getMessage());
        }
    }

    // ✅ DELETE category (admin only)
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteCategory(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!isValidAdmin(authHeader)) {
            return ResponseEntity.status(401).body("Unauthorized! Admin access required.");
        }

        try {
            if (!categoryService.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            categoryService.delete(id);
            System.out.println("✅ Deleted category with ID: " + id);
            return ResponseEntity.ok("Category deleted successfully");

        } catch (Exception e) {
            System.err.println("❌ Error deleting category: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error deleting category: " + e.getMessage());
        }
    }
}

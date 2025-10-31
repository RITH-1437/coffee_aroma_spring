package com.api.coffeeproject.Service;

import com.api.coffeeproject.Model.ProductModel;
import com.api.coffeeproject.Repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {
    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public List<ProductModel> getAllProducts() {
        return repository.findAll();
    }

    public Optional<ProductModel> getProductById(Long id) {
        return repository.findById(id);
    }

    public ProductModel saveProduct(ProductModel product) {
        if (product.getId() == null) {
            product.setCreatedAt(LocalDateTime.now());
        }
        product.setUpdatedAt(LocalDateTime.now());
        return repository.save(product);
    }

    public void deleteProduct(Long id) {
        repository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return repository.existsById(id);
    }

    public List<ProductModel> getByCategory(Long categoryId) {
        return repository.findAll().stream()
                .filter(product -> product.getCategoryId().equals(categoryId))
                .toList();
    }

    public List<ProductModel> getFeatured() {
        return repository.findAll().stream()
                .filter(product -> Boolean.TRUE.equals(product.getIsFeatured()))
                .toList();
    }

    public List<ProductModel> getAvailable() {
        return repository.findAll().stream()
                .filter(product -> Boolean.TRUE.equals(product.getIsAvailable()))
                .toList();
    }

    /**
     * Batch fetch products by IDs to optimize database queries
     */
    public List<ProductModel> getProductsByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return repository.findAllById(ids);
    }
}

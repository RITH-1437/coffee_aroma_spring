package com.api.coffeeproject.Service;

import com.api.coffeeproject.Model.CategoryModel;
import com.api.coffeeproject.Repository.CategoryRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryModel> getAll() {
        return categoryRepository.findAll();
    }

    public Optional<CategoryModel> getById(Long id) {
        return categoryRepository.findById(id);
    }

    public CategoryModel save(CategoryModel category) {
        if (category.getId() == null) {
            category.setCreatedAt(LocalDateTime.now());
        }
        category.setUpdatedAt(LocalDateTime.now());
        return categoryRepository.save(category);
    }

    public void delete(Long id) {
        categoryRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return categoryRepository.existsById(id);
    }
}
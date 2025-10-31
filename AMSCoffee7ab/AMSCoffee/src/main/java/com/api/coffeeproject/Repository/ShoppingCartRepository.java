package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.ShoppingCartModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCartModel, Long> {
    List<ShoppingCartModel> findByUserId(Long userId);
    Optional<ShoppingCartModel> findByUserIdAndProductId(Long userId, Long productId);
}

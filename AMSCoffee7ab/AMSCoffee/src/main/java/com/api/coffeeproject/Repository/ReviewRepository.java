package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.ReviewModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<ReviewModel, Long> {
    List<ReviewModel> findByProductId(Long productId);
    List<ReviewModel> findByUserId(Long userId);
    List<ReviewModel> findByOrderId(Long orderId);
    List<ReviewModel> findByIsApproved(Boolean isApproved);
}

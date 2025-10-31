package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.ReviewModel;
import com.api.coffeeproject.Model.UserModel;
import com.api.coffeeproject.Repository.ReviewRepository;
import com.api.coffeeproject.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewRepository repository;

    @Autowired
    private UserRepository userRepository;

    // 🔹 Create (POST)
    @PostMapping
    public ResponseEntity<ReviewModel> createReview(@RequestBody ReviewModel review) {
        ReviewModel saved = repository.save(review);
        return ResponseEntity.ok(saved);
    }

    // 🔹 Read all (GET) with user names
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllReviews() {
        List<ReviewModel> reviews = repository.findAll();

        // Get all user IDs from reviews
        List<Long> userIds = reviews.stream()
                .filter(review -> review.getUserId() != null)
                .map(ReviewModel::getUserId)
                .distinct()
                .collect(Collectors.toList());

        // Fetch users in batch
        Map<Long, UserModel> userMap = userRepository.findAllById(userIds)
                .stream()
                .collect(Collectors.toMap(UserModel::getId, user -> user));

        // Convert reviews to response format with user names
        List<Map<String, Object>> response = reviews.stream().map(review -> {
            Map<String, Object> reviewData = new HashMap<>();
            reviewData.put("id", review.getId());
            reviewData.put("userId", review.getUserId());
            reviewData.put("productId", review.getProductId());
            reviewData.put("orderId", review.getOrderId());
            reviewData.put("rating", review.getRating());
            reviewData.put("title", review.getTitle());
            reviewData.put("comment", review.getComment());
            reviewData.put("isApproved", review.getIsApproved());
            reviewData.put("createdAt", review.getCreatedAt());
            reviewData.put("updatedAt", review.getUpdatedAt());

            // Add user name if user exists
            if (review.getUserId() != null && userMap.containsKey(review.getUserId())) {
                UserModel user = userMap.get(review.getUserId());
                reviewData.put("userName", user.getFirstName() + " " + user.getLastName());
                reviewData.put("userEmail", user.getEmail());
            } else {
                reviewData.put("userName", "Anonymous User");
                reviewData.put("userEmail", null);
            }

            return reviewData;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // 🔹 Read by ID (GET)
    @GetMapping("/{id}")
    public ResponseEntity<?> getReviewById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Get by product
    @GetMapping("/product/{productId}")
    public List<ReviewModel> getReviewsByProduct(@PathVariable Long productId) {
        return repository.findByProductId(productId);
    }

    // 🔹 Get product rating stats
    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<Map<String, Object>> getProductRatingStats(@PathVariable Long productId) {
        List<ReviewModel> reviews = repository.findByProductId(productId);
        List<ReviewModel> approvedReviews = reviews.stream()
                .filter(review -> review.getIsApproved() != null && review.getIsApproved())
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalReviews", reviews.size());
        stats.put("approvedReviews", approvedReviews.size());

        if (!approvedReviews.isEmpty()) {
            double averageRating = approvedReviews.stream()
                    .mapToInt(ReviewModel::getRating)
                    .average()
                    .orElse(0.0);
            stats.put("averageRating", Math.round(averageRating * 10.0) / 10.0);
        } else {
            stats.put("averageRating", 0.0);
        }

        // Rating distribution
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int ratingValue = i;
            ratingDistribution.put(ratingValue, approvedReviews.stream()
                    .filter(review -> review.getRating() == ratingValue)
                    .count());
        }
        stats.put("ratingDistribution", ratingDistribution);

        return ResponseEntity.ok(stats);
    }

    // 🔹 Approve review
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long id) {
        return repository.findById(id)
                .map(review -> {
                    review.setIsApproved(true);
                    repository.save(review);
                    return ResponseEntity.ok("Review approved successfully!");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Reject review
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectReview(@PathVariable Long id) {
        return repository.findById(id)
                .map(review -> {
                    review.setIsApproved(false);
                    repository.save(review);
                    return ResponseEntity.ok("Review rejected!");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Delete review
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok("Review deleted successfully!");
    }
}

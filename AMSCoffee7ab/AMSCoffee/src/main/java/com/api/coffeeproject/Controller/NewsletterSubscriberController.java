package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.NewsletterSubscriberModel;
import com.api.coffeeproject.Repository.NewsletterSubscriberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/newsletter-subscribers")
public class NewsletterSubscriberController {

    @Autowired
    private NewsletterSubscriberRepository repository;

    // 🔹 Create new subscriber
    @PostMapping
    public ResponseEntity<?> createSubscriber(@RequestBody NewsletterSubscriberModel subscriber) {
        if (repository.existsByEmail(subscriber.getEmail())) {
            return ResponseEntity.badRequest().body("Email already subscribed!");
        }
        NewsletterSubscriberModel saved = repository.save(subscriber);
        return ResponseEntity.ok(saved);
    }

    // 🔹 Get all subscribers
    @GetMapping
    public List<NewsletterSubscriberModel> getAllSubscribers() {
        return repository.findAll();
    }

    // 🔹 Get one subscriber by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getSubscriberById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Update subscriber
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSubscriber(@PathVariable Long id, @RequestBody NewsletterSubscriberModel updated) {
        return repository.findById(id)
                .map(subscriber -> {
                    subscriber.setName(updated.getName());
                    subscriber.setIsActive(updated.getIsActive());
                    return ResponseEntity.ok(repository.save(subscriber));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Delete subscriber
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSubscriber(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok("Subscriber deleted successfully");
    }
}

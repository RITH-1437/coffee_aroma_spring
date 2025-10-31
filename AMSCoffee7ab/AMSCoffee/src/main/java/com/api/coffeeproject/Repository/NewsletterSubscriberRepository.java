package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.NewsletterSubscriberModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriberModel, Long> {
    boolean existsByEmail(String email);
}

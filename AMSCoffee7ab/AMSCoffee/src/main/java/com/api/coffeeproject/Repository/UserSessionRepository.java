package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.UserSessionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSessionModel, Long> {
    Optional<UserSessionModel> findBySessionToken(String sessionToken);
    void deleteBySessionToken(String sessionToken);
}

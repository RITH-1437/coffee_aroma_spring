package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.UserSessionModel;
import com.api.coffeeproject.Repository.UserSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-sessions")
public class UserSessionController {

    @Autowired
    private UserSessionRepository repository;

    // 🔹 Create a new session (like login)
    @PostMapping
    public ResponseEntity<?> createSession(@RequestBody UserSessionModel sessionRequest) {
        // Generate random token if not provided
        if (sessionRequest.getSessionToken() == null || sessionRequest.getSessionToken().isEmpty()) {
            sessionRequest.setSessionToken(UUID.randomUUID().toString());
        }

        // Default expiry time: 1 hour from now
        if (sessionRequest.getExpiresAt() == null) {
            sessionRequest.setExpiresAt(LocalDateTime.now().plusHours(1));
        }

        UserSessionModel saved = repository.save(sessionRequest);
        return ResponseEntity.ok(saved);
    }

    // 🔹 Get all sessions
    @GetMapping
    public List<UserSessionModel> getAllSessions() {
        return repository.findAll();
    }

    // 🔹 Get session by token
    @GetMapping("/token/{token}")
    public ResponseEntity<?> getByToken(@PathVariable String token) {
        Optional<UserSessionModel> session = repository.findBySessionToken(token);
        return session.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Delete session by token (logout)
    @DeleteMapping("/token/{token}")
    public ResponseEntity<?> deleteByToken(@PathVariable String token) {
        repository.deleteBySessionToken(token);
        return ResponseEntity.ok("Session deleted successfully");
    }
}

package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.AdminActivityModel;
import com.api.coffeeproject.Repository.AdminActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin-activities")
public class AdminActivityController {

    @Autowired
    private AdminActivityRepository repository;

    // 🔹 Create (POST)
    @PostMapping
    public ResponseEntity<AdminActivityModel> createActivity(@RequestBody AdminActivityModel activity) {
        AdminActivityModel saved = repository.save(activity);
        return ResponseEntity.ok(saved);
    }

    // 🔹 Read all (GET)
    @GetMapping
    public List<AdminActivityModel> getAllActivities() {
        return repository.findAll();
    }

    // 🔹 Read by ID (GET)
    @GetMapping("/{id}")
    public ResponseEntity<?> getActivityById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Read by adminId (GET)
    @GetMapping("/admin/{adminId}")
    public List<AdminActivityModel> getActivitiesByAdmin(@PathVariable Long adminId) {
        return repository.findByAdminId(adminId);
    }

    // 🔹 Delete (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteActivity(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok("Activity deleted successfully");
    }
}

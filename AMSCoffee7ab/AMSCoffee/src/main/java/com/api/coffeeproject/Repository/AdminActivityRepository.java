package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.AdminActivityModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminActivityRepository extends JpaRepository<AdminActivityModel, Long> {
    List<AdminActivityModel> findByAdminId(Long adminId);
    List<AdminActivityModel> findByAction(String action);
}

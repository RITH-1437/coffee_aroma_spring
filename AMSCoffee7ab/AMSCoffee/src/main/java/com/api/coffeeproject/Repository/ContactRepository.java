package com.api.coffeeproject.Repository;

import com.api.coffeeproject.Model.ContactModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<ContactModel, Long> {
    
    // Find contacts by status
    List<ContactModel> findByStatus(ContactModel.Status status);
    
    // Find contacts by email
    List<ContactModel> findByEmail(String email);
    
    // Find contacts ordered by creation date (newest first)
    List<ContactModel> findAllByOrderByCreatedAtDesc();
    
    // Find unread contacts (NEW status)
    @Query("SELECT c FROM ContactModel c WHERE c.status = 'NEW' ORDER BY c.createdAt DESC")
    List<ContactModel> findUnreadContacts();
    
    // Count contacts by status
    @Query("SELECT COUNT(c) FROM ContactModel c WHERE c.status = :status")
    Long countByStatus(@Param("status") ContactModel.Status status);
}

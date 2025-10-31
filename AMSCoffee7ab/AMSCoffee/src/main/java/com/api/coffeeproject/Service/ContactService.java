package com.api.coffeeproject.Service;

import com.api.coffeeproject.Model.ContactModel;
import com.api.coffeeproject.Repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class ContactService implements CommandLineRunner {

    @Autowired
    private ContactRepository contactRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("📊 Checking contacts table...");
            long contactCount = contactRepository.count();
            System.out.println("✅ Contacts table exists! Found " + contactCount + " contacts.");
        } catch (Exception e) {
            System.err.println("❌ Error accessing contacts table: " + e.getMessage());
            System.err.println("💡 This might mean the contacts table doesn't exist yet.");
            System.err.println("🔧 Hibernate should create it automatically on first access.");
        }
    }

    /**
     * Create a new contact message
     */
    public ContactModel createContact(ContactModel contact) {
        System.out.println("💾 ContactService: Creating new contact from " + contact.getEmail());
        
        // Set default values if not provided
        if (contact.getStatus() == null) {
            contact.setStatus(ContactModel.Status.NEW);
        }
        if (contact.getCreatedAt() == null) {
            contact.setCreatedAt(LocalDateTime.now());
        }
        contact.setUpdatedAt(LocalDateTime.now());
        
        ContactModel savedContact = contactRepository.save(contact);
        System.out.println("✅ ContactService: Contact saved with ID " + savedContact.getId());
        
        return savedContact;
    }

    /**
     * Get all contacts ordered by creation date (newest first)
     */
    public List<ContactModel> getAllContacts() {
        System.out.println("📋 ContactService: Fetching all contacts...");
        return contactRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Get contacts with pagination
     */
    public Page<ContactModel> getAllContacts(Pageable pageable) {
        System.out.println("📋 ContactService: Fetching contacts with pagination...");
        return contactRepository.findAll(pageable);
    }

    /**
     * Get contact by ID
     */
    public Optional<ContactModel> getContactById(Long id) {
        System.out.println("🔍 ContactService: Finding contact with ID " + id);
        return contactRepository.findById(id);
    }

    /**
     * Get contacts by status
     */
    public List<ContactModel> getContactsByStatus(ContactModel.Status status) {
        System.out.println("🔍 ContactService: Finding contacts with status " + status);
        return contactRepository.findByStatus(status);
    }

    /**
     * Get unread contacts (NEW status)
     */
    public List<ContactModel> getUnreadContacts() {
        System.out.println("📬 ContactService: Finding unread contacts...");
        return contactRepository.findUnreadContacts();
    }

    /**
     * Get contacts by email
     */
    public List<ContactModel> getContactsByEmail(String email) {
        System.out.println("🔍 ContactService: Finding contacts for email " + email);
        return contactRepository.findByEmail(email);
    }

    /**
     * Update contact status
     */
    public ContactModel updateContactStatus(Long id, ContactModel.Status status) {
        System.out.println("🔄 ContactService: Updating contact " + id + " status to " + status);
        
        Optional<ContactModel> contactOpt = contactRepository.findById(id);
        if (contactOpt.isPresent()) {
            ContactModel contact = contactOpt.get();
            contact.setStatus(status);
            contact.setUpdatedAt(LocalDateTime.now());
            
            ContactModel savedContact = contactRepository.save(contact);
            System.out.println("✅ ContactService: Contact status updated successfully");
            return savedContact;
        } else {
            System.err.println("❌ ContactService: Contact not found with ID " + id);
            throw new RuntimeException("Contact not found with ID: " + id);
        }
    }

    /**
     * Update contact with admin notes
     */
    public ContactModel updateContact(Long id, ContactModel updates) {
        System.out.println("🔄 ContactService: Updating contact " + id);
        
        Optional<ContactModel> contactOpt = contactRepository.findById(id);
        if (contactOpt.isPresent()) {
            ContactModel contact = contactOpt.get();
            
            // Update fields if provided
            if (updates.getStatus() != null) {
                contact.setStatus(updates.getStatus());
            }
            if (updates.getAdminNotes() != null) {
                contact.setAdminNotes(updates.getAdminNotes());
            }
            if (updates.getAdminReply() != null) {
                contact.setAdminReply(updates.getAdminReply());
                contact.setRepliedAt(LocalDateTime.now());
            }
            if (updates.getRepliedBy() != null) {
                contact.setRepliedBy(updates.getRepliedBy());
            }
            
            contact.setUpdatedAt(LocalDateTime.now());
            
            ContactModel savedContact = contactRepository.save(contact);
            System.out.println("✅ ContactService: Contact updated successfully");
            return savedContact;
        } else {
            System.err.println("❌ ContactService: Contact not found with ID " + id);
            throw new RuntimeException("Contact not found with ID: " + id);
        }
    }

    /**
     * Reply to a contact message
     */
    public ContactModel replyToContact(Long id, String reply, String repliedBy) {
        System.out.println("💬 ContactService: Adding reply to contact " + id);
        
        Optional<ContactModel> contactOpt = contactRepository.findById(id);
        if (contactOpt.isPresent()) {
            ContactModel contact = contactOpt.get();
            
            contact.setAdminReply(reply);
            contact.setRepliedBy(repliedBy);
            contact.setRepliedAt(LocalDateTime.now());
            contact.setStatus(ContactModel.Status.RESOLVED);
            contact.setUpdatedAt(LocalDateTime.now());
            
            ContactModel savedContact = contactRepository.save(contact);
            System.out.println("✅ ContactService: Reply added successfully");
            return savedContact;
        } else {
            System.err.println("❌ ContactService: Contact not found with ID " + id);
            throw new RuntimeException("Contact not found with ID: " + id);
        }
    }

    /**
     * Delete a contact message
     */
    public void deleteContact(Long id) {
        System.out.println("🗑️ ContactService: Deleting contact " + id);
        
        if (contactRepository.existsById(id)) {
            contactRepository.deleteById(id);
            System.out.println("✅ ContactService: Contact deleted successfully");
        } else {
            System.err.println("❌ ContactService: Contact not found with ID " + id);
            throw new RuntimeException("Contact not found with ID: " + id);
        }
    }

    /**
     * Get contact statistics
     */
    public Map<String, Object> getContactStatistics() {
        System.out.println("📊 ContactService: Calculating contact statistics...");
        
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long total = contactRepository.count();
            long newCount = contactRepository.countByStatus(ContactModel.Status.NEW);
            long inProgressCount = contactRepository.countByStatus(ContactModel.Status.IN_PROGRESS);
            long resolvedCount = contactRepository.countByStatus(ContactModel.Status.RESOLVED);
            long closedCount = contactRepository.countByStatus(ContactModel.Status.CLOSED);
            
            stats.put("total", total);
            stats.put("new", newCount);
            stats.put("inProgress", inProgressCount);
            stats.put("resolved", resolvedCount);
            stats.put("closed", closedCount);
            
            System.out.println("📈 ContactService: Statistics calculated - Total: " + total + 
                             ", New: " + newCount + ", In Progress: " + inProgressCount + 
                             ", Resolved: " + resolvedCount + ", Closed: " + closedCount);
            
            return stats;
        } catch (Exception e) {
            System.err.println("❌ ContactService: Error calculating statistics: " + e.getMessage());
            e.printStackTrace();
            
            // Return default values if error occurs
            stats.put("total", 0L);
            stats.put("new", 0L);
            stats.put("inProgress", 0L);
            stats.put("resolved", 0L);
            stats.put("closed", 0L);
            
            return stats;
        }
    }

    /**
     * Check if contact exists by ID
     */
    public boolean existsById(Long id) {
        return contactRepository.existsById(id);
    }

    /**
     * Get total contact count
     */
    public long getTotalContactCount() {
        return contactRepository.count();
    }
}
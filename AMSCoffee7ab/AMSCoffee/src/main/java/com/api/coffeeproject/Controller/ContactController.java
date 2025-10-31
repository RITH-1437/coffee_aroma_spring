package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.ContactModel;
import com.api.coffeeproject.Service.ContactService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS}, allowedHeaders = "*")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
        System.out.println("🚀 ContactController initialized!");
    }
    
    // Simple test endpoint
    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint() {
        System.out.println("🧪 Test endpoint accessed!");
        return ResponseEntity.ok("Contact API is working!");
    }
    
    // Explicit OPTIONS handler for CORS preflight
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity<Void> handleOptions() {
        System.out.println("🔄 OPTIONS request received for CORS preflight");
        return ResponseEntity.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .build();
    }

    // ✅ Get all contact messages (ordered by newest first)
    @GetMapping
    public ResponseEntity<List<ContactModel>> getAllContacts() {
        System.out.println("📋 GET /api/contacts - Fetching all contacts...");
        try {
            List<ContactModel> contacts = contactService.getAllContacts();
            System.out.println("📊 Found " + contacts.size() + " contacts");
            return ResponseEntity.ok(contacts);
        } catch (Exception e) {
            System.err.println("❌ Error fetching contacts: " + e.getMessage());
            e.printStackTrace();
            // Return empty list instead of causing error
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // ✅ Get contact by ID
    @GetMapping("/{id}")
    public ResponseEntity<ContactModel> getContactById(@PathVariable Long id) {
        Optional<ContactModel> contact = contactService.getContactById(id);
        return contact.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    // ✅ Get contacts by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ContactModel>> getContactsByStatus(@PathVariable String status) {
        try {
            ContactModel.Status contactStatus = ContactModel.Status.valueOf(status.toUpperCase());
            List<ContactModel> contacts = contactService.getContactsByStatus(contactStatus);
            return ResponseEntity.ok(contacts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ✅ Get unread contacts (NEW status)
    @GetMapping("/unread")
    public ResponseEntity<List<ContactModel>> getUnreadContacts() {
        System.out.println("📬 GET /api/contacts/unread - Fetching unread contacts...");
        List<ContactModel> contacts = contactService.getUnreadContacts();
        System.out.println("📬 Found " + contacts.size() + " unread contacts");
        return ResponseEntity.ok(contacts);
    }

    // ✅ Get contact statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getContactStats() {
        System.out.println("📊 Fetching contact stats...");
        try {
            Map<String, Object> stats = contactService.getContactStatistics();
            System.out.println("📈 Contact stats: " + stats);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("❌ Error fetching contact stats: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> emptyStats = new HashMap<>();
            emptyStats.put("total", 0);
            emptyStats.put("new", 0);
            emptyStats.put("inProgress", 0);
            emptyStats.put("resolved", 0);
            emptyStats.put("closed", 0);
            return ResponseEntity.ok(emptyStats);
        }
    }

    // ✅ Create new contact message (from contact form)
    @PostMapping
    public ResponseEntity<Map<String, Object>> createContact(@RequestBody ContactModel contact) {
        System.out.println("🔍 POST /api/contacts - Received contact submission");
        System.out.println("📋 Contact data: " + contact);
        System.out.println("📧 Email: " + (contact != null ? contact.getEmail() : "null"));
        System.out.println("👤 Name: " + (contact != null ? contact.getName() : "null"));
        
        try {
            if (contact == null) {
                System.err.println("❌ Contact object is null!");
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Contact data is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            ContactModel savedContact = contactService.createContact(contact);
            System.out.println("✅ Contact saved with ID: " + savedContact.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contact form submitted successfully!");
            response.put("contactId", savedContact.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            System.err.println("❌ Error saving contact: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to submit contact form: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ✅ Update contact status or admin notes
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateContact(@PathVariable Long id, @RequestBody ContactModel updatedContact) {
        try {
            ContactModel savedContact = contactService.updateContact(id, updatedContact);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contact updated successfully!");
            response.put("contact", savedContact);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Admin reply to contact
    @PostMapping("/{id}/reply")
    public ResponseEntity<Map<String, Object>> replyToContact(
            @PathVariable Long id, 
            @RequestBody Map<String, String> replyData) {
        
        try {
            ContactModel savedContact = contactService.replyToContact(
                id, 
                replyData.get("reply"), 
                replyData.get("repliedBy")
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reply sent successfully!");
            response.put("contact", savedContact);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ Delete a contact message
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteContact(@PathVariable Long id) {
        try {
            contactService.deleteContact(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contact deleted successfully!");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.notFound().build();
        }
    }
}

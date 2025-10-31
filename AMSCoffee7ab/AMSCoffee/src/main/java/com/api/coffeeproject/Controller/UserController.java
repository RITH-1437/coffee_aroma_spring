package com.api.coffeeproject.Controller;

import com.api.coffeeproject.Model.UserModel;
import com.api.coffeeproject.Service.UserService;
import com.api.coffeeproject.Util.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
// import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    // Use lower rounds for faster registration (4 rounds instead of default 10)
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // Register new user
    @PostMapping("/register")
    public String register(@RequestBody UserModel user) {
        try {
            // Check if user already exists
            if (userService.getByEmail(user.getEmail()).isPresent()) {
                return "Email already exists!";
            }
            
            // Validate required fields
            if (user.getFirstName() == null || user.getFirstName().trim().isEmpty()) {
                return "First name is required!";
            }
            if (user.getLastName() == null || user.getLastName().trim().isEmpty()) {
                return "Last name is required!";
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return "Email is required!";
            }
            if (user.getPasswordHash() == null || user.getPasswordHash().trim().isEmpty()) {
                return "Password is required!";
            }
            
            // Set default values
            if (user.getRole() == null || user.getRole().trim().isEmpty()) {
                user.setRole("customer");
            }
            
            // Hash the password
            user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
            
            // Save user
            UserModel savedUser = userService.save(user);
            System.out.println("✅ New user registered: " + savedUser.getEmail() + " with role: " + savedUser.getRole());
            return "User registered successfully!";
        } catch (Exception e) {
            System.err.println("❌ Registration error: " + e.getMessage());
            return "Registration failed: " + e.getMessage();
        }
    }

    // Login and get token
    @PostMapping("/login")
    public String login(@RequestBody UserModel user) {
        try {
            System.out.println("🔐 Login attempt for email: " + user.getEmail());
            
            Optional<UserModel> existing = userService.getByEmail(user.getEmail());
            if (existing.isPresent()) {
                System.out.println("👤 User found with role: " + existing.get().getRole());
                
                if (passwordEncoder.matches(user.getPasswordHash(), existing.get().getPasswordHash())) {
                    String token = jwtUtil.generateToken(existing.get().getEmail(), existing.get().getRole());
                    System.out.println("✅ Login successful for: " + user.getEmail());
                    return "Bearer " + token;
                } else {
                    System.out.println("❌ Invalid password for: " + user.getEmail());
                }
            } else {
                System.out.println("❌ User not found: " + user.getEmail());
            }
            
            return "Invalid email or password!";
        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            return "Login failed: " + e.getMessage();
        }
    }

    // Get all users (protected manually)
    @GetMapping
    public Object getAll(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return "Missing token!";
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return "Invalid or expired token!";
        }
        return userService.getAll();
    }

    @GetMapping("/{id}")
    public Object getById(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        if (!jwtUtil.validateToken(authHeader.substring(7))) return "Unauthorized!";
        return userService.getById(id);
    }

    @PutMapping("/{id}")
    public Object updateUser(@PathVariable Long id, @RequestBody UserModel newUser,
                             @RequestHeader("Authorization") String authHeader) {
        try {
            if (!jwtUtil.validateToken(authHeader.substring(7))) return "Unauthorized!";
            
            System.out.println("🔄 Updating user ID: " + id);
            System.out.println("📝 Update data: " + newUser.getFirstName() + " " + newUser.getLastName() + " - " + newUser.getEmail());
            
            return userService.getById(id).map(existingUser -> {
                // Update fields
                if (newUser.getFirstName() != null) {
                    existingUser.setFirstName(newUser.getFirstName());
                }
                if (newUser.getLastName() != null) {
                    existingUser.setLastName(newUser.getLastName());
                }
                if (newUser.getEmail() != null) {
                    existingUser.setEmail(newUser.getEmail());
                }
                if (newUser.getPhone() != null) {
                    existingUser.setPhone(newUser.getPhone());
                }
                if (newUser.getRole() != null) {
                    existingUser.setRole(newUser.getRole());
                }
                if (newUser.getIsActive() != null) {
                    existingUser.setIsActive(newUser.getIsActive());
                }
                
                // Only update password if provided and not empty
                if (newUser.getPasswordHash() != null && !newUser.getPasswordHash().trim().isEmpty()) {
                    existingUser.setPasswordHash(passwordEncoder.encode(newUser.getPasswordHash()));
                    System.out.println("🔐 Password updated for user: " + existingUser.getEmail());
                }
                
                existingUser.setUpdatedAt(java.time.LocalDateTime.now());
                UserModel savedUser = userService.save(existingUser);
                System.out.println("✅ User updated successfully: " + savedUser.getEmail());
                return "User updated successfully!";
            }).orElse("User not found!");
        } catch (Exception e) {
            System.err.println("❌ Update error: " + e.getMessage());
            return "Update failed: " + e.getMessage();
        }
    }

    @DeleteMapping("/{id}")
    public Object deleteUser(@PathVariable Long id, @RequestHeader("Authorization") String authHeader) {
        if (!jwtUtil.validateToken(authHeader.substring(7))) return "Unauthorized!";
        userService.delete(id);
        return "Deleted user successfully!";
    }
}

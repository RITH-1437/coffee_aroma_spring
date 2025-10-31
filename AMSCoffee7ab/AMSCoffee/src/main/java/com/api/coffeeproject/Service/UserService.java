package com.api.coffeeproject.Service;

import com.api.coffeeproject.Model.UserModel;
import com.api.coffeeproject.Repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    public List<UserModel> getAll() {
        return users.findAll();
    }

    public Optional<UserModel> getById(Long id) {
        return users.findById(id);
    }

    public Optional<UserModel> getByEmail(String email) {
        return users.findByEmail(email);
    }

    public UserModel save(UserModel user) {
        return users.save(user);
    }

    public void delete(Long id) {
        users.deleteById(id);
    }
}

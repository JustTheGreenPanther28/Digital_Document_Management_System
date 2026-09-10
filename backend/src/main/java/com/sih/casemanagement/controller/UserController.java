package com.sih.casemanagement.controller;

import com.sih.casemanagement.dto.CreateUserRequest;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER') or hasAuthority('ADMIN_USER_PROVISION')")
    public ResponseEntity<User> createUser(@Valid @RequestBody CreateUserRequest request) {
        User created = userService.createUser(
            request.username(),
            request.email(),
            request.password(),
            request.fullName(),
            request.badgeNumber(),
            request.department(),
            request.securityClearance(),
            request.roles()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER') or hasAuthority('ADMIN_USER_PROVISION')")
    public ResponseEntity<List<User>> bulkCreateUsers(@Valid @RequestBody List<CreateUserRequest> requests) {
        List<User> createdUsers = new java.util.ArrayList<>();
        for (CreateUserRequest request : requests) {
            try {
                User created = userService.createUser(
                    request.username(),
                    request.email(),
                    request.password(),
                    request.fullName(),
                    request.badgeNumber(),
                    request.department(),
                    request.securityClearance(),
                    request.roles()
                );
                createdUsers.add(created);
            } catch (Exception ignored) {
                // Keep processing remaining valid users in the batch
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUsers);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_OFFICER') or hasAuthority('ADMIN_USER_PROVISION')")
    public ResponseEntity<User> updateStatus(
        @PathVariable UUID id,
        @RequestBody Map<String, Boolean> body
    ) {
        User target = userService.getUserById(id);
        if ("admin".equalsIgnoreCase(target.getUsername())) {
            // Root administrator is permanently protected and immune from locks
            return ResponseEntity.ok(userService.setUserStatus(id, true, false));
        }
        boolean enabled = body.getOrDefault("enabled", true);
        boolean locked = body.getOrDefault("locked", false);
        return ResponseEntity.ok(userService.setUserStatus(id, enabled, locked));
    }
}

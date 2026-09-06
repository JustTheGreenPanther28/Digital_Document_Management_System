package com.sih.casemanagement.controller;

import com.sih.casemanagement.entity.Permission;
import com.sih.casemanagement.entity.Role;
import com.sih.casemanagement.repository.PermissionRepository;
import com.sih.casemanagement.repository.RoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminRolePermissionController {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public AdminRolePermissionController(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionRepository.findAll());
    }

    @PutMapping("/roles/{roleId}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Role> updateRolePermissions(
        @PathVariable java.util.UUID roleId,
        @RequestBody java.util.List<java.util.UUID> permissionIds
    ) {
        Role role = roleRepository.findById(roleId)
            .orElseThrow(() -> new com.sih.casemanagement.common.exception.ResourceNotFoundException("Role not found: " + roleId));

        java.util.List<Permission> perms = permissionRepository.findAllById(permissionIds);
        role.setPermissions(new java.util.HashSet<>(perms));
        Role saved = roleRepository.save(role);
        return ResponseEntity.ok(saved);
    }
}

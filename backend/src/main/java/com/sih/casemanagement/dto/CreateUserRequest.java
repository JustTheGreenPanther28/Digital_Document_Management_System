package com.sih.casemanagement.dto;

import com.sih.casemanagement.common.enums.RoleType;
import com.sih.casemanagement.common.enums.SecurityClearance;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record CreateUserRequest(
    @NotBlank @Size(min = 3, max = 50) String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank String fullName,
    String badgeNumber,
    String department,
    SecurityClearance securityClearance,
    @NotEmpty Set<RoleType> roles
) {}

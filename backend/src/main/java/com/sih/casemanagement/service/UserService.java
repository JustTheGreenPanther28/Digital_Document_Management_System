package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.RoleType;
import com.sih.casemanagement.common.enums.SecurityClearance;
import com.sih.casemanagement.common.exception.ResourceNotFoundException;
import com.sih.casemanagement.common.exception.SecurityValidationException;
import com.sih.casemanagement.entity.Role;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.RoleRepository;
import com.sih.casemanagement.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public User createUser(String username, String email, String rawPassword, String fullName, String badgeNumber,
			String department, SecurityClearance clearance, Set<RoleType> roleTypes) {
		if (userRepository.existsByUsername(username)) {
			throw new SecurityValidationException("Username '" + username + "' is already in use.");
		}
		if (userRepository.existsByEmail(email)) {
			throw new SecurityValidationException("Email '" + email + "' is already in use.");
		}

		User user = new User();
		user.setUsername(username);
		user.setEmail(email);
		user.setPasswordHash(passwordEncoder.encode(rawPassword));
		user.setFullName(fullName);
		user.setBadgeNumber(badgeNumber);
		user.setDepartment(department);
		user.setSecurityClearance(clearance != null ? clearance : SecurityClearance.PUBLIC);
		user.setEnabled(true);
		user.setAccountLocked(false);

		Set<Role> roles = new HashSet<>();
		if (roleTypes != null) {
			for (RoleType rt : roleTypes) {
				roleRepository.findByName(rt).ifPresent(roles::add);
			}
		}
		user.setRoles(roles);

		return userRepository.save(user);
	}

	@Transactional
	public User setUserStatus(UUID userId, boolean enabled, boolean locked) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

		// Root Administrator account is protected and cannot be disabled or locked
		if ("admin".equalsIgnoreCase(user.getUsername())) {
			user.setEnabled(true);
			user.setAccountLocked(false);
			user.setFailedLoginAttempts(0);
			user.setLockTime(null);
			return userRepository.save(user);
		}

		user.setEnabled(enabled);
		user.setAccountLocked(locked);
		if (!locked) {
			user.setFailedLoginAttempts(0);
			user.setLockTime(null);
		}
		return userRepository.save(user);
	}

	@Transactional(readOnly = true)
	public List<User> getAllUsers() {
		return userRepository.findAll();
	}

	@Transactional(readOnly = true)
	public User getUserById(UUID userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
	}
}

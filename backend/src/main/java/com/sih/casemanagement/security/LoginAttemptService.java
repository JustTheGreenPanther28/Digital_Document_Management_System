package com.sih.casemanagement.security;

import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    private final UserRepository userRepository;
    private final int maxFailedAttempts;
    private final int lockoutDurationMinutes;

    public LoginAttemptService(
        UserRepository userRepository,
        @Value("${app.security.max-failed-attempts:5}") int maxFailedAttempts,
        @Value("${app.security.lockout-duration-minutes:15}") int lockoutDurationMinutes
    ) {
        this.userRepository = userRepository;
        this.maxFailedAttempts = maxFailedAttempts;
        this.lockoutDurationMinutes = lockoutDurationMinutes;
    }

    @Transactional
    public void loginSucceeded(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setAccountLocked(false);
                user.setLockTime(null);
                userRepository.save(user);
            }
        });
    }

    @Transactional
    public void loginFailed(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            int newAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(newAttempts);

            if (newAttempts >= maxFailedAttempts) {
                user.setAccountLocked(true);
                user.setLockTime(Instant.now());
                log.warn("SECURITY ALERT: User account locked due to excessive failed attempts: {}", username);
            }
            userRepository.save(user);
        });
    }

    @Transactional
    public boolean isAccountLocked(User user) {
        if (!user.isAccountLocked()) {
            return false;
        }
        if (user.getLockTime() != null) {
            Instant unlockTime = user.getLockTime().plus(Duration.ofMinutes(lockoutDurationMinutes));
            if (Instant.now().isAfter(unlockTime)) {
                // Auto-unlock expired lockout
                user.setAccountLocked(false);
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
                log.info("User account unlocked after lockout period: {}", user.getUsername());
                return false;
            }
        }
        return true;
    }
}

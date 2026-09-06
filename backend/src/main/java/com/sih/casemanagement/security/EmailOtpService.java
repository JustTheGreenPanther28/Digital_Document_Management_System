package com.sih.casemanagement.security;

import com.sih.casemanagement.service.EmailService;
import com.sih.casemanagement.service.RateLimitingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EmailOtpService {

    private static final Logger log = LoggerFactory.getLogger(EmailOtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;
    private final RateLimitingService rateLimitingService;

    @Value("${app.mail.otp-expiration-seconds:300}")
    private int otpExpirationSeconds;

    private final Map<String, OtpEntry> localOtpStore = new ConcurrentHashMap<>();

    private record OtpEntry(String code, Instant expiresAt, int attempts) {}

    public EmailOtpService(
        EmailService emailService,
        @Autowired(required = false) StringRedisTemplate redisTemplate,
        RateLimitingService rateLimitingService
    ) {
        this.emailService = emailService;
        this.redisTemplate = redisTemplate;
        this.rateLimitingService = rateLimitingService;
    }

    public String generateAndSendOtp(String username, String recipientEmail) {
        int num = 100000 + RANDOM.nextInt(900000);
        String otpCode = String.valueOf(num);

        String redisKey = "email_otp:" + username.toLowerCase();

        boolean storedInRedis = false;
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(redisKey, otpCode, Duration.ofSeconds(otpExpirationSeconds));
                storedInRedis = true;
            } catch (Exception e) {
                log.warn("Could not store Email OTP in Redis: {}", e.getMessage());
            }
        }

        if (!storedInRedis) {
            localOtpStore.put(username.toLowerCase(), new OtpEntry(otpCode, Instant.now().plusSeconds(otpExpirationSeconds), 0));
        }

        emailService.sendOtpEmail(recipientEmail, username, otpCode, otpExpirationSeconds);
        return otpCode;
    }

    public boolean verifyOtp(String username, String submittedCode) {
        if (username == null || submittedCode == null || submittedCode.isBlank()) {
            return false;
        }

        String cleanUser = username.toLowerCase();
        String cleanCode = submittedCode.trim();

        if (redisTemplate != null) {
            try {
                String redisKey = "email_otp:" + cleanUser;
                String stored = redisTemplate.opsForValue().get(redisKey);
                if (stored != null) {
                    boolean match = stored.equals(cleanCode);
                    if (match) {
                        redisTemplate.delete(redisKey);
                        return true;
                    }
                    return false;
                }
            } catch (Exception e) {
                log.warn("Redis check for OTP failed: {}", e.getMessage());
            }
        }

        OtpEntry entry = localOtpStore.get(cleanUser);
        if (entry == null) {
            return false;
        }

        if (Instant.now().isAfter(entry.expiresAt())) {
            localOtpStore.remove(cleanUser);
            return false;
        }

        if (entry.attempts() >= 5) {
            localOtpStore.remove(cleanUser);
            log.warn("Excessive OTP attempts for user {}", username);
            return false;
        }

        if (entry.code().equals(cleanCode)) {
            localOtpStore.remove(cleanUser);
            return true;
        } else {
            localOtpStore.put(cleanUser, new OtpEntry(entry.code(), entry.expiresAt(), entry.attempts() + 1));
            return false;
        }
    }
}
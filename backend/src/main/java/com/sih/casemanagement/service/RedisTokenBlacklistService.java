package com.sih.casemanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RedisTokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(RedisTokenBlacklistService.class);
    private static final String BLACKLIST_PREFIX = "token:blacklist:";

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // Local in-memory fallback for local dev / testing if Redis instance is unreachable
    private final Map<String, Long> localBlacklist = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long expiryDurationMs) {
        if (token == null || token.isBlank()) return;

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + token,
                    "REVOKED",
                    Duration.ofMillis(Math.max(expiryDurationMs, 60000))
                );
                log.info("Token successfully blacklisted in Redis.");
                return;
            } catch (Exception e) {
                log.warn("Redis unreachable for blacklisting, falling back to local memory: {}", e.getMessage());
            }
        }

        localBlacklist.put(token, System.currentTimeMillis() + expiryDurationMs);
    }

    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) return false;

        if (redisTemplate != null) {
            try {
                Boolean exists = redisTemplate.hasKey(BLACKLIST_PREFIX + token);
                if (Boolean.TRUE.equals(exists)) {
                    return true;
                }
            } catch (Exception e) {
                log.warn("Redis error checking blacklist: {}", e.getMessage());
            }
        }

        Long expiry = localBlacklist.get(token);
        if (expiry != null) {
            if (System.currentTimeMillis() < expiry) {
                return true;
            } else {
                localBlacklist.remove(token);
            }
        }

        return false;
    }
}

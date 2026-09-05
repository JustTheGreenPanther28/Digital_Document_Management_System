package com.sih.casemanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimitingService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingService.class);
    private static final String RATE_LIMIT_PREFIX = "rate_limit:";

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // In-memory fallback
    private final Map<String, WindowCounter> localRateLimits = new ConcurrentHashMap<>();

    private record WindowCounter(AtomicInteger count, long resetTimeMs) {}

    public boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        if (redisTemplate != null) {
            try {
                String redisKey = RATE_LIMIT_PREFIX + key;
                Long current = redisTemplate.opsForValue().increment(redisKey);
                if (current != null && current == 1) {
                    redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds));
                }
                if (current != null && current > maxRequests) {
                    log.warn("Rate limit exceeded in Redis for key: {} (count: {}/{})", key, current, maxRequests);
                    return false;
                }
                return true;
            } catch (Exception e) {
                log.warn("Redis rate limiter unavailable, falling back to local: {}", e.getMessage());
            }
        }

        // Local in-memory sliding window fallback
        long now = System.currentTimeMillis();
        WindowCounter counter = localRateLimits.compute(key, (k, existing) -> {
            if (existing == null || now > existing.resetTimeMs()) {
                return new WindowCounter(new AtomicInteger(1), now + (windowSeconds * 1000L));
            }
            existing.count().incrementAndGet();
            return existing;
        });

        if (counter.count().get() > maxRequests) {
            log.warn("Local rate limit exceeded for key: {} (count: {}/{})", key, counter.count().get(), maxRequests);
            return false;
        }

        return true;
    }
}

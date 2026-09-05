package com.sih.casemanagement.security;

import com.sih.casemanagement.service.RedisTokenBlacklistService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final String issuer;
    private final String audience;
    private final RedisTokenBlacklistService redisTokenBlacklistService;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
        @Value("${app.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs,
        @Value("${app.jwt.issuer:sih190-security-auth}") String issuer,
        @Value("${app.jwt.audience:sih190-api}") String audience,
        RedisTokenBlacklistService redisTokenBlacklistService
    ) {
        byte[] rawBytes = secret.getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes;
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            keyBytes = digest.digest(rawBytes);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 digest algorithm not available", e);
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.issuer = issuer;
        this.audience = audience;
        this.redisTokenBlacklistService = redisTokenBlacklistService;
    }

    public String generateAccessToken(UserPrincipal principal) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpirationMs);

        List<String> roles = principal.getAuthorities().stream()
            .map(auth -> auth.getAuthority().replace("ROLE_", ""))
            .toList();

        return Jwts.builder()
            .subject(principal.getUsername())
            .claim("userId", principal.getId().toString())
            .claim("email", principal.getEmail())
            .claim("fullName", principal.getFullName())
            .claim("roles", roles)
            .claim("clearance", principal.getClearance().name())
            .claim("tokenType", "ACCESS")
            .issuer(issuer)
            .audience().add(audience).and()
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact();
    }

    public String generatePreAuthMfaToken(String username, UUID userId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(300000); // 5 minutes

        return Jwts.builder()
            .subject(username)
            .claim("userId", userId.toString())
            .claim("tokenType", "PRE_AUTH_MFA")
            .issuer(issuer)
            .audience().add(audience).and()
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .signWith(signingKey)
            .compact();
    }

    public boolean validateToken(String token) {
        if (token == null || isTokenRevoked(token)) {
            return false;
        }
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            // Validate audience if present
            if (claims.getAudience() != null && !claims.getAudience().isEmpty()) {
                if (!claims.getAudience().contains(audience)) {
                    log.warn("JWT audience validation failed: expected {}, received {}", audience, claims.getAudience());
                    return false;
                }
            }
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Invalid JWT token: {}", ex.getMessage());
            return false;
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public void revokeToken(String token) {
        if (token != null) {
            try {
                Claims claims = extractClaims(token);
                Date expiration = claims.getExpiration();
                long remainingMs = (expiration != null) ? expiration.getTime() - System.currentTimeMillis() : accessTokenExpirationMs;
                redisTokenBlacklistService.blacklistToken(token, Math.max(remainingMs, 1000));
            } catch (Exception e) {
                redisTokenBlacklistService.blacklistToken(token, accessTokenExpirationMs);
            }
        }
    }

    public boolean isTokenRevoked(String token) {
        return redisTokenBlacklistService.isBlacklisted(token);
    }
}

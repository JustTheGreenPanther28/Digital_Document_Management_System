package com.sih.casemanagement.controller;

import com.sih.casemanagement.common.enums.AuditEventType;
import com.sih.casemanagement.common.exception.SecurityValidationException;
import com.sih.casemanagement.common.exception.UnauthorizedAccessException;
import com.sih.casemanagement.dto.*;
import com.sih.casemanagement.entity.PasswordResetToken;
import com.sih.casemanagement.entity.RefreshToken;
import com.sih.casemanagement.entity.User;
import com.sih.casemanagement.repository.PasswordResetTokenRepository;
import com.sih.casemanagement.repository.RefreshTokenRepository;
import com.sih.casemanagement.repository.UserRepository;
import com.sih.casemanagement.security.JwtService;
import com.sih.casemanagement.security.LoginAttemptService;
import com.sih.casemanagement.security.TotpService;
import com.sih.casemanagement.security.UserPrincipal;
import com.sih.casemanagement.service.AuditService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TotpService totpService;
    private final LoginAttemptService loginAttemptService;
    private final AuditService auditService;

    @Value("${app.auth.cookie-secure:false}")
    private boolean cookieSecure;

    public AuthController(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        PasswordResetTokenRepository passwordResetTokenRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        TotpService totpService,
        LoginAttemptService loginAttemptService,
        AuditService auditService
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.totpService = totpService;
        this.loginAttemptService = loginAttemptService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String ipAddress = httpRequest.getRemoteAddr();

        User user = userRepository.findByUsername(request.username())
            .or(() -> userRepository.findByEmail(request.username()))
            .orElseThrow(() -> {
                auditService.logEvent(AuditEventType.LOGIN_FAILED, null, request.username(), "UNKNOWN", null, "AUTH", null, ipAddress, null, "User not found");
                return new UnauthorizedAccessException("Invalid credentials.");
            });

        if (loginAttemptService.isAccountLocked(user)) {
            auditService.logEvent(AuditEventType.ACCOUNT_LOCKED, user.getId(), user.getUsername(), "UNKNOWN", null, "AUTH", null, ipAddress, null, "Attempt on locked account");
            throw new UnauthorizedAccessException("Account is temporarily locked due to consecutive failed attempts. Please try again later.");
        }

        if (!user.isEnabled()) {
            throw new UnauthorizedAccessException("Account has been disabled. Contact system administrator.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptService.loginFailed(user.getUsername());
            auditService.logEvent(AuditEventType.LOGIN_FAILED, user.getId(), user.getUsername(), "UNKNOWN", null, "AUTH", null, ipAddress, null, "Password mismatch");
            throw new UnauthorizedAccessException("Invalid credentials.");
        }

        // Check if MFA is required
        if (user.isMfaEnabled()) {
            String preAuthToken = jwtService.generatePreAuthMfaToken(user.getUsername(), user.getId());
            return ResponseEntity.ok(AuthResponse.mfaChallenge(preAuthToken));
        }

        AuthResponse authResponse = generateFullAuthResponse(user, ipAddress);
        attachAuthCookies(httpResponse, authResponse.accessToken(), authResponse.refreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/demo-login")
    public ResponseEntity<AuthResponse> demoLogin(
        @Valid @RequestBody DemoLoginRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String ipAddress = httpRequest.getRemoteAddr();
        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new UnauthorizedAccessException("Demo user not found: " + request.username()));

        if (!user.isEnabled()) {
            throw new UnauthorizedAccessException("Account is disabled.");
        }

        AuthResponse authResponse = generateFullAuthResponse(user, ipAddress);
        attachAuthCookies(httpResponse, authResponse.accessToken(), authResponse.refreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<AuthResponse> verifyMfa(
        @Valid @RequestBody MfaVerifyRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String ipAddress = httpRequest.getRemoteAddr();

        if (!jwtService.validateToken(request.preAuthToken())) {
            throw new UnauthorizedAccessException("Pre-authentication MFA token is invalid or expired.");
        }

        Claims claims = jwtService.extractClaims(request.preAuthToken());
        if (!"PRE_AUTH_MFA".equalsIgnoreCase(claims.get("tokenType", String.class))) {
            throw new SecurityValidationException("Invalid token type for MFA verification.");
        }

        String username = claims.getSubject();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UnauthorizedAccessException("User not found."));

        boolean validCode = totpService.verifyCode(user.getMfaSecret(), request.code());
        if (!validCode) {
            loginAttemptService.loginFailed(user.getUsername());
            auditService.logEvent(AuditEventType.LOGIN_FAILED, user.getId(), user.getUsername(), "UNKNOWN", null, "MFA", null, ipAddress, null, "Invalid MFA OTP code");
            throw new UnauthorizedAccessException("Invalid MFA code.");
        }

        AuthResponse authResponse = generateFullAuthResponse(user, ipAddress);
        attachAuthCookies(httpResponse, authResponse.accessToken(), authResponse.refreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
        @Valid @RequestBody RefreshTokenRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse
    ) {
        String tokenStr = request.refreshToken();
        RefreshToken oldToken = refreshTokenRepository.findByToken(tokenStr)
            .orElseThrow(() -> new UnauthorizedAccessException("Invalid refresh token."));

        if (oldToken.isRevoked() || oldToken.getExpiryDate().isBefore(Instant.now())) {
            throw new UnauthorizedAccessException("Refresh token has expired or has been revoked.");
        }

        // Enforce Refresh Token Rotation: Revoke previous refresh token
        oldToken.setRevoked(true);
        refreshTokenRepository.save(oldToken);

        User user = oldToken.getUser();
        AuthResponse authResponse = generateFullAuthResponse(user, httpRequest.getRemoteAddr());
        attachAuthCookies(httpResponse, authResponse.accessToken(), authResponse.refreshToken());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        User user = userRepository.findByUsername(request.identifier())
            .or(() -> userRepository.findByEmail(request.identifier()))
            .orElse(null);

        if (user != null) {
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken(user, token, LocalDateTime.now().plusHours(1));
            passwordResetTokenRepository.save(resetToken);
            auditService.logEvent(AuditEventType.SECURITY_ALERT, user.getId(), user.getUsername(), "SYSTEM", null, "AUTH", null, "0.0.0.0", null, "Password reset token requested");
            return ResponseEntity.ok(Map.of(
                "message", "Password reset instructions initiated.",
                "resetToken", token // Provided for development/testing workflow
            ));
        }

        return ResponseEntity.ok(Map.of("message", "If an account exists, reset instructions have been generated."));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.token())
            .orElseThrow(() -> new SecurityValidationException("Invalid or expired password reset token."));

        if (resetToken.isUsed() || resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new SecurityValidationException("Password reset token has expired or already been utilized.");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        auditService.logEvent(AuditEventType.STATUS_CHANGE, user.getId(), user.getUsername(), "USER", null, "AUTH", null, "0.0.0.0", null, "Password reset successfully executed");

        return ResponseEntity.ok(Map.of("message", "Password updated successfully. You may now login."));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<Map<String, String>> setupMfa(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new UnauthorizedAccessException("User not found"));

        String secret = totpService.generateSecretKey();
        user.setMfaSecret(secret);
        user.setMfaEnabled(true);
        userRepository.save(user);

        String qrUrl = totpService.getOtpAuthUrl(user.getUsername(), secret);

        return ResponseEntity.ok(Map.of(
            "secret", secret,
            "otpAuthUrl", qrUrl,
            "message", "MFA activated. Please configure your authenticator application."
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
        HttpServletRequest request,
        HttpServletResponse response,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            jwtService.revokeToken(header.substring(7));
        }

        // Clear cookies
        ResponseCookie clearAccess = ResponseCookie.from("accessToken", "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();
        ResponseCookie clearRefresh = ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());

        if (principal != null) {
            auditService.logEvent(AuditEventType.LOGOUT, principal.getId(), principal.getUsername(), principal.getAuthorities().iterator().next().getAuthority(), null, "AUTH", null, request.getRemoteAddr(), null, "User logged out");
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedAccessException("Not authenticated");
        }
        List<String> roles = principal.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .toList();

        return ResponseEntity.ok(Map.of(
            "userId", principal.getId(),
            "username", principal.getUsername(),
            "email", principal.getEmail(),
            "fullName", principal.getFullName(),
            "clearance", principal.getClearance().name(),
            "roles", roles,
            "mfaEnabled", principal.isMfaEnabled()
        ));
    }

    private void attachAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        ResponseCookie accessCookie = ResponseCookie.from("accessToken", accessToken)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofMinutes(15))
            .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofDays(7))
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private AuthResponse generateFullAuthResponse(User user, String ipAddress) {
        loginAttemptService.loginSucceeded(user.getUsername());
        UserPrincipal principal = new UserPrincipal(user);

        String accessToken = jwtService.generateAccessToken(principal);
        String refreshTokenString = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken(user, refreshTokenString, Instant.now().plusSeconds(86400 * 7));
        refreshTokenRepository.save(refreshToken);

        List<String> roles = principal.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .toList();

        auditService.logEvent(
            AuditEventType.LOGIN,
            user.getId(),
            user.getUsername(),
            roles.isEmpty() ? "UNKNOWN" : roles.get(0),
            null,
            "AUTH",
            user.getId().toString(),
            ipAddress,
            null,
            "Successful authentication"
        );

        return AuthResponse.authenticated(
            accessToken,
            refreshTokenString,
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getSecurityClearance().name(),
            roles
        );
    }
}

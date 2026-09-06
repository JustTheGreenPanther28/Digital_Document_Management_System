package com.sih.casemanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@ndcms.gov.in}")
    private String fromEmail;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String recipientEmail, String username, String otpCode, int expirySeconds) {
        if (recipientEmail == null || recipientEmail.isBlank()) {
            log.warn("Cannot dispatch Email OTP: No recipient email provided for user {}", username);
            return;
        }

        String subject = "[NDCMS Vault] Security Verification Code: " + otpCode;
        String text = String.format(
            "OFFICIAL SECURITY NOTIFICATION%n%n" +
            "Hello %s,%n%n" +
            "Your One-Time Password (OTP) for National Digital Case & Evidence Management System access is:%n%n" +
            "      >>>  %s  <<<%n%n" +
            "This code is valid for %d minutes. If you did not initiate this authentication request, contact National Cyber Defense HQ immediately.%n%n" +
            "Do not disclose this passkey to anyone.",
            username, otpCode, expirySeconds / 60
        );

        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(recipientEmail);
                message.setSubject(subject);
                message.setText(text);
                mailSender.send(message);
                log.info("Dispatched Multi-Factor Email OTP to {}", recipientEmail);
                return;
            } catch (Exception e) {
                log.warn("Failed to dispatch email via SMTP ({}), falling back to secure audit channel", e.getMessage());
            }
        }

        log.info("[DEVELOPMENT / CONSOLE OTP DISPATCH] Multi-Factor Email OTP for user '{}' ({}) is: >>> {} <<< (Expires in {}s)",
            username, recipientEmail, otpCode, expirySeconds);
    }
}
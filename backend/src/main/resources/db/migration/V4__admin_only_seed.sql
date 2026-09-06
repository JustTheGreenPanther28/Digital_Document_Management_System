-- V4__admin_only_seed.sql
-- Security hardening migration: purge ALL demo/test users.
-- The only user that should exist is ADMIN, created at runtime by
-- AdminUserInitializer.java using environment-variable credentials.
--
-- This migration runs once on first production deployment.
-- It cascades through all FK-referencing tables via ON DELETE CASCADE.

-- 1. Remove all user-role assignments
DELETE FROM user_roles;

-- 2. Remove all refresh tokens (they reference users)
DELETE FROM refresh_tokens;

-- 3. Remove all password reset tokens
DELETE FROM password_reset_tokens;

-- 4. Remove all MFA credentials
DELETE FROM mfa_credentials;

-- 5. Finally remove all users
--    (remaining FK references use ON DELETE SET NULL or ON DELETE CASCADE)
DELETE FROM users;

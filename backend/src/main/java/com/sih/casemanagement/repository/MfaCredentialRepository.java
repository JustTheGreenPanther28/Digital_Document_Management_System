package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.MfaCredential;
import com.sih.casemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MfaCredentialRepository extends JpaRepository<MfaCredential, UUID> {
    Optional<MfaCredential> findByUser(User user);
    Optional<MfaCredential> findByUserId(UUID userId);
}

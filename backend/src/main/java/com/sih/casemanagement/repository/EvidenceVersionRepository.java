package com.sih.casemanagement.repository;

import com.sih.casemanagement.entity.EvidenceVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EvidenceVersionRepository extends JpaRepository<EvidenceVersion, UUID> {
    List<EvidenceVersion> findByEvidenceIdOrderByVersionNumberDesc(UUID evidenceId);
    List<EvidenceVersion> findByEvidenceIdOrderByVersionNumberAsc(UUID evidenceId);
}

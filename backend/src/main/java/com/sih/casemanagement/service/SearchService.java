package com.sih.casemanagement.service;

import com.sih.casemanagement.common.enums.RoleType;
import com.sih.casemanagement.entity.Case;
import com.sih.casemanagement.repository.CaseRepository;
import com.sih.casemanagement.security.AbacSecurityService;
import com.sih.casemanagement.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final CaseRepository caseRepository;
    private final AbacSecurityService abacSecurity;
    private final ElasticsearchService elasticsearchService;

    public SearchService(CaseRepository caseRepository, AbacSecurityService abacSecurity, ElasticsearchService elasticsearchService) {
        this.caseRepository = caseRepository;
        this.abacSecurity = abacSecurity;
        this.elasticsearchService = elasticsearchService;
    }

    @Transactional(readOnly = true)
    public Page<Case> searchCases(String query, Pageable pageable) {
        UserPrincipal principal = abacSecurity.getCurrentPrincipal();
        if (principal == null) {
            return Page.empty();
        }

        Set<Case> combinedCandidates = new LinkedHashSet<>();

        // 1. Query Elasticsearch index if available
        List<UUID> esCaseIds = elasticsearchService.searchCaseIds(query);
        if (!esCaseIds.isEmpty()) {
            List<Case> esCases = caseRepository.findAllById(esCaseIds);
            combinedCandidates.addAll(esCases);
        }

        // 2. Query PostgreSQL full-text/ILike search
        Page<Case> dbResults = caseRepository.searchCases(query, pageable);
        combinedCandidates.addAll(dbResults.getContent());

        boolean isAdmin = principal.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.ADMIN.name()));
        boolean isAuditor = principal.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_" + RoleType.AUDITOR.name()));

        // Filter results strictly according to ABAC assignment and classification clearance
        List<Case> authorizedResults = combinedCandidates.stream()
            .filter(c -> {
                // Check clearance level
                if (!principal.getClearance().canAccess(c.getClassification())) {
                    return false;
                }
                if (isAdmin || isAuditor) {
                    return true;
                }
                // Check case-level assignment
                return abacSecurity.canAccessCase(c.getId(), "READ");
            })
            .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), authorizedResults.size());
        List<Case> pageContent = (start <= end && start < authorizedResults.size())
            ? authorizedResults.subList(start, end)
            : Collections.emptyList();

        return new PageImpl<>(pageContent, pageable, authorizedResults.size());
    }
}

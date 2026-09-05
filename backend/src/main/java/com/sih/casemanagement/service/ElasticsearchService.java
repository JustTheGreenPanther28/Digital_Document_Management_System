package com.sih.casemanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;

@Service
public class ElasticsearchService {

    private static final Logger log = LoggerFactory.getLogger(ElasticsearchService.class);

    private final RestTemplate restTemplate;
    private final String elasticsearchUrl;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public ElasticsearchService(
        RestTemplateBuilder restTemplateBuilder,
        ObjectMapper objectMapper,
        @Value("${app.elasticsearch.url:http://localhost:9200}") String elasticsearchUrl,
        @Value("${app.elasticsearch.enabled:true}") boolean enabled
    ) {
        this.restTemplate = restTemplateBuilder
            .setConnectTimeout(Duration.ofMillis(2000))
            .setReadTimeout(Duration.ofMillis(3000))
            .build();
        this.elasticsearchUrl = elasticsearchUrl.endsWith("/") ? elasticsearchUrl.substring(0, elasticsearchUrl.length() - 1) : elasticsearchUrl;
        this.objectMapper = objectMapper;
        this.enabled = enabled;
    }

    public void indexCase(UUID caseId, String caseNumber, String title, String description, String classification) {
        if (!enabled) return;

        try {
            String url = elasticsearchUrl + "/cases/_doc/" + caseId.toString();
            Map<String, Object> body = Map.of(
                "caseId", caseId.toString(),
                "caseNumber", caseNumber,
                "title", title,
                "description", description != null ? description : "",
                "classification", classification
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            restTemplate.put(url, request);
            log.debug("Successfully indexed case {} in Elasticsearch.", caseNumber);
        } catch (Exception e) {
            log.warn("Elasticsearch indexing omitted/unreachable for case {}: {}", caseNumber, e.getMessage());
        }
    }

    public List<UUID> searchCaseIds(String query) {
        if (!enabled || query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        try {
            String url = elasticsearchUrl + "/cases/_search";
            Map<String, Object> queryMap = Map.of(
                "query", Map.of(
                    "multi_match", Map.of(
                        "query", query,
                        "fields", List.of("caseNumber^3", "title^2", "description")
                    )
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(queryMap, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode hits = root.path("hits").path("hits");
                List<UUID> matchingIds = new ArrayList<>();
                for (JsonNode hit : hits) {
                    String idStr = hit.path("_id").asText();
                    try {
                        matchingIds.add(UUID.fromString(idStr));
                    } catch (Exception ignored) {}
                }
                return matchingIds;
            }
        } catch (Exception e) {
            log.warn("Elasticsearch search query failed, falling back to database: {}", e.getMessage());
        }

        return Collections.emptyList();
    }
}

package com.sih.casemanagement;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
@EnableScheduling
public class CaseManagementApplication {

    private static final Logger log = LoggerFactory.getLogger(CaseManagementApplication.class);

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(CaseManagementApplication.class, args);
    }

    private static void loadDotEnv() {
        Path[] searchPaths = {
            Paths.get(".env"),
            Paths.get("../.env"),
            Paths.get("../../.env")
        };

        for (Path envPath : searchPaths) {
            if (Files.exists(envPath)) {
                try {
                    List<String> lines = Files.readAllLines(envPath);
                    int loadedCount = 0;
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();

                        if ((value.startsWith("\"") && value.endsWith("\"")) ||
                            (value.startsWith("'") && value.endsWith("'"))) {
                            value = value.substring(1, value.length() - 1);
                        }

                        // Set into System properties if not already set by OS environment
                        if (System.getProperty(key) == null && System.getenv(key) == null) {
                            System.setProperty(key, value);
                            loadedCount++;
                        }
                    }
                    log.info("Loaded {} environment variables from {}", loadedCount, envPath.toAbsolutePath());
                    break;
                } catch (Exception e) {
                    log.warn("Could not load .env file from {}: {}", envPath, e.getMessage());
                }
            }
        }
    }
}

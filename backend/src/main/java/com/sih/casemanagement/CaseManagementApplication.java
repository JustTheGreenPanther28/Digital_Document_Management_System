package com.sih.casemanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CaseManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(CaseManagementApplication.class, args);
    }
}

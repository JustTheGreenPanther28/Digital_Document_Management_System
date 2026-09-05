package com.sih.casemanagement.common.enums;

public enum DocumentClassification {
    PUBLIC(0),
    CONFIDENTIAL(1),
    SECRET(2),
    TOP_SECRET(3);

    private final int level;

    DocumentClassification(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}

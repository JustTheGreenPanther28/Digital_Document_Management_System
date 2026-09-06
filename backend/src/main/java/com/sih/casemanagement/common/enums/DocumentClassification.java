package com.sih.casemanagement.common.enums;

public enum DocumentClassification {
    PUBLIC(0),
    RESTRICTED(1),
    CONFIDENTIAL(2),
    SECRET(3),
    TOP_SECRET(4);

    private final int level;

    DocumentClassification(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}

package com.sih.casemanagement.common.enums;

public enum SecurityClearance {
    PUBLIC(0),
    CONFIDENTIAL(1),
    SECRET(2),
    TOP_SECRET(3);

    private final int level;

    SecurityClearance(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }

    public boolean canAccess(DocumentClassification classification) {
        if (classification == null) return true;
        return this.level >= classification.getLevel();
    }
}

package com.sih.casemanagement.common.enums;

public enum SecurityClearance {
    PUBLIC(0),
    RESTRICTED(1),
    CONFIDENTIAL(2),
    SECRET(3),
    TOP_SECRET(4);

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

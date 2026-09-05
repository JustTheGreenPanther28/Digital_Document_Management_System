package com.sih.casemanagement.common.exception;

public class WorkflowViolationException extends RuntimeException {
    public WorkflowViolationException(String message) {
        super(message);
    }
}

package com.vobworkbench.core.exception;

public class ConflictException extends VobWorkbenchClientException {

    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }

    public ConflictException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ConflictException(ErrorCode errorCode, String specificMessage) {
        super(errorCode, specificMessage);
    }
}

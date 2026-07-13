package com.vobworkbench.core.exception;

public class ResourceNotFoundException extends VobWorkbenchClientException {

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }

    public ResourceNotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ResourceNotFoundException(ErrorCode errorCode, String specificMessage) {
        super(errorCode, specificMessage);
    }
}

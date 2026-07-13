package com.vobworkbench.core.exception;

public class VobWorkbenchClientException extends VobWorkbenchException {

    public VobWorkbenchClientException(ErrorCode errorCode) {
        super(errorCode);
    }

    public VobWorkbenchClientException(ErrorCode errorCode, String specificMessage) {
        super(errorCode, specificMessage);
    }

    public VobWorkbenchClientException(ErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }

    public VobWorkbenchClientException(ErrorCode errorCode, String specificMessage, Throwable cause) {
        super(errorCode, specificMessage, cause);
    }
}

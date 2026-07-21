package com.vobworkbench.core.exception;

public class ServiceUnavailableException extends VobWorkbenchServerException {

    public ServiceUnavailableException(String message) {
        super(ErrorCode.ELIGIBILITY_SERVICE_UNAVAILABLE, message);
    }

    public ServiceUnavailableException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ServiceUnavailableException(ErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }
}

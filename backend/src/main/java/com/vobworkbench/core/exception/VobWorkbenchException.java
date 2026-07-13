package com.vobworkbench.core.exception;

public abstract class VobWorkbenchException extends RuntimeException {

    private final ErrorCode errorCode;

    protected VobWorkbenchException(ErrorCode errorCode) {
        super(errorCode.message());
        this.errorCode = errorCode;
    }

    protected VobWorkbenchException(ErrorCode errorCode, String specificMessage) {
        super(specificMessage);
        this.errorCode = errorCode;
    }

    protected VobWorkbenchException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.message(), cause);
        this.errorCode = errorCode;
    }

    protected VobWorkbenchException(ErrorCode errorCode, String specificMessage, Throwable cause) {
        super(specificMessage, cause);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public String getErrorCodeValue() {
        return errorCode.code();
    }

    public String getErrorKey() {
        return errorCode.key();
    }

    public String getDescription() {
        return errorCode.description();
    }
}

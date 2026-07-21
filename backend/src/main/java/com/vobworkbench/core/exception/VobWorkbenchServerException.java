package com.vobworkbench.core.exception;

public class VobWorkbenchServerException extends VobWorkbenchException {

    public VobWorkbenchServerException(ErrorCode errorCode) {
        super(errorCode);
    }

    public VobWorkbenchServerException(ErrorCode errorCode, String specificMessage) {
        super(errorCode, specificMessage);
    }

    public VobWorkbenchServerException(ErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }

    public VobWorkbenchServerException(ErrorCode errorCode, String specificMessage, Throwable cause) {
        super(errorCode, specificMessage, cause);
    }
}

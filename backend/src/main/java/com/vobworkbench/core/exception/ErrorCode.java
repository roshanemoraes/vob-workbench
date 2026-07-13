package com.vobworkbench.core.exception;

public enum ErrorCode {
    INVALID_CREDENTIALS(
            "10001",
            "Invalid username or password",
            "The provided authentication credentials are invalid."
    ),
    ACCESS_DENIED(
            "11001",
            "Access denied",
            "The authenticated user does not have permission to perform this action."
    ),
    VALIDATION_FAILED(
            "20001",
            "Request validation failed",
            "One or more request fields failed validation."
    ),
    MALFORMED_JSON(
            "20002",
            "Request body is missing or malformed JSON",
            "The request body could not be parsed as valid JSON."
    ),
    CONSTRAINT_VIOLATION(
            "20003",
            "Request parameter validation failed",
            "One or more request parameters failed validation."
    ),
    MISSING_HEADER(
            "20004",
            "Required request header is missing",
            "A required HTTP header was not provided."
    ),
    BAD_REQUEST(
            "20005",
            "Bad request",
            "The request could not be processed because it is invalid."
    ),
    IF_MATCH_REQUIRED(
            "20006",
            "If-Match header is required",
            "The request must include the current resource version in the If-Match header."
    ),
    INVALID_IF_MATCH_HEADER(
            "20007",
            "If-Match header must contain the current VOB version",
            "The If-Match header must be a numeric version value."
    ),
    INVALID_PATIENT_CURSOR(
            "20008",
            "Invalid patient cursor",
            "The patient pagination cursor is malformed or expired."
    ),
    INVALID_VOB_QUEUE_CURSOR(
            "20009",
            "Invalid VOB queue cursor",
            "The VOB queue pagination cursor is malformed or expired."
    ),
    INVALID_MANUAL_VERIFICATION_RESULT(
            "20010",
            "Manual verification result must be VERIFIED or FAILED_TO_VERIFY",
            "Manual verification can only complete as verified or failed to verify."
    ),
    CONFLICT(
            "20011",
            "Request conflict",
            "The request conflicts with the current resource state."
    ),
    RESOURCE_NOT_FOUND(
            "30001",
            "Resource not found",
            "The requested resource does not exist."
    ),
    PATIENT_NOT_FOUND(
            "31001",
            "Patient not found",
            "The requested patient does not exist."
    ),
    PATIENT_MRN_ALREADY_EXISTS(
            "31002",
            "Patient MRN already exists",
            "Another patient already uses the supplied medical record number."
    ),
    VOB_NOT_FOUND(
            "32001",
            "VOB not found",
            "The requested verification of benefits record does not exist."
    ),
    INVALID_VOB_STATUS_TRANSITION(
            "32002",
            "Invalid VOB status transition",
            "The requested VOB action is not valid for the current VOB status."
    ),
    VOB_NOT_CLAIMABLE(
            "32003",
            "VOB is not in QUEUED status and cannot be claimed",
            "Only queued VOB records can be claimed for processing."
    ),
    VOB_VERSION_CONFLICT(
            "32004",
            "This VOB was updated by another user. Refresh and try again.",
            "The submitted version does not match the current VOB version."
    ),
    DUPLICATE_RESOURCE(
            "40001",
            "Duplicate resource",
            "A resource with the same unique value already exists."
    ),
    OPTIMISTIC_LOCK_CONFLICT(
            "40002",
            "This resource was updated by another user. Refresh and try again.",
            "The resource version changed before this operation completed."
    ),
    ELIGIBILITY_SERVICE_UNAVAILABLE(
            "50001",
            "Eligibility verification API is unavailable",
            "The eligibility verification dependency is currently unavailable."
    ),
    INTERNAL_SERVER_ERROR(
            "90001",
            "Unexpected server error",
            "An unexpected backend error occurred."
    );

    private final String code;
    private final String message;
    private final String description;

    ErrorCode(String code, String message, String description) {
        this.code = code;
        this.message = message;
        this.description = description;
    }

    public String code() {
        return code;
    }

    public String key() {
        return name();
    }

    public String message() {
        return message;
    }

    public String description() {
        return description;
    }
}

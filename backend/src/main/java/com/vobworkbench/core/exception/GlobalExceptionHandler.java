package com.vobworkbench.core.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditOutcome;
import com.vobworkbench.feature.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final AuditService auditService;

    public GlobalExceptionHandler(AuditService auditService) {
        this.auditService = auditService;
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException exception, HttpServletRequest request) {
        log.warn("Authentication failed for request path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.UNAUTHORIZED, "Invalid username or password", request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));

        log.warn("Request validation failed for path={}: {}", request.getRequestURI(), message);
        return build(HttpStatus.BAD_REQUEST, message, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadableMessage(HttpMessageNotReadableException exception, HttpServletRequest request) {
        log.warn("Request body could not be read for path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.BAD_REQUEST, "Request body is missing or malformed JSON", request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException exception, HttpServletRequest request) {
        log.warn("Request parameter validation failed for path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    ResponseEntity<ApiError> handleMissingRequestHeader(MissingRequestHeaderException exception, HttpServletRequest request) {
        log.warn("Missing request header for path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.BAD_REQUEST, exception.getHeaderName() + " header is required", request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException exception, HttpServletRequest request) {
        log.warn("Bad request for path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.BAD_REQUEST, exception.getMessage(), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> handleResourceNotFound(ResourceNotFoundException exception, HttpServletRequest request) {
        log.warn("Resource not found for path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.NOT_FOUND, exception.getMessage(), request);
    }

    @ExceptionHandler({ConflictException.class, DuplicateKeyException.class, OptimisticLockingFailureException.class})
    ResponseEntity<ApiError> handleConflict(Exception exception, HttpServletRequest request) {
        log.warn("Conflict for path={}: {}", request.getRequestURI(), exception.getMessage());
        String message = exception instanceof OptimisticLockingFailureException
                ? "This resource was updated by another user. Refresh and try again."
                : exception.getMessage();
        return build(HttpStatus.CONFLICT, message, request);
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    ResponseEntity<ApiError> handleServiceUnavailable(ServiceUnavailableException exception, HttpServletRequest request) {
        log.warn("Service unavailable for path={}: {}", request.getRequestURI(), exception.getMessage());
        return build(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage(), request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        log.warn("Access denied for path={}: {}", request.getRequestURI(), exception.getMessage());
        auditService.recordFromAuthentication(
                SecurityContextHolder.getContext().getAuthentication(),
                AuditAction.ACCESS_DENIED,
                AuditEntityType.SECURITY,
                null,
                AuditOutcome.FAILURE,
                exception.getMessage(),
                Map.of("path", request.getRequestURI(), "method", request.getMethod())
        );
        return build(HttpStatus.FORBIDDEN, exception.getMessage(), request);
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unexpected error for path={}", request.getRequestURI(), exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected server error", request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status)
                .body(new ApiError(
                        Instant.now(),
                        status.value(),
                        status.getReasonPhrase(),
                        message,
                        request.getRequestURI()
                ));
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + " " + error.getDefaultMessage();
    }
}

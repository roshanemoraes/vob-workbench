package com.vobworkbench.core.exception;

import java.time.Instant;

public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String code,
        String key,
        String message,
        String description,
        String path
) {
}

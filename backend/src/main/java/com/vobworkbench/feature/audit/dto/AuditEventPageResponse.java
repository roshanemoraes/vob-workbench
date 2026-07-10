package com.vobworkbench.feature.audit.dto;

import java.util.List;

public record AuditEventPageResponse(
        List<AuditEventResponse> items,
        long totalCount
) {
}

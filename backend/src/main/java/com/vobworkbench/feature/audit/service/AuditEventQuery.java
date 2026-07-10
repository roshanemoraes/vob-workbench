package com.vobworkbench.feature.audit.service;

import java.time.Instant;

import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditOutcome;

public record AuditEventQuery(
        AuditAction action,
        AuditEntityType entityType,
        String entityId,
        String actorUserId,
        AuditOutcome outcome,
        Instant createdAfter,
        int limit
) {
}

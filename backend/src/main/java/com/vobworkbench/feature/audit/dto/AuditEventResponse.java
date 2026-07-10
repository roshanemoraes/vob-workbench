package com.vobworkbench.feature.audit.dto;

import java.time.Instant;
import java.util.Map;

import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditEvent;
import com.vobworkbench.feature.audit.entity.AuditOutcome;
import com.vobworkbench.feature.user.entity.AppRole;

public record AuditEventResponse(

        String id,
        String actorUserId,
        AppRole actorRole,
        AuditAction action,
        AuditEntityType entityType,
        String entityId,
        AuditOutcome outcome,
        String reason,
        Map<String, Object> metadata,
        Instant createdAt) {

    public static AuditEventResponse from(AuditEvent event) {

        return new AuditEventResponse(
            event.getId(),
            event.getActorUserId(),
            event.getActorRole(),
            event.getAction(),
            event.getEntityType(),
            event.getEntityId(),
            event.getOutcome(),
            event.getReason(),
            event.getMetadata(),
            event.getCreatedAt()
        );
    }
}

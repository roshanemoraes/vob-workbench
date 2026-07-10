package com.vobworkbench.feature.audit.controller;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import com.vobworkbench.core.security.SecurityExpressions;
import com.vobworkbench.feature.audit.dto.AuditEventPageResponse;
import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditOutcome;
import com.vobworkbench.feature.audit.service.AuditEventQuery;
import com.vobworkbench.feature.audit.service.AuditService;
import com.vobworkbench.feature.user.service.UserPrincipal;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/audit-events")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {

        this.auditService = auditService;
    }

    @GetMapping
    @PreAuthorize(SecurityExpressions.AUDIT_VIEW)
    ResponseEntity<AuditEventPageResponse> getAuditEvents(

            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) AuditEntityType entityType,
            @RequestParam(required = false) String entityId,
            @RequestParam(required = false) String actorUserId,
            @RequestParam(required = false) AuditOutcome outcome,
            @RequestParam(required = false) Instant createdAfter,
            @RequestParam(defaultValue = "50") @Min(1) @Max(200) int limit,
            @AuthenticationPrincipal UserPrincipal principal) {

        AuditEventPageResponse events = auditService.findEvents(
                new AuditEventQuery(action, entityType, entityId, actorUserId, outcome, createdAfter, limit));

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("hasActionFilter", action != null);
        metadata.put("hasEntityTypeFilter", entityType != null);
        metadata.put("hasEntityIdFilter", entityId != null);
        metadata.put("hasActorUserIdFilter", actorUserId != null);
        metadata.put("hasOutcomeFilter", outcome != null);
        metadata.put("hasCreatedAfterFilter", createdAfter != null);
        metadata.put("limit", limit);

        auditService.recordSuccess(
                principal,
                AuditAction.AUDIT_HISTORY_VIEWED,
                AuditEntityType.AUDIT_RECORD,
                null,
                metadata
        );

        return ResponseEntity.ok(events);
    }
}

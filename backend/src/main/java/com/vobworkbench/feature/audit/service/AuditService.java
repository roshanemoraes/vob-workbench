package com.vobworkbench.feature.audit.service;

import java.util.List;
import java.util.Map;

import com.vobworkbench.feature.audit.dto.AuditEventPageResponse;
import com.vobworkbench.feature.audit.dto.AuditEventResponse;
import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditEvent;
import com.vobworkbench.feature.audit.entity.AuditOutcome;
import com.vobworkbench.feature.audit.repository.AuditEventRepository;
import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.service.UserPrincipal;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuditService {

    private final AuditEventRepository auditEventRepository;
    private final MongoTemplate mongoTemplate;

    public AuditService(AuditEventRepository auditEventRepository, MongoTemplate mongoTemplate) {

        this.auditEventRepository = auditEventRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public void recordSuccess(UserPrincipal principal, AuditAction action, AuditEntityType entityType, String entityId,
            Map<String, Object> metadata) {

        record(principal, action, entityType, entityId, AuditOutcome.SUCCESS, null, metadata);
    }

    public void recordFailure(UserPrincipal principal, AuditAction action, AuditEntityType entityType, String entityId,
            String reason, Map<String, Object> metadata) {

        record(principal, action, entityType, entityId, AuditOutcome.FAILURE, reason, metadata);
    }

    public void recordSystemFailure(AuditAction action, AuditEntityType entityType, String entityId, String reason,
            Map<String, Object> metadata) {

        record(null, null, action, entityType, entityId, AuditOutcome.FAILURE, reason, metadata);
    }

    public void recordActor(String actorUserId, AppRole actorRole, AuditAction action, AuditEntityType entityType,
            String entityId, AuditOutcome outcome, String reason, Map<String, Object> metadata) {

        record(actorUserId, actorRole, action, entityType, entityId, outcome, reason, metadata);
    }

    public void recordFromAuthentication(Authentication authentication, AuditAction action, AuditEntityType entityType,
            String entityId, AuditOutcome outcome, String reason, Map<String, Object> metadata) {

        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {

            record(principal, action, entityType, entityId, outcome, reason, metadata);
            return;
        }

        record(null, null, action, entityType, entityId, outcome, reason, metadata);
    }

    public AuditEventPageResponse findEvents(AuditEventQuery eventQuery) {

        Query query = buildFilterQuery(eventQuery);
        long totalCount = mongoTemplate.count(query, AuditEvent.class);

        List<AuditEventResponse> items = mongoTemplate.find(
                        query.with(Sort.by(Sort.Order.desc("createdAt"))).limit(eventQuery.limit()),
                        AuditEvent.class)
                .stream()
                .map(AuditEventResponse::from)
                .toList();

        return new AuditEventPageResponse(items, totalCount);
    }

    private Query buildFilterQuery(AuditEventQuery eventQuery) {

        Query query = new Query();

        if (eventQuery.action() != null) {
            query.addCriteria(Criteria.where("action").is(eventQuery.action()));
        }
        if (eventQuery.entityType() != null) {
            query.addCriteria(Criteria.where("entityType").is(eventQuery.entityType()));
        }
        if (StringUtils.hasText(eventQuery.entityId())) {
            query.addCriteria(Criteria.where("entityId").is(eventQuery.entityId()));
        }
        if (StringUtils.hasText(eventQuery.actorUserId())) {
            query.addCriteria(Criteria.where("actorUserId").is(eventQuery.actorUserId()));
        }
        if (eventQuery.outcome() != null) {
            query.addCriteria(Criteria.where("outcome").is(eventQuery.outcome()));
        }
        if (eventQuery.createdAfter() != null) {
            query.addCriteria(Criteria.where("createdAt").gte(eventQuery.createdAfter()));
        }

        return query;
    }

    private void record(UserPrincipal principal, AuditAction action, AuditEntityType entityType, String entityId,
            AuditOutcome outcome, String reason, Map<String, Object> metadata) {

        String actorUserId = principal == null ? null : principal.getId();
        AppRole actorRole = principal == null ? null : principal.getRole();
        record(actorUserId, actorRole, action, entityType, entityId, outcome, reason, metadata);
    }

    private void record(String actorUserId, AppRole actorRole, AuditAction action, AuditEntityType entityType,
            String entityId, AuditOutcome outcome, String reason, Map<String, Object> metadata) {

        AuditEvent event = new AuditEvent();
        event.setActorUserId(actorUserId);
        event.setActorRole(actorRole);
        event.setAction(action);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setOutcome(outcome);
        event.setReason(reason);
        event.setMetadata(metadata);
        auditEventRepository.save(event);
    }
}

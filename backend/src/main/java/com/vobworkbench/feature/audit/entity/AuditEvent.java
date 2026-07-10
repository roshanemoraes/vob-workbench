package com.vobworkbench.feature.audit.entity;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import com.vobworkbench.feature.user.entity.AppRole;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "audit_events")
@CompoundIndex(name = "audit_entity_timestamp_idx", def = "{'entityType': 1, 'entityId': 1, 'createdAt': -1}")
public class AuditEvent {

    @Id
    private String id;

    @Indexed(unique = true, sparse = true)
    private String publicId = UUID.randomUUID().toString();

    @Indexed
    private String actorUserId;

    private AppRole actorRole;

    @Indexed
    private AuditAction action;

    @Indexed
    private AuditEntityType entityType;

    @Indexed
    private String entityId;

    private AuditOutcome outcome;

    private String reason;

    private Map<String, Object> metadata = new LinkedHashMap<>();

    @CreatedDate
    @Indexed
    private Instant createdAt;

    public String getId() {

        return id;
    }

    public String getPublicId() {

        return publicId == null ? id : publicId;
    }

    public void setPublicId(String publicId) {

        this.publicId = publicId;
    }

    public String getActorUserId() {

        return actorUserId;
    }

    public void setActorUserId(String actorUserId) {

        this.actorUserId = actorUserId;
    }

    public AppRole getActorRole() {

        return actorRole;
    }

    public void setActorRole(AppRole actorRole) {

        this.actorRole = actorRole;
    }

    public AuditAction getAction() {

        return action;
    }

    public void setAction(AuditAction action) {

        this.action = action;
    }

    public AuditEntityType getEntityType() {

        return entityType;
    }

    public void setEntityType(AuditEntityType entityType) {

        this.entityType = entityType;
    }

    public String getEntityId() {

        return entityId;
    }

    public void setEntityId(String entityId) {

        this.entityId = entityId;
    }

    public AuditOutcome getOutcome() {

        return outcome;
    }

    public void setOutcome(AuditOutcome outcome) {

        this.outcome = outcome;
    }

    public String getReason() {

        return reason;
    }

    public void setReason(String reason) {

        this.reason = reason;
    }

    public Map<String, Object> getMetadata() {

        return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {

        this.metadata = metadata == null ? new LinkedHashMap<>() : new LinkedHashMap<>(metadata);
    }

    public Instant getCreatedAt() {

        return createdAt;
    }
}

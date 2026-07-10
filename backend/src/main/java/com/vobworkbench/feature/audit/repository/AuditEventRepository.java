package com.vobworkbench.feature.audit.repository;

import com.vobworkbench.feature.audit.entity.AuditEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {
}

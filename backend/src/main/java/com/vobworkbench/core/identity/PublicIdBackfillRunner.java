package com.vobworkbench.core.identity;

import java.util.Map;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditEvent;
import com.vobworkbench.feature.audit.repository.AuditEventRepository;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;
import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.repository.UserRepository;
import com.vobworkbench.feature.vob.entity.Vob;
import com.vobworkbench.feature.vob.repository.VobRepository;

@Component
@Order(0)
public class PublicIdBackfillRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final VobRepository vobRepository;
    private final AuditEventRepository auditEventRepository;
    private final MongoTemplate mongoTemplate;

    public PublicIdBackfillRunner(
            UserRepository userRepository,
            PatientRepository patientRepository,
            VobRepository vobRepository,
            AuditEventRepository auditEventRepository,
            MongoTemplate mongoTemplate
    ) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.vobRepository = vobRepository;
        this.auditEventRepository = auditEventRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) {

        Set<String> usersMissingPublicId = documentIdsMissingPublicId(AppUser.class);
        Set<String> patientsMissingPublicId = documentIdsMissingPublicId(Patient.class);
        Set<String> vobsMissingPublicId = documentIdsMissingPublicId(Vob.class);
        Set<String> auditEventsMissingPublicId = documentIdsMissingPublicId(AuditEvent.class);

        List<AppUser> users = userRepository.findAll();
        userRepository.saveAll(users.stream()
                .filter(user -> usersMissingPublicId.contains(user.getId()))
                .toList());
        List<Patient> patients = patientRepository.findAll();
        Map<String, String> userIds = users.stream()
                .filter(user -> user.getId() != null)
                .collect(Collectors.toMap(AppUser::getId, AppUser::getPublicId));
        Map<String, String> patientIds = patients.stream()
                .filter(patient -> patient.getId() != null)
                .collect(Collectors.toMap(Patient::getId, Patient::getPublicId));

        List<Patient> changedPatients = new java.util.ArrayList<>();
        for (Patient patient : patients) {
            boolean changed = patientsMissingPublicId.contains(patient.getId());
            changed |= replacePatientCreatedByUserId(patient, userIds);
            if (changed) {
                changedPatients.add(patient);
            }
        }
        patientRepository.saveAll(changedPatients);

        List<Vob> vobs = vobRepository.findAll();
        List<Vob> changedVobs = new java.util.ArrayList<>();
        for (Vob vob : vobs) {
            boolean changed = vobsMissingPublicId.contains(vob.getId());
            changed |= replacePatientId(vob, patientIds);
            changed |= replaceAssignedToUserId(vob, userIds);
            changed |= replaceCreatedByUserId(vob, userIds);
            if (vob.getEligibilityResult() != null) {
                changed |= replaceVerifiedByUserId(vob, userIds);
            }
            if (changed) {
                changedVobs.add(vob);
            }
        }
        vobRepository.saveAll(changedVobs);

        Map<String, String> vobIds = vobs.stream()
                .filter(vob -> vob.getId() != null)
                .collect(Collectors.toMap(Vob::getId, Vob::getPublicId));

        List<AuditEvent> auditEvents = auditEventRepository.findAll();
        List<AuditEvent> changedAuditEvents = new java.util.ArrayList<>();
        for (AuditEvent auditEvent : auditEvents) {
            boolean changed = auditEventsMissingPublicId.contains(auditEvent.getId());
            changed |= replaceAuditActorUserId(auditEvent, userIds);
            changed |= replaceAuditEntityId(auditEvent, userIds, patientIds, vobIds);
            changed |= rewriteMetadataId(auditEvent, "createdByUserId", userIds);
            changed |= rewriteMetadataId(auditEvent, "assignedToUserId", userIds);
            changed |= rewriteMetadataId(auditEvent, "patientId", patientIds);
            changed |= rewriteMetadataId(auditEvent, "vobRequestId", vobIds);
            if (changed) {
                changedAuditEvents.add(auditEvent);
            }
        }
        auditEventRepository.saveAll(changedAuditEvents);
    }

    private Set<String> documentIdsMissingPublicId(Class<?> entityClass) {

        Query query = new Query(new Criteria().orOperator(
                Criteria.where("publicId").exists(false),
                Criteria.where("publicId").is(null)
        ));
        query.fields().include("_id");
        return mongoTemplate.find(query, entityClass).stream()
                .map(this::documentId)
                .collect(Collectors.toSet());
    }

    private String publicEntityId(
            AuditEntityType entityType,
            String entityId,
            Map<String, String> userIds,
            Map<String, String> patientIds,
            Map<String, String> vobIds
    ) {
        if (entityType == null) {
            return entityId;
        }

        return switch (entityType) {
            case AUTH, SECURITY -> publicIdFor(userIds, entityId);
            case PATIENT -> publicIdFor(patientIds, entityId);
            case VOB_REQUEST, ELIGIBILITY_RESULT -> publicIdFor(vobIds, entityId);
            case AUDIT_RECORD -> entityId;
        };
    }

    private boolean rewriteMetadataId(AuditEvent auditEvent, String key, Map<String, String> publicIdsByDocumentId) {

        Object value = auditEvent.getMetadata().get(key);
        if (value instanceof String id) {
            String publicId = publicIdFor(publicIdsByDocumentId, id);
            if (!publicId.equals(id)) {
                auditEvent.getMetadata().put(key, publicId);
                return true;
            }
        }
        return false;
    }

    private String publicIdFor(Map<String, String> publicIdsByDocumentId, String id) {

        if (id == null) {
            return null;
        }

        return publicIdsByDocumentId.getOrDefault(id, id);
    }

    private boolean replacePatientId(Vob vob, Map<String, String> publicIdsByDocumentId) {

        String publicId = publicIdFor(publicIdsByDocumentId, vob.getPatientId());
        if (!Objects.equals(publicId, vob.getPatientId())) {
            vob.setPatientId(publicId);
            return true;
        }
        return false;
    }

    private boolean replacePatientCreatedByUserId(Patient patient, Map<String, String> publicIdsByDocumentId) {

        String publicId = publicIdFor(publicIdsByDocumentId, patient.getCreatedByUserId());
        if (patient.getCreatedByUserId() != null && !publicId.equals(patient.getCreatedByUserId())) {
            patient.setCreatedByUserId(publicId);
            return true;
        }
        return false;
    }

    private boolean replaceAssignedToUserId(Vob vob, Map<String, String> publicIdsByDocumentId) {

        String publicId = publicIdFor(publicIdsByDocumentId, vob.getAssignedToUserId());
        if (vob.getAssignedToUserId() != null && !publicId.equals(vob.getAssignedToUserId())) {
            vob.setAssignedToUserId(publicId);
            return true;
        }
        return false;
    }

    private boolean replaceCreatedByUserId(Vob vob, Map<String, String> publicIdsByDocumentId) {

        String publicId = publicIdFor(publicIdsByDocumentId, vob.getCreatedByUserId());
        if (vob.getCreatedByUserId() != null && !publicId.equals(vob.getCreatedByUserId())) {
            vob.setCreatedByUserId(publicId);
            return true;
        }
        return false;
    }

    private boolean replaceVerifiedByUserId(Vob vob, Map<String, String> publicIdsByDocumentId) {

        String currentId = vob.getEligibilityResult().getVerifiedByUserId();
        String publicId = publicIdFor(publicIdsByDocumentId, currentId);
        if (currentId != null && !publicId.equals(currentId)) {
            vob.getEligibilityResult().setVerifiedByUserId(publicId);
            return true;
        }
        return false;
    }

    private boolean replaceAuditActorUserId(AuditEvent auditEvent, Map<String, String> publicIdsByDocumentId) {

        String publicId = publicIdFor(publicIdsByDocumentId, auditEvent.getActorUserId());
        if (auditEvent.getActorUserId() != null && !publicId.equals(auditEvent.getActorUserId())) {
            auditEvent.setActorUserId(publicId);
            return true;
        }
        return false;
    }

    private boolean replaceAuditEntityId(
            AuditEvent auditEvent,
            Map<String, String> userIds,
            Map<String, String> patientIds,
            Map<String, String> vobIds
    ) {
        String publicId = publicEntityId(auditEvent.getEntityType(), auditEvent.getEntityId(), userIds, patientIds, vobIds);
        if (auditEvent.getEntityId() != null && !publicId.equals(auditEvent.getEntityId())) {
            auditEvent.setEntityId(publicId);
            return true;
        }
        return false;
    }

    private String documentId(Object entity) {

        if (entity instanceof AppUser user) {
            return user.getId();
        }
        if (entity instanceof Patient patient) {
            return patient.getId();
        }
        if (entity instanceof Vob vob) {
            return vob.getId();
        }
        if (entity instanceof AuditEvent auditEvent) {
            return auditEvent.getId();
        }
        throw new IllegalArgumentException("Unsupported entity type for public ID backfill");
    }
}

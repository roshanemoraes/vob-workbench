package com.vobworkbench.feature.vob.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.vobworkbench.core.exception.ConflictException;
import com.vobworkbench.core.exception.ResourceNotFoundException;
import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.service.AuditService;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;
import com.vobworkbench.feature.user.entity.Permission;
import com.vobworkbench.feature.user.service.UserPrincipal;
import com.vobworkbench.feature.vob.dto.ApiEligibilityVerificationResult;
import com.vobworkbench.feature.vob.dto.InsurancePolicyRequestDTO;
import com.vobworkbench.feature.vob.dto.ManualVerificationRequestDTO;
import com.vobworkbench.feature.vob.dto.VobQueueResponseDTO;
import com.vobworkbench.feature.vob.dto.VobRequestDTO;
import com.vobworkbench.feature.vob.dto.VobResponseDTO;
import com.vobworkbench.feature.vob.entity.EligibilityResult;
import com.vobworkbench.feature.vob.entity.InsurancePolicy;
import com.vobworkbench.feature.vob.entity.VerificationMethod;
import com.vobworkbench.feature.vob.entity.Vob;
import com.vobworkbench.feature.vob.entity.VobAction;
import com.vobworkbench.feature.vob.entity.VobStatus;
import com.vobworkbench.feature.vob.repository.VobRepository;

@Service
public class VobService {

    private final MongoTemplate mongoTemplate;
    private final PatientRepository patientRepository;
    private final VobQueueCursorCodec vobQueueCursorCodec;
    private final VobRepository vobRepository;
    private final MockEligibilityVerificationService mockEligibilityVerificationService;
    private final VobStateMachine vobStateMachine;
    private final AuditService auditService;

    public VobService(
            MongoTemplate mongoTemplate,
            PatientRepository patientRepository,
            VobQueueCursorCodec vobQueueCursorCodec,
            VobRepository vobRepository,
            MockEligibilityVerificationService mockEligibilityVerificationService,
            VobStateMachine vobStateMachine,
            AuditService auditService) {

        this.mongoTemplate = mongoTemplate;
        this.patientRepository = patientRepository;
        this.vobQueueCursorCodec = vobQueueCursorCodec;
        this.vobRepository = vobRepository;
        this.mockEligibilityVerificationService = mockEligibilityVerificationService;
        this.vobStateMachine = vobStateMachine;
        this.auditService = auditService;
    }

    public VobResponseDTO createVob(VobRequestDTO request, UserPrincipal principal) {

        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Vob vob = Vob.builder()
                .patientId(patient.getId())
                .insurancePolicy(buildInsurancePolicy(request.insurance()))
                .dateOfService(request.dateOfService())
                .priority(request.priority())
                .status(VobStatus.QUEUED)
                .createdByUserId(principal.getId())
                .build();

        Vob saved = vobRepository.save(vob);
        auditService.recordSuccess(
                principal,
                AuditAction.VOB_REQUEST_CREATED,
                AuditEntityType.VOB_REQUEST,
                saved.getId(),
                Map.of(
                        "patientId", patient.getId(),
                        "createdByUserId", principal.getId(),
                        "status", saved.getStatus().name(),
                        "priority", saved.getPriority().name()
                )
        );
        return VobResponseDTO.from(saved);
    }

    public VobResponseDTO getVobById(String id, UserPrincipal principal) {

        Vob vob = vobRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("VOB not found"));

        if (isAuthorizedToViewVob(vob, principal)) {
            auditService.recordSuccess(principal, AuditAction.VOB_REQUEST_VIEWED, AuditEntityType.VOB_REQUEST, id, Map.of());
            return VobResponseDTO.from(vob);
        }

        auditService.recordFailure(
                principal,
                AuditAction.ACCESS_DENIED,
                AuditEntityType.VOB_REQUEST,
                id,
                "User is not authorized to view this VOB",
                Map.of("status", vob.getStatus().name())
        );
        throw new AccessDeniedException("Access denied");
    }

    public VobQueueResponseDTO getVobListByStatus(VobStatus status, String cursor, int limit,
        String sortOrder, String patientId, String search, UserPrincipal principal) {

        Sort.Direction sortDirection = resolveSortDirection(sortOrder);

        List<Criteria> filterCriteria = buildCriteriaForVobStatus(status, patientId, search, principal);
        Query query = new Query();
        Query countQuery = new Query();
        applyCriteria(query, filterCriteria);
        applyCriteria(countQuery, filterCriteria);

        query.with(Sort.by(
                new Sort.Order(sortDirection, "createdAt"),
                new Sort.Order(sortDirection, "_id")))
                .limit(limit + 1);

        if (StringUtils.hasText(cursor)) {
            VobQueueCursor decodedCursor = vobQueueCursorCodec.decode(cursor);
            List<Criteria> pageCriteria = new ArrayList<>(filterCriteria);
            pageCriteria.add(buildCursorCriteria(decodedCursor, sortDirection));
            query = new Query()
                    .with(Sort.by(
                            new Sort.Order(sortDirection, "createdAt"),
                            new Sort.Order(sortDirection, "_id")))
                    .limit(limit + 1);
            applyCriteria(query, pageCriteria);
        }

        List<Vob> vobList = mongoTemplate.find(query, Vob.class);
        long totalCount = mongoTemplate.count(countQuery, Vob.class);
        boolean hasNext = vobList.size() > limit;
        List<Vob> pageItems = hasNext ? vobList.subList(0, limit) : vobList;
        String nextCursor = hasNext ? encodeCursor(pageItems.get(pageItems.size() - 1)) : null;

        VobQueueResponseDTO response = new VobQueueResponseDTO(
            pageItems.stream().map(VobResponseDTO::from).toList(),
            nextCursor,
            hasNext,
            totalCount
        );
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("hasStatusFilter", status != null);
        metadata.put("hasPatientIdFilter", StringUtils.hasText(patientId));
        metadata.put("hasSearch", StringUtils.hasText(search));
        metadata.put("limit", limit);
        metadata.put("sortOrder", sortDirection.name());
        metadata.put("resultCount", pageItems.size());
        metadata.put("totalCount", totalCount);
        metadata.put("hasNext", hasNext);
        auditService.recordSuccess(principal, AuditAction.VOB_WORKLIST_VIEWED, AuditEntityType.VOB_REQUEST, null, metadata);
        return response;
    }

    public VobResponseDTO claimForProcessing(String vobId, UserPrincipal principal) {

        ObjectId objectId = toObjectId(vobId);
        VobStatus nextStatus = vobStateMachine.nextStatus(VobStatus.QUEUED, VobAction.START_PROCESSING);
        Query query = new Query(Criteria
            .where("_id").is(objectId)
            .and("status").is(VobStatus.QUEUED));

        Update update = new Update()
            .set("status", nextStatus)
            .set("assignedToUserId", principal.getId())
            .set("updatedAt", Instant.now())
            .inc("version", 1);

        Vob updated = mongoTemplate.findAndModify(
            query,
            update,
            FindAndModifyOptions.options().returnNew(true),
            Vob.class
        );

        if (updated != null) {
            auditService.recordSuccess(
                    principal,
                    AuditAction.VOB_REQUEST_ASSIGNED,
                    AuditEntityType.VOB_REQUEST,
                    updated.getId(),
                    Map.of(
                            "assignedToUserId", principal.getId(),
                            "fromStatus", VobStatus.QUEUED.name(),
                            "toStatus", updated.getStatus().name()
                    )
            );
            auditService.recordSuccess(
                    principal,
                    AuditAction.VOB_REQUEST_STATUS_CHANGED,
                    AuditEntityType.VOB_REQUEST,
                    updated.getId(),
                    Map.of(
                            "fromStatus", VobStatus.QUEUED.name(),
                            "toStatus", updated.getStatus().name()
                    )
            );
            return VobResponseDTO.from(updated);
        }
        
        ensureVobExists(vobId);
        auditService.recordFailure(
                principal,
                AuditAction.INVALID_STATUS_TRANSITION_ATTEMPTED,
                AuditEntityType.VOB_REQUEST,
                vobId,
                "VOB is not in QUEUED status and cannot be claimed",
                Map.of("attemptedAction", VobAction.START_PROCESSING.name())
        );
        throw new ConflictException("VOB is not in QUEUED status and cannot be claimed");
    }

    public VobResponseDTO verifyVobWithApi(String vobId, String ifMatch, UserPrincipal principal) {

        Vob vob = getExistingVob(vobId);
        ensureAssignedToCurrentUserOrAdmin(vob, principal, AuditAction.VOB_REQUEST_VERIFICATION_ATTEMPTED);
        ensureExpectedVersion(vob, parseExpectedVersion(ifMatch), principal);

        ApiEligibilityVerificationResult apiResult = mockEligibilityVerificationService.verify(vob);
        VobAction action = apiResult.verified() ? VobAction.API_VERIFY_SUCCESS : VobAction.API_VERIFY_FAILED;
        VobStatus previousStatus = vob.getStatus();
        VobStatus nextStatus = nextStatusForVerification(vob, action, principal);

        vob.setStatus(nextStatus);
        vob.setEligibilityResult(buildEligibilityResult(apiResult, principal.getId()));

        Vob saved = vobRepository.save(vob);
        recordVerificationEvents(principal, saved, previousStatus, nextStatus, VerificationMethod.API);
        return VobResponseDTO.from(saved);
    }

    public VobResponseDTO verifyVobManually(String vobId, ManualVerificationRequestDTO request,
                                            UserPrincipal principal) {

        Vob vob = getExistingVob(vobId);
        ensureAssignedToCurrentUserOrAdmin(vob, principal, AuditAction.VOB_REQUEST_VERIFICATION_ATTEMPTED);
        ensureExpectedVersion(vob, request.version(), principal);
        VobAction action = toManualVerificationAction(request.result());
        VobStatus previousStatus = vob.getStatus();
        VobStatus nextStatus = nextStatusForVerification(vob, action, principal);

        vob.setStatus(nextStatus);
        vob.setEligibilityResult(buildEligibilityResult(request, principal.getId()));

        Vob saved = vobRepository.save(vob);
        recordVerificationEvents(principal, saved, previousStatus, nextStatus, VerificationMethod.MANUAL);
        return VobResponseDTO.from(saved);
    }

    // Helper Methods

    private boolean isAuthorizedToViewVob(Vob vob, UserPrincipal principal) {

        if (isAdminUser(principal)) {
            return true;
        }

        if (VobStatus.QUEUED.equals(vob.getStatus())) {
            return isAuthorizedToViewQueuedVobList(principal);
        }

        return principal.getId().equals(vob.getAssignedToUserId())
                || principal.getId().equals(vob.getCreatedByUserId());
    }

    private boolean isAuthorizedToViewQueuedVobList(UserPrincipal principal) {

        return principal.getPermissions().contains(Permission.VOB_QUEUE_VIEW);
    }

    private Vob getExistingVob(String id) {

        return vobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("VOB not found"));
    }

    private void ensureVobExists(String id) {

        if (!ObjectId.isValid(id) || !vobRepository.existsById(id)) {
            throw new ResourceNotFoundException("VOB not found");
        }
    }

    private void ensureAssignedToCurrentUserOrAdmin(Vob vob, UserPrincipal principal, AuditAction action) {

        if (isAdminUser(principal) || principal.getId().equals(vob.getAssignedToUserId())) {
            return;
        }

        auditService.recordFailure(
                principal,
                AuditAction.ACCESS_DENIED,
                AuditEntityType.VOB_REQUEST,
                vob.getId(),
                "Only the assigned specialist or admin can verify this VOB",
                Map.of("attemptedAction", action.name(), "status", vob.getStatus().name())
        );
        throw new AccessDeniedException("Only the assigned specialist or admin can verify this VOB");
    }

    private void ensureExpectedVersion(Vob vob, Long expectedVersion, UserPrincipal principal) {

        Long currentVersion = vob.getVersion();
        if (currentVersion == null || !currentVersion.equals(expectedVersion)) {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("currentVersion", currentVersion);
            metadata.put("expectedVersion", expectedVersion);
            auditService.recordFailure(
                    principal,
                    AuditAction.VOB_REQUEST_VERIFICATION_ATTEMPTED,
                    AuditEntityType.VOB_REQUEST,
                    vob.getId(),
                    "Version conflict",
                    metadata
            );
            throw new ConflictException("This VOB was updated by another user. Refresh and try again.");
        }
    }

    private VobStatus nextStatusForVerification(Vob vob, VobAction action, UserPrincipal principal) {
        try {
            return vobStateMachine.nextStatus(vob.getStatus(), action);
        } catch (ConflictException exception) {
            AuditAction auditAction = VobStatus.VERIFIED.equals(vob.getStatus())
                    ? AuditAction.LOCKED_REQUEST_MODIFICATION_ATTEMPTED
                    : AuditAction.INVALID_STATUS_TRANSITION_ATTEMPTED;
            auditService.recordFailure(
                    principal,
                    auditAction,
                    AuditEntityType.VOB_REQUEST,
                    vob.getId(),
                    exception.getMessage(),
                    Map.of("currentStatus", vob.getStatus().name(), "attemptedAction", action.name())
            );
            throw exception;
        }
    }

    private void recordVerificationEvents(
            UserPrincipal principal,
            Vob vob,
            VobStatus previousStatus,
            VobStatus nextStatus,
            VerificationMethod method
    ) {
        Map<String, Object> metadata = Map.of(
                "fromStatus", previousStatus.name(),
                "toStatus", nextStatus.name(),
                "method", method.name()
        );

        auditService.recordSuccess(
                principal,
                AuditAction.VOB_REQUEST_VERIFICATION_ATTEMPTED,
                AuditEntityType.VOB_REQUEST,
                vob.getId(),
                metadata
        );
        auditService.recordSuccess(
                principal,
                AuditAction.VOB_REQUEST_STATUS_CHANGED,
                AuditEntityType.VOB_REQUEST,
                vob.getId(),
                metadata
        );
        auditService.recordSuccess(
                principal,
                AuditAction.ELIGIBILITY_RESULT_CREATED,
                AuditEntityType.ELIGIBILITY_RESULT,
                vob.getId(),
                Map.of("vobRequestId", vob.getId(), "method", method.name())
        );

        if (VobStatus.VERIFIED.equals(nextStatus)) {
            auditService.recordSuccess(
                    principal,
                    AuditAction.VOB_REQUEST_LOCKED,
                    AuditEntityType.VOB_REQUEST,
                    vob.getId(),
                    Map.of("status", nextStatus.name())
            );
        }
    }

    private Long parseExpectedVersion(String ifMatch) {

        if (!StringUtils.hasText(ifMatch)) {
            throw new IllegalArgumentException("If-Match header is required");
        }

        String normalized = ifMatch.trim();
        if (normalized.startsWith("\"") && normalized.endsWith("\"") && normalized.length() > 1) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }

        try {
            return Long.parseLong(normalized);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("If-Match header must contain the current VOB version");
        }
    }

    private boolean isAdminUser(UserPrincipal principal) {

        return principal.getPermissions().contains(Permission.USER_MANAGE);
    }

    private VobAction toManualVerificationAction(VobStatus result) {

        if (VobStatus.VERIFIED.equals(result)) {
            return VobAction.MANUAL_VERIFY_SUCCESS;
        }

        if (VobStatus.FAILED_TO_VERIFY.equals(result)) {
            return VobAction.MANUAL_VERIFY_FAILED;
        }

        throw new IllegalArgumentException("Manual verification result must be VERIFIED or FAILED_TO_VERIFY");
    }

    private String encodeCursor(Vob vob) {
        
        return vobQueueCursorCodec.encode(vob.getCreatedAt(), vob.getId());
    }

    private List<Criteria> buildCriteriaForVobStatus(
            VobStatus status, String patientId, String search, UserPrincipal principal) {

        List<Criteria> criteria = new ArrayList<>();

        if (status != null) {
            criteria.add(Criteria.where("status").is(status));
        }

        if (StringUtils.hasText(patientId)) {
            criteria.add(Criteria.where("patientId").is(patientId));
        }

        if (StringUtils.hasText(search)) {
            Pattern pattern = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            List<Criteria> searchCriteria = new ArrayList<>(List.of(
                    Criteria.where("patientId").regex(pattern),
                    Criteria.where("insurancePolicy.payerName").regex(pattern),
                    Criteria.where("insurancePolicy.memberId").regex(pattern),
                    Criteria.where("insurancePolicy.groupNumber").regex(pattern),
                    Criteria.where("insurancePolicy.planType").regex(pattern),
                    Criteria.where("assignedToUserId").regex(pattern)
            ));
            if (ObjectId.isValid(search.trim())) {
                searchCriteria.add(Criteria.where("_id").is(new ObjectId(search.trim())));
            }
            criteria.add(new Criteria().orOperator(searchCriteria.toArray(Criteria[]::new)));
        }

        if (!isAdminUser(principal)) {
            criteria.add(new Criteria().orOperator(
                    Criteria.where("status").is(VobStatus.QUEUED),
                    Criteria.where("assignedToUserId").is(principal.getId()),
                    Criteria.where("createdByUserId").is(principal.getId())
            ));
        }

        return criteria;
    }

    private void applyCriteria(Query query, List<Criteria> criteria) {

        if (criteria.size() == 1) {
            query.addCriteria(criteria.get(0));
        } else if (criteria.size() > 1) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
        }
    }

    private Criteria buildCursorCriteria(VobQueueCursor cursor, Sort.Direction sortDirection) {

        if (sortDirection.isDescending()) {
            return new Criteria().orOperator(
                    Criteria.where("createdAt").lt(cursor.createdAt()),
                    Criteria.where("createdAt").is(cursor.createdAt())
                            .and("_id").lt(new ObjectId(cursor.id()))
            );
        }

        return new Criteria().orOperator(
                Criteria.where("createdAt").gt(cursor.createdAt()),
                Criteria.where("createdAt").is(cursor.createdAt())
                        .and("_id").gt(new ObjectId(cursor.id()))
        );
    }

    private Sort.Direction resolveSortDirection(String sortOrder) {

        return "desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC;
    }

    private ObjectId toObjectId(String id) {

        if (!ObjectId.isValid(id)) {
            throw new ResourceNotFoundException("VOB not found");
        }

        return new ObjectId(id);
    }

    private EligibilityResult buildEligibilityResult(
            ApiEligibilityVerificationResult apiResult,
            String verifiedByUserId) {

        EligibilityResult eligibilityResult = new EligibilityResult();
        eligibilityResult.setCoverageActive(apiResult.coverageActive());
        eligibilityResult.setNetworkStatus(apiResult.networkStatus());
        eligibilityResult.setCopay(apiResult.copay());
        eligibilityResult.setCoinsurancePercent(apiResult.coinsurancePercent());
        eligibilityResult.setDeductibleTotal(apiResult.deductibleTotal());
        eligibilityResult.setDeductibleMet(apiResult.deductibleMet());
        eligibilityResult.setOopMax(apiResult.oopMax());
        eligibilityResult.setOopMet(apiResult.oopMet());
        eligibilityResult.setNotes(apiResult.notes());
        eligibilityResult.setReferenceNumber(apiResult.referenceNumber());
        eligibilityResult.setFailureReason(apiResult.failureReason());
        eligibilityResult.setVerifiedByUserId(verifiedByUserId);
        eligibilityResult.setVerifiedAt(Instant.now());
        eligibilityResult.setVerificationMethod(VerificationMethod.API);
        return eligibilityResult;
    }

    private EligibilityResult buildEligibilityResult(
            ManualVerificationRequestDTO request,
            String verifiedByUserId) {

        EligibilityResult eligibilityResult = new EligibilityResult();
        eligibilityResult.setCoverageActive(request.coverageActive());
        eligibilityResult.setNetworkStatus(request.networkStatus());
        eligibilityResult.setCopay(request.copay());
        eligibilityResult.setCoinsurancePercent(request.coinsurancePercent());
        eligibilityResult.setDeductibleTotal(request.deductibleTotal());
        eligibilityResult.setDeductibleMet(request.deductibleMet());
        eligibilityResult.setOopMax(request.oopMax());
        eligibilityResult.setOopMet(request.oopMet());
        eligibilityResult.setNotes(request.notes());
        eligibilityResult.setReferenceNumber(request.referenceNumber());
        eligibilityResult.setFailureReason(request.failureReason());
        eligibilityResult.setVerifiedByUserId(verifiedByUserId);
        eligibilityResult.setVerifiedAt(Instant.now());
        eligibilityResult.setVerificationMethod(VerificationMethod.MANUAL);
        return eligibilityResult;
    }

    private InsurancePolicy buildInsurancePolicy(InsurancePolicyRequestDTO request) {

        InsurancePolicy insurancePolicy = new InsurancePolicy();
        insurancePolicy.setPayerName(request.payerName());
        insurancePolicy.setMemberId(request.memberId());
        insurancePolicy.setGroupNumber(request.groupNumber());
        insurancePolicy.setPlanType(request.planType());
        insurancePolicy.setRelationshipToSubscriber(request.relationshipToSubscriber());
        insurancePolicy.setCoverageStart(request.coverageStart());
        insurancePolicy.setCoverageEnd(request.coverageEnd());

        return insurancePolicy;
    }
}

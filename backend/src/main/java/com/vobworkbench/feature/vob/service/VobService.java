package com.vobworkbench.feature.vob.service;

import java.time.Instant;
import java.util.List;

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

    public VobService(
            MongoTemplate mongoTemplate,
            PatientRepository patientRepository,
            VobQueueCursorCodec vobQueueCursorCodec,
            VobRepository vobRepository,
            MockEligibilityVerificationService mockEligibilityVerificationService,
            VobStateMachine vobStateMachine) {

        this.mongoTemplate = mongoTemplate;
        this.patientRepository = patientRepository;
        this.vobQueueCursorCodec = vobQueueCursorCodec;
        this.vobRepository = vobRepository;
        this.mockEligibilityVerificationService = mockEligibilityVerificationService;
        this.vobStateMachine = vobStateMachine;
    }

    public VobResponseDTO createVob(VobRequestDTO request, String createdByUserId) {

        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Vob vob = Vob.builder()
                .patientId(patient.getId())
                .insurancePolicy(buildInsurancePolicy(request.insurance()))
                .dateOfService(request.dateOfService())
                .priority(request.priority())
                .status(VobStatus.QUEUED)
                .createdByUserId(createdByUserId)
                .build();

        return VobResponseDTO.from(vobRepository.save(vob));
    }

    public VobResponseDTO getVobById(String id, UserPrincipal principal) {

        Vob vob = vobRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("VOB not found"));

        if (isAuthorizedToViewVob(vob, principal)) {
            return VobResponseDTO.from(vob);
        }

        throw new AccessDeniedException("Access denied");
    }

    public VobQueueResponseDTO getVobListByStatus(VobStatus status, String cursor, int limit,
        String sortOrder, UserPrincipal principal) {

        Sort.Direction sortDirection = resolveSortDirection(sortOrder);

        Query query = buildQueryForVobStatus(status, principal, limit, sortDirection);

        if (StringUtils.hasText(cursor)) {
            VobQueueCursor decodedCursor = vobQueueCursorCodec.decode(cursor);
            query.addCriteria(buildCursorCriteria(decodedCursor, sortDirection));
        }

        List<Vob> vobList = mongoTemplate.find(query, Vob.class);
        boolean hasNext = vobList.size() > limit;
        List<Vob> pageItems = hasNext ? vobList.subList(0, limit) : vobList;
        String nextCursor = hasNext ? encodeCursor(pageItems.get(pageItems.size() - 1)) : null;

        return new VobQueueResponseDTO(
            pageItems.stream().map(VobResponseDTO::from).toList(),
            nextCursor,
            hasNext
        );
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

        if (updated != null) return VobResponseDTO.from(updated);
        
        ensureVobExists(vobId);
        throw new ConflictException("VOB is not in QUEUED status and cannot be claimed");
    }

    public VobResponseDTO verifyVobWithApi(String vobId, String ifMatch, UserPrincipal principal) {

        Vob vob = getExistingVob(vobId);
        ensureAssignedToCurrentUserOrAdmin(vob, principal);
        ensureExpectedVersion(vob, parseExpectedVersion(ifMatch));

        ApiEligibilityVerificationResult apiResult = mockEligibilityVerificationService.verify(vob);
        VobAction action = apiResult.verified() ? VobAction.API_VERIFY_SUCCESS : VobAction.API_VERIFY_FAILED;
        VobStatus nextStatus = vobStateMachine.nextStatus(vob.getStatus(), action);

        vob.setStatus(nextStatus);
        vob.setEligibilityResult(buildEligibilityResult(apiResult, principal.getId()));

        return VobResponseDTO.from(vobRepository.save(vob));
    }

    public VobResponseDTO verifyVobManually(String vobId, ManualVerificationRequestDTO request,
                                            UserPrincipal principal) {

        Vob vob = getExistingVob(vobId);
        ensureAssignedToCurrentUserOrAdmin(vob, principal);
        ensureExpectedVersion(vob, request.version());
        VobAction action = toManualVerificationAction(request.result());
        VobStatus nextStatus = vobStateMachine.nextStatus(vob.getStatus(), action);

        vob.setStatus(nextStatus);
        vob.setEligibilityResult(buildEligibilityResult(request, principal.getId()));

        return VobResponseDTO.from(vobRepository.save(vob));
    }

    // Helper Methods

    private boolean isAuthorizedToViewVob(Vob vob, UserPrincipal principal) {

        if (!isAuthorizedToViewQueuedVobList(principal)) return false;

        VobStatus status = vob.getStatus();
        if (!status.equals(VobStatus.QUEUED)) return principal.getId().equals(vob.getCreatedByUserId());

        return true;
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

    private void ensureAssignedToCurrentUserOrAdmin(Vob vob, UserPrincipal principal) {

        if (isAdminUser(principal) || principal.getId().equals(vob.getAssignedToUserId())) {
            return;
        }

        throw new AccessDeniedException("Only the assigned specialist or admin can verify this VOB");
    }

    private void ensureExpectedVersion(Vob vob, Long expectedVersion) {

        Long currentVersion = vob.getVersion();
        if (currentVersion == null || !currentVersion.equals(expectedVersion)) {
            throw new ConflictException("This VOB was updated by another user. Refresh and try again.");
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

    private Query buildQueryForVobStatus(
            VobStatus status, UserPrincipal principal, int limit, Sort.Direction sortDirection) {

        Query query = new Query()
                .addCriteria(Criteria.where("status").is(status))
                .with(Sort.by(
                        new Sort.Order(sortDirection, "createdAt"),
                        new Sort.Order(sortDirection, "_id")))
                .limit(limit + 1);

        if (!VobStatus.QUEUED.equals(status) && !isAdminUser(principal)) {
            query.addCriteria(Criteria.where("assignedToUserId").is(principal.getId()));
        }

        return query;
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

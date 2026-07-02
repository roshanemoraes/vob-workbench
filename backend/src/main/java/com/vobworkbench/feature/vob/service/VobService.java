package com.vobworkbench.feature.vob.service;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.vobworkbench.core.exception.ResourceNotFoundException;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;
import com.vobworkbench.feature.user.entity.Permission;
import com.vobworkbench.feature.user.service.UserPrincipal;
import com.vobworkbench.feature.vob.dto.InsurancePolicyRequestDTO;
import com.vobworkbench.feature.vob.dto.VobQueueResponseDTO;
import com.vobworkbench.feature.vob.dto.VobRequestDTO;
import com.vobworkbench.feature.vob.dto.VobResponseDTO;
import com.vobworkbench.feature.vob.entity.InsurancePolicy;
import com.vobworkbench.feature.vob.entity.Vob;
import com.vobworkbench.feature.vob.entity.VobStatus;
import com.vobworkbench.feature.vob.repository.VobRepository;

@Service
public class VobService {

    private final MongoTemplate mongoTemplate;
    private final PatientRepository patientRepository;
    private final VobQueueCursorCodec vobQueueCursorCodec;
    private final VobRepository vobRepository;

    public VobService(
            MongoTemplate mongoTemplate,
            PatientRepository patientRepository,
            VobQueueCursorCodec vobQueueCursorCodec,
            VobRepository vobRepository) {

        this.mongoTemplate = mongoTemplate;
        this.patientRepository = patientRepository;
        this.vobQueueCursorCodec = vobQueueCursorCodec;
        this.vobRepository = vobRepository;
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

    public VobQueueResponseDTO getVobListByStatus(VobStatus status, String cursor, int limit, String sortOrder,
                                                  UserPrincipal principal) {

        Sort.Direction sortDirection = resolveSortDirection(sortOrder);

        Query query = buildQueryForVobStatus(status, principal.getId(), limit, sortDirection);

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

    private String encodeCursor(Vob vob) {
        
        return vobQueueCursorCodec.encode(vob.getCreatedAt(), vob.getId());
    }

    private Query buildQueryForVobStatus(
            VobStatus status, String requestedUserId, int limit,Sort.Direction sortDirection) {

        if (status.equals(VobStatus.QUEUED)) {
            return new Query()
                    .addCriteria(Criteria.where("status").is(status))
                    .with(Sort.by(
                            new Sort.Order(sortDirection, "createdAt"),
                            new Sort.Order(sortDirection, "_id")))
                    .limit(limit + 1);
        }
        return new Query()
                .addCriteria(Criteria.where("status").is(status))
                .addCriteria(Criteria.where("assignedToUserId").is(requestedUserId))
                .with(Sort.by(
                        new Sort.Order(sortDirection, "createdAt"),
                        new Sort.Order(sortDirection, "_id")))
                .limit(limit + 1);
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

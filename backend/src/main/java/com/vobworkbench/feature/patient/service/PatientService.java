package com.vobworkbench.feature.patient.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.vobworkbench.core.exception.ConflictException;
import com.vobworkbench.core.exception.ErrorCode;
import com.vobworkbench.core.exception.ResourceNotFoundException;
import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.service.AuditService;
import com.vobworkbench.feature.patient.dto.CreatePatientRequest;
import com.vobworkbench.feature.patient.dto.PatientPageResponse;
import com.vobworkbench.feature.patient.dto.PatientResponse;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;
import com.vobworkbench.feature.user.service.UserPrincipal;

@Service
public class PatientService {

    private final MongoTemplate mongoTemplate;
    private final PatientCursorCodec patientCursorCodec;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public PatientService(
            MongoTemplate mongoTemplate,
            PatientCursorCodec patientCursorCodec,
            PatientRepository patientRepository,
            AuditService auditService
    ) {
        this.mongoTemplate = mongoTemplate;
        this.patientCursorCodec = patientCursorCodec;
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    public PatientResponse createPatient(CreatePatientRequest request, UserPrincipal principal) {

        if (patientRepository.existsByMrn(request.mrn())) {
            throw new ConflictException(ErrorCode.PATIENT_MRN_ALREADY_EXISTS);
        }

        Patient patient = new Patient();
        patient.setMrn(request.mrn());
        patient.setFirstName(request.firstName());
        patient.setLastName(request.lastName());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setPhone(request.phone());
        patient.setCreatedByUserId(principal.getId());

        Patient saved = patientRepository.save(patient);
        auditService.recordSuccess(
                principal,
                AuditAction.PATIENT_CREATED,
                AuditEntityType.PATIENT,
                saved.getPublicId(),
                Map.of("createdByUserId", principal.getId())
        );
        return PatientResponse.from(saved);
    }

    public PatientResponse getById(String id, UserPrincipal principal) {

        Patient patient = findPatientByPublicIdOrDocumentId(id);
        auditService.recordSuccess(
                principal,
                AuditAction.PATIENT_VIEWED,
                AuditEntityType.PATIENT,
                patient.getPublicId(),
                Map.of()
        );
        return PatientResponse.from(patient);
    }

    public PatientPageResponse searchPatients(String cursor, int limit, String search, UserPrincipal principal) {

        Query query = new Query()
                .with(Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("_id")
                ))
                .limit(limit + 1);
        Query countQuery = new Query();

        List<Criteria> filterCriteria = new ArrayList<>();

        if (StringUtils.hasText(search)) {

            Pattern pattern = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            filterCriteria.add(new Criteria().orOperator(
                    Criteria.where("mrn").regex(pattern),
                    Criteria.where("firstName").regex(pattern),
                    Criteria.where("lastName").regex(pattern),
                    Criteria.where("phone").regex(pattern)
            ));
        }

        applyCriteria(countQuery, filterCriteria);

        List<Criteria> pageCriteria = new ArrayList<>(filterCriteria);

        if (StringUtils.hasText(cursor)) {

            PatientCursor decodedCursor = patientCursorCodec.decode(cursor);
            pageCriteria.add(new Criteria().orOperator(
                    Criteria.where("createdAt").lt(decodedCursor.createdAt()),
                    Criteria.where("createdAt").is(decodedCursor.createdAt())
                            .and("_id").lt(new ObjectId(decodedCursor.id()))
            ));
        }

        applyCriteria(query, pageCriteria);

        List<Patient> patients = mongoTemplate.find(query, Patient.class);
        long totalCount = mongoTemplate.count(countQuery, Patient.class);

        boolean hasNext = patients.size() > limit;
        List<Patient> pageItems = hasNext ? patients.subList(0, limit) : patients;
        String nextCursor = hasNext ? cursorFor(pageItems.get(pageItems.size() - 1)) : null;

        PatientPageResponse response = new PatientPageResponse(
                pageItems.stream().map(PatientResponse::from).toList(),
                nextCursor,
                hasNext,
                totalCount
        );
        auditService.recordSuccess(
                principal,
                AuditAction.PATIENT_SEARCHED,
                AuditEntityType.PATIENT,
                null,
                Map.of(
                        "hasSearch", StringUtils.hasText(search),
                        "limit", limit,
                        "resultCount", pageItems.size(),
                        "hasNext", hasNext
                )
        );
        return response;
    }

    private String cursorFor(Patient patient) {

        return patientCursorCodec.encode(patient.getCreatedAt(), patient.getId());
    }

    private Patient findPatientByPublicIdOrDocumentId(String id) {

        return patientRepository.findByPublicId(id)
                .or(() -> ObjectId.isValid(id) ? patientRepository.findById(id) : java.util.Optional.empty())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PATIENT_NOT_FOUND));
    }

    private void applyCriteria(Query query, List<Criteria> criteria) {

        if (criteria.size() == 1) {
            query.addCriteria(criteria.get(0));
        } else if (criteria.size() > 1) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
        }
    }
}

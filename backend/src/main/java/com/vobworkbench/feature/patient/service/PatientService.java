package com.vobworkbench.feature.patient.service;

import com.vobworkbench.core.exception.ConflictException;
import com.vobworkbench.core.exception.ResourceNotFoundException;
import com.vobworkbench.feature.patient.dto.CreatePatientRequest;
import com.vobworkbench.feature.patient.dto.PatientPageResponse;
import com.vobworkbench.feature.patient.dto.PatientResponse;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
public class PatientService {

    private final MongoTemplate mongoTemplate;
    private final PatientCursorCodec patientCursorCodec;
    private final PatientRepository patientRepository;

    public PatientService(
            MongoTemplate mongoTemplate,
            PatientCursorCodec patientCursorCodec,
            PatientRepository patientRepository
    ) {
        this.mongoTemplate = mongoTemplate;
        this.patientCursorCodec = patientCursorCodec;
        this.patientRepository = patientRepository;
    }

    public PatientResponse create(CreatePatientRequest request, String createdByUserId) {
        if (patientRepository.existsByMrn(request.mrn())) {
            throw new ConflictException("Patient MRN already exists");
        }

        Patient patient = new Patient();
        patient.setMrn(request.mrn());
        patient.setFirstName(request.firstName());
        patient.setLastName(request.lastName());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setPhone(request.phone());
        patient.setCreatedByUserId(createdByUserId);

        return PatientResponse.from(patientRepository.save(patient));
    }

    public PatientResponse getById(String id) {
        return patientRepository.findById(id)
                .map(PatientResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }

    public PatientPageResponse list(String cursor, int limit) {
        Query query = new Query()
                .with(Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("_id")
                ))
                .limit(limit + 1);

        if (StringUtils.hasText(cursor)) {
            PatientCursor decodedCursor = patientCursorCodec.decode(cursor);
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("createdAt").lt(decodedCursor.createdAt()),
                    Criteria.where("createdAt").is(decodedCursor.createdAt())
                            .and("_id").lt(new ObjectId(decodedCursor.id()))
            ));
        }

        List<Patient> patients = mongoTemplate.find(query, Patient.class);
        boolean hasNext = patients.size() > limit;
        List<Patient> pageItems = hasNext ? patients.subList(0, limit) : patients;
        String nextCursor = hasNext ? cursorFor(pageItems.get(pageItems.size() - 1)) : null;

        return new PatientPageResponse(
                pageItems.stream().map(PatientResponse::from).toList(),
                nextCursor,
                hasNext
        );
    }

    private String cursorFor(Patient patient) {
        return patientCursorCodec.encode(patient.getCreatedAt(), patient.getId());
    }
}

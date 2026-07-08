package com.vobworkbench.feature.patient.service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.vobworkbench.core.exception.ConflictException;
import com.vobworkbench.core.exception.ResourceNotFoundException;
import com.vobworkbench.feature.patient.dto.CreatePatientRequest;
import com.vobworkbench.feature.patient.dto.PatientPageResponse;
import com.vobworkbench.feature.patient.dto.PatientResponse;
import com.vobworkbench.feature.patient.entity.Patient;
import com.vobworkbench.feature.patient.repository.PatientRepository;

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

    public PatientResponse createPatient(CreatePatientRequest request, String createdByUserId) {

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

    public PatientPageResponse searchPatients(String cursor, int limit, String search) {

        Query query = new Query()
                .with(Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("_id")
                ))
                .limit(limit + 1);

        List<Criteria> criteria = new ArrayList<>();

        if (StringUtils.hasText(cursor)) {

            PatientCursor decodedCursor = patientCursorCodec.decode(cursor);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("createdAt").lt(decodedCursor.createdAt()),
                    Criteria.where("createdAt").is(decodedCursor.createdAt())
                            .and("_id").lt(new ObjectId(decodedCursor.id()))
            ));
        }

        if (StringUtils.hasText(search)) {

            Pattern pattern = Pattern.compile(Pattern.quote(search.trim()), Pattern.CASE_INSENSITIVE);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("mrn").regex(pattern),
                    Criteria.where("firstName").regex(pattern),
                    Criteria.where("lastName").regex(pattern),
                    Criteria.where("phone").regex(pattern)
            ));
        }

        if (criteria.size() == 1) {
            query.addCriteria(criteria.get(0));
        } else if (criteria.size() > 1) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(Criteria[]::new)));
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

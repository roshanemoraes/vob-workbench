package com.vobworkbench.feature.patient.repository;

import com.vobworkbench.feature.patient.entity.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PatientRepository extends MongoRepository<Patient, String> {

    Optional<Patient> findByMrn(String mrn);

    Optional<Patient> findByPublicId(String publicId);

    boolean existsByMrn(String mrn);
}

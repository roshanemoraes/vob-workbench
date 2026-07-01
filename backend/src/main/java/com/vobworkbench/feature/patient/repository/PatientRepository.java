package com.vobworkbench.feature.patient.repository;

import com.vobworkbench.feature.patient.entity.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PatientRepository extends MongoRepository<Patient, String> {

    boolean existsByMrn(String mrn);
}

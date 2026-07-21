package com.vobworkbench.feature.patient.dto;

import com.vobworkbench.feature.patient.entity.Gender;
import com.vobworkbench.feature.patient.entity.Patient;

import java.time.Instant;
import java.time.LocalDate;

public record PatientResponse(

        String id,
        String mrn,
        String firstName,
        String lastName,
        LocalDate dateOfBirth,
        Gender gender,
        String phone,
        String createdByUserId,
        String createdByUserPublicId,
        Instant createdAt,
        Instant updatedAt
) {
    public static PatientResponse from(Patient patient) {
        return from(patient, patient.getCreatedByUserId());
    }

    public static PatientResponse from(Patient patient, String createdByUserPublicId) {

        return new PatientResponse(
                patient.getPublicId(),
                patient.getMrn(),
                patient.getFirstName(),
                patient.getLastName(),
                patient.getDateOfBirth(),
                patient.getGender(),
                patient.getPhone(),
                patient.getCreatedByUserId(),
                createdByUserPublicId,
                patient.getCreatedAt(),
                patient.getUpdatedAt()
        );
    }
}

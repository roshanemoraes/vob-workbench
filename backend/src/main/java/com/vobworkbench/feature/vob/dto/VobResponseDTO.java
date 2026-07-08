package com.vobworkbench.feature.vob.dto;

import com.vobworkbench.feature.vob.entity.VobPriority;
import com.vobworkbench.feature.vob.entity.Vob;
import com.vobworkbench.feature.vob.entity.VobStatus;

import java.time.Instant;
import java.time.LocalDate;

public record VobResponseDTO(

        String id,
        Long version,
        String patientId,
        InsurancePolicyResponseDTO insurance,
        LocalDate dateOfService,
        VobPriority priority,
        VobStatus status,
        String assignedToUserId,
        EligibilityResultResponseDTO eligibilityResult,
        String createdByUserId,
        Instant createdAt,
        Instant updatedAt) {

    public static VobResponseDTO from(Vob vob) {

        return new VobResponseDTO(
                vob.getId(),
                vob.getVersion(),
                vob.getPatientId(),
                InsurancePolicyResponseDTO.from(vob.getInsurancePolicy()),
                vob.getDateOfService(),
                vob.getPriority(),
                vob.getStatus(),
                vob.getAssignedToUserId(),
                EligibilityResultResponseDTO.from(vob.getEligibilityResult()),
                vob.getCreatedByUserId(),
                vob.getCreatedAt(),
                vob.getUpdatedAt()
        );
    }
}

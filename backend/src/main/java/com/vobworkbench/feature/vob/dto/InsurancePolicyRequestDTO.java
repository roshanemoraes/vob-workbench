package com.vobworkbench.feature.vob.dto;

import com.vobworkbench.feature.vob.entity.RelationshipToSubscriber;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record InsurancePolicyRequestDTO(

        @NotBlank String payerName,
        @NotBlank String memberId,
        String groupNumber,
        String planType,
        @NotNull RelationshipToSubscriber relationshipToSubscriber,
        LocalDate coverageStart,
        LocalDate coverageEnd) {
}

package com.vobworkbench.feature.vob.dto;

import com.vobworkbench.feature.vob.entity.RelationshipToSubscriber;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record InsurancePolicyRequestDTO(

        @NotBlank String payerName,
        @NotBlank
        @Pattern(regexp = "^[A-Za-z0-9]{5,}$", message = "must be alphanumeric and at least 5 characters")
        String memberId,
        String groupNumber,
        String planType,
        @NotNull RelationshipToSubscriber relationshipToSubscriber,
        @NotNull LocalDate coverageStart,
        @NotNull LocalDate coverageEnd) {

    @AssertTrue(message = "coverageEnd must be after coverageStart")
    public boolean isCoverageEndAfterCoverageStart() {
        if (coverageStart == null || coverageEnd == null) {
            return true;
        }
        return coverageEnd.isAfter(coverageStart);
    }
}

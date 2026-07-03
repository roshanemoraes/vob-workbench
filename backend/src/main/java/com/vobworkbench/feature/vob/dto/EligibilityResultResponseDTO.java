package com.vobworkbench.feature.vob.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.vobworkbench.feature.vob.entity.EligibilityResult;
import com.vobworkbench.feature.vob.entity.NetworkStatus;
import com.vobworkbench.feature.vob.entity.VerificationMethod;

public record EligibilityResultResponseDTO(

        Boolean coverageActive,
        NetworkStatus networkStatus,
        BigDecimal copay,
        BigDecimal coinsurancePercent,
        BigDecimal deductibleTotal,
        BigDecimal deductibleMet,
        BigDecimal oopMax,
        BigDecimal oopMet,
        String notes,
        String referenceNumber,
        String failureReason,
        String verifiedByUserId,
        Instant verifiedAt,
        VerificationMethod verificationMethod) {

    public static EligibilityResultResponseDTO from(EligibilityResult eligibilityResult) {

        if (eligibilityResult == null) {
            
            return null;
        }

        return new EligibilityResultResponseDTO(
                eligibilityResult.getCoverageActive(),
                eligibilityResult.getNetworkStatus(),
                eligibilityResult.getCopay(),
                eligibilityResult.getCoinsurancePercent(),
                eligibilityResult.getDeductibleTotal(),
                eligibilityResult.getDeductibleMet(),
                eligibilityResult.getOopMax(),
                eligibilityResult.getOopMet(),
                eligibilityResult.getNotes(),
                eligibilityResult.getReferenceNumber(),
                eligibilityResult.getFailureReason(),
                eligibilityResult.getVerifiedByUserId(),
                eligibilityResult.getVerifiedAt(),
                eligibilityResult.getVerificationMethod()
        );
    }
}

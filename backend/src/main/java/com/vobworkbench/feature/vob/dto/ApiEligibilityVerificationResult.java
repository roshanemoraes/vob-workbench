package com.vobworkbench.feature.vob.dto;

import java.math.BigDecimal;

import com.vobworkbench.feature.vob.entity.NetworkStatus;

public record ApiEligibilityVerificationResult(

        boolean verified,
        boolean coverageActive,
        NetworkStatus networkStatus,
        BigDecimal copay,
        BigDecimal coinsurancePercent,
        BigDecimal deductibleTotal,
        BigDecimal deductibleMet,
        BigDecimal oopMax,
        BigDecimal oopMet,
        String notes,
        String referenceNumber,
        String failureReason) {
}

package com.vobworkbench.feature.vob.dto;

import java.math.BigDecimal;

import com.vobworkbench.feature.vob.entity.NetworkStatus;
import com.vobworkbench.feature.vob.entity.VobStatus;

import jakarta.validation.constraints.NotNull;

public record ManualVerificationRequestDTO(

        @NotNull VobStatus result,
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
        String failureReason) {
}

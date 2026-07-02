package com.vobworkbench.feature.vob.dto;

import com.vobworkbench.feature.vob.entity.InsurancePolicy;
import com.vobworkbench.feature.vob.entity.RelationshipToSubscriber;

import java.time.LocalDate;

public record InsurancePolicyResponseDTO(

        String payerName,
        String memberId,
        String groupNumber,
        String planType,
        RelationshipToSubscriber relationshipToSubscriber,
        LocalDate coverageStart,
        LocalDate coverageEnd) {

    public static InsurancePolicyResponseDTO from(InsurancePolicy insurancePolicy) {

        return new InsurancePolicyResponseDTO(
                insurancePolicy.getPayerName(),
                insurancePolicy.getMemberId(),
                insurancePolicy.getGroupNumber(),
                insurancePolicy.getPlanType(),
                insurancePolicy.getRelationshipToSubscriber(),
                insurancePolicy.getCoverageStart(),
                insurancePolicy.getCoverageEnd()
        );
    }
}

package com.vobworkbench.feature.vob.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;

import com.vobworkbench.core.exception.ServiceUnavailableException;
import com.vobworkbench.feature.vob.dto.ApiEligibilityVerificationResult;
import com.vobworkbench.feature.vob.entity.InsurancePolicy;
import com.vobworkbench.feature.vob.entity.NetworkStatus;
import com.vobworkbench.feature.vob.entity.Vob;

@Service
public class MockEligibilityVerificationService {

    public ApiEligibilityVerificationResult verify(Vob vob) {

        InsurancePolicy insurancePolicy = vob.getInsurancePolicy();
        String memberId = insurancePolicy.getMemberId();

        if (containsIgnoreCase(memberId, "UNAVAILABLE")) {
            throw new ServiceUnavailableException("Eligibility verification API is unavailable");
        }

        if (containsIgnoreCase(memberId, "FAIL")) {
            return new ApiEligibilityVerificationResult(
                    false,
                    false,
                    NetworkStatus.UNKNOWN,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "Mock eligibility API could not verify active coverage.",
                    "MOCK-FAILED-" + vob.getPublicId(),
                    "Coverage could not be verified by API"
            );
        }

        return new ApiEligibilityVerificationResult(
                true,
                true,
                NetworkStatus.IN_NETWORK,
                BigDecimal.valueOf(25),
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(1500),
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(6000),
                BigDecimal.valueOf(1250),
                "Coverage confirmed by mock eligibility API.",
                "MOCK-VERIFIED-" + vob.getPublicId(),
                null
        );
    }

    private boolean containsIgnoreCase(String value, String expected) {

        return value != null && value.toLowerCase().contains(expected.toLowerCase());
    }
}

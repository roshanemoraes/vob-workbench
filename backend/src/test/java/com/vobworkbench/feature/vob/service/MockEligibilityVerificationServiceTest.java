package com.vobworkbench.feature.vob.service;

import com.vobworkbench.core.exception.ServiceUnavailableException;
import com.vobworkbench.feature.vob.dto.ApiEligibilityVerificationResult;
import com.vobworkbench.feature.vob.entity.InsurancePolicy;
import com.vobworkbench.feature.vob.entity.NetworkStatus;
import com.vobworkbench.feature.vob.entity.Vob;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MockEligibilityVerificationServiceTest {

    private final MockEligibilityVerificationService service = new MockEligibilityVerificationService();

    @Test
    void returnsVerifiedResultForNormalMemberId() {
        ApiEligibilityVerificationResult result = service.verify(vobWithMemberId("MEMBER-123"));

        assertThat(result.verified()).isTrue();
        assertThat(result.coverageActive()).isTrue();
        assertThat(result.networkStatus()).isEqualTo(NetworkStatus.IN_NETWORK);
        assertThat(result.copay()).isEqualByComparingTo(BigDecimal.valueOf(25));
        assertThat(result.referenceNumber()).startsWith("MOCK-VERIFIED-");
        assertThat(result.failureReason()).isNull();
    }

    @Test
    void returnsFailedResultWhenMemberIdContainsFail() {
        ApiEligibilityVerificationResult result = service.verify(vobWithMemberId("member-fail-123"));

        assertThat(result.verified()).isFalse();
        assertThat(result.coverageActive()).isFalse();
        assertThat(result.networkStatus()).isEqualTo(NetworkStatus.UNKNOWN);
        assertThat(result.referenceNumber()).startsWith("MOCK-FAILED-");
        assertThat(result.failureReason()).isEqualTo("Coverage could not be verified by API");
    }

    @Test
    void throwsServiceUnavailableWhenMemberIdRequestsUnavailablePath() {
        Vob vob = vobWithMemberId("member-unavailable-123");

        assertThatThrownBy(() -> service.verify(vob))
                .isInstanceOf(ServiceUnavailableException.class)
                .hasMessage("Eligibility verification API is unavailable");
    }

    private Vob vobWithMemberId(String memberId) {
        InsurancePolicy policy = new InsurancePolicy();
        policy.setMemberId(memberId);

        Vob vob = new Vob();
        vob.setPublicId("vob-public-id");
        vob.setInsurancePolicy(policy);
        return vob;
    }
}

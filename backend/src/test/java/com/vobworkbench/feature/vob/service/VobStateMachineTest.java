package com.vobworkbench.feature.vob.service;

import com.vobworkbench.core.exception.ConflictException;
import com.vobworkbench.feature.vob.entity.VobAction;
import com.vobworkbench.feature.vob.entity.VobStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VobStateMachineTest {

    private final VobStateMachine stateMachine = new VobStateMachine();

    @Test
    void movesQueuedVobToInProgressWhenProcessingStarts() {
        VobStatus nextStatus = stateMachine.nextStatus(VobStatus.QUEUED, VobAction.START_PROCESSING);

        assertThat(nextStatus).isEqualTo(VobStatus.IN_PROGRESS);
    }

    @Test
    void movesInProgressVobToVerifiedAfterSuccessfulApiVerification() {
        VobStatus nextStatus = stateMachine.nextStatus(VobStatus.IN_PROGRESS, VobAction.API_VERIFY_SUCCESS);

        assertThat(nextStatus).isEqualTo(VobStatus.VERIFIED);
    }

    @Test
    void movesInProgressVobToFailedAfterFailedManualVerification() {
        VobStatus nextStatus = stateMachine.nextStatus(VobStatus.IN_PROGRESS, VobAction.MANUAL_VERIFY_FAILED);

        assertThat(nextStatus).isEqualTo(VobStatus.FAILED_TO_VERIFY);
    }

    @Test
    void rejectsInvalidTransition() {
        assertThatThrownBy(() -> stateMachine.nextStatus(VobStatus.VERIFIED, VobAction.START_PROCESSING))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Cannot perform START_PROCESSING when VOB is VERIFIED");
    }
}

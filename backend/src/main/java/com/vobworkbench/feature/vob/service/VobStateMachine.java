package com.vobworkbench.feature.vob.service;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.vobworkbench.core.exception.ConflictException;
import com.vobworkbench.core.exception.ErrorCode;
import com.vobworkbench.feature.vob.entity.VobAction;
import com.vobworkbench.feature.vob.entity.VobStatus;

@Component
public class VobStateMachine {

    private static final Map<VobStatus, Map<VobAction, VobStatus>> TRANSITIONS = buildTransitions();

    public VobStatus nextStatus(VobStatus currentStatus, VobAction action) {

        VobStatus nextStatus = TRANSITIONS
                .getOrDefault(currentStatus, Map.of())
                .get(action);

        if (nextStatus == null) {
            throw new ConflictException(
                    ErrorCode.INVALID_VOB_STATUS_TRANSITION,
                    "Cannot perform " + action + " when VOB is " + currentStatus
            );
        }

        return nextStatus;
    }

    private static Map<VobStatus, Map<VobAction, VobStatus>> buildTransitions() {

        Map<VobStatus, Map<VobAction, VobStatus>> transitions = new EnumMap<>(VobStatus.class);
        
        Map<VobAction, VobStatus> queuedTransitions = new EnumMap<>(VobAction.class);
        // transitions from the `queued` state
        queuedTransitions.put(VobAction.START_PROCESSING, VobStatus.IN_PROGRESS);
        transitions.put(VobStatus.QUEUED, queuedTransitions);

        Map<VobAction, VobStatus> inProgressTransitions = new EnumMap<>(VobAction.class);
        // transitions from `inprogress` state
        inProgressTransitions.put(VobAction.API_VERIFY_SUCCESS, VobStatus.VERIFIED);
        inProgressTransitions.put(VobAction.API_VERIFY_FAILED, VobStatus.FAILED_TO_VERIFY);
        inProgressTransitions.put(VobAction.MANUAL_VERIFY_SUCCESS, VobStatus.VERIFIED);
        inProgressTransitions.put(VobAction.MANUAL_VERIFY_FAILED, VobStatus.FAILED_TO_VERIFY);
        transitions.put(VobStatus.IN_PROGRESS, inProgressTransitions);

        return transitions;
    }
}

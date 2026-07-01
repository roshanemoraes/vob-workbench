package com.vobworkbench.feature.patient.dto;

import java.util.List;

public record PatientPageResponse(

        List<PatientResponse> items,
        String nextCursor,
        boolean hasNext
) {
}

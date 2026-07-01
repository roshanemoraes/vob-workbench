package com.vobworkbench.feature.patient.service;

import java.time.Instant;

record PatientCursor(
        Instant createdAt,
        String id
) {
}

package com.vobworkbench.feature.vob.service;

import java.time.Instant;

record VobQueueCursor(
        Instant createdAt,
        String id) {
}

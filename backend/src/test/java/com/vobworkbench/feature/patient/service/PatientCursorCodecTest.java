package com.vobworkbench.feature.patient.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PatientCursorCodecTest {

    private final PatientCursorCodec codec = new PatientCursorCodec();

    @Test
    void roundTripsCursor() {
        Instant createdAt = Instant.parse("2026-07-13T03:45:00Z");
        String id = "507f1f77bcf86cd799439011";

        PatientCursor decoded = codec.decode(codec.encode(createdAt, id));

        assertThat(decoded.createdAt()).isEqualTo(createdAt);
        assertThat(decoded.id()).isEqualTo(id);
    }

    @Test
    void rejectsMalformedCursor() {
        assertThatThrownBy(() -> codec.decode("not-a-valid-cursor"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid patient cursor");
    }

    @Test
    void rejectsCursorWithInvalidObjectId() {
        String cursor = codec.encode(Instant.parse("2026-07-13T03:45:00Z"), "not-an-object-id");

        assertThatThrownBy(() -> codec.decode(cursor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid patient cursor");
    }
}

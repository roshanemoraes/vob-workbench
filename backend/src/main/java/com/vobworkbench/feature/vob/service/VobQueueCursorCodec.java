package com.vobworkbench.feature.vob.service;

import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import com.vobworkbench.core.exception.ErrorCode;
import com.vobworkbench.core.exception.VobWorkbenchClientException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Base64;

@Component
public class VobQueueCursorCodec {

    private static final String SEPARATOR = "|";

    public String encode(Instant createdAt, String id) {
        String value = createdAt.toString() + SEPARATOR + id;
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    public VobQueueCursor decode(String cursor) {
        try {
            String decoded = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|", 2);

            if (parts.length != 2 || !ObjectId.isValid(parts[1])) {
                throw new VobWorkbenchClientException(ErrorCode.INVALID_VOB_QUEUE_CURSOR);
            }

            return new VobQueueCursor(Instant.parse(parts[0]), parts[1]);
        } catch (DateTimeParseException | IllegalArgumentException exception) {
            throw new VobWorkbenchClientException(ErrorCode.INVALID_VOB_QUEUE_CURSOR, exception);
        }
    }
}

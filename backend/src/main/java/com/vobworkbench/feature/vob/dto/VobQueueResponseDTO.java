package com.vobworkbench.feature.vob.dto;

import java.util.List;

public record VobQueueResponseDTO(

        List<VobResponseDTO> items,
        String nextCursor,
        boolean hasNext) {
}

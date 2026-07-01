package com.vobworkbench.feature.user.dto;

import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.entity.Permission;

import java.time.Instant;
import java.util.Set;

public record AuthResponse(
        String tokenType,
        String accessToken,
        Instant expiresAt,
        UserSummary user
) {
    public record UserSummary(
            String id,
            String username,
            AppRole role,
            Set<Permission> permissions
    ) {
    }
}

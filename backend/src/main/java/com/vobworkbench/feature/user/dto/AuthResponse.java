package com.vobworkbench.feature.user.dto;

import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.entity.Permission;

import java.time.Instant;
import java.util.Set;

public record AuthResponse(
        String tokenType,
        String accessToken,
        String refreshToken,
        Instant expiresAt,
        Instant refreshExpiresAt,
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

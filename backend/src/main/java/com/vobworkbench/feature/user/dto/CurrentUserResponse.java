package com.vobworkbench.feature.user.dto;

import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.entity.Permission;
import com.vobworkbench.feature.user.service.UserPrincipal;

import java.util.Set;

public record CurrentUserResponse(
        String id,
        String username,
        AppRole role,
        Set<Permission> permissions
) {
    public static CurrentUserResponse from(UserPrincipal principal) {
        return new CurrentUserResponse(
                principal.getId(),
                principal.getUsername(),
                principal.getRole(),
                principal.getPermissions()
        );
    }
}

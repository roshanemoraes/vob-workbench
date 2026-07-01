package com.vobworkbench.feature.user.entity;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

public enum AppRole {
    ADMIN(Permission.values()),
    FRONT_DESK_OPERATOR(
            Permission.PATIENT_CREATE,
            Permission.PATIENT_VIEW,
            Permission.VOB_CREATE,
            Permission.VOB_VIEW_OWN
    ),
    SPECIALIST(
            Permission.VOB_QUEUE_VIEW,
            Permission.VOB_CLAIM,
            Permission.VOB_VERIFY_API,
            Permission.VOB_VERIFY_MANUAL,
            Permission.VOB_COMPLETE
    );

    private final Set<Permission> permissions;

    AppRole(Permission... permissions) {
        this.permissions = Collections.unmodifiableSet(new LinkedHashSet<>(Arrays.asList(permissions)));
    }

    public Set<Permission> getPermissions() {
        return permissions;
    }
}

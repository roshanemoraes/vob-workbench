package com.vobworkbench.core.security;

public final class SecurityExpressions {

    public static final String AUTHENTICATED = "isAuthenticated()";
    public static final String PATIENT_CREATE = "hasAuthority('PATIENT_CREATE')";
    public static final String PATIENT_VIEW = "hasAuthority('PATIENT_VIEW')";
    public static final String USER_MANAGE = "hasAuthority('USER_MANAGE')";

    private SecurityExpressions() {
    }
}

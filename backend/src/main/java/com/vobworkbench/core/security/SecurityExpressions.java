package com.vobworkbench.core.security;

public final class SecurityExpressions {

    public static final String AUTHENTICATED = "isAuthenticated()";
    public static final String PATIENT_CREATE = "hasAuthority('PATIENT_CREATE')";
    public static final String PATIENT_VIEW = "hasAuthority('PATIENT_VIEW')";
    public static final String USER_MANAGE = "hasAuthority('USER_MANAGE')";
    public static final String VOB_CREATE = "hasAuthority('VOB_CREATE')";
    public static final String VOB_QUEUE_VIEW = "hasAuthority('VOB_QUEUE_VIEW')";
    public static final String VOB_VIEW = "hasAnyAuthority('VOB_QUEUE_VIEW', 'VOB_VIEW_OWN')";
    public static final String VOB_CLAIM = "hasAuthority('VOB_CLAIM')";
    public static final String VOB_VERIFY_API = "hasAuthority('VOB_VERIFY_API')";
    public static final String VOB_VERIFY_MANUAL = "hasAuthority('VOB_VERIFY_MANUAL')";

    private SecurityExpressions() {
    }
}

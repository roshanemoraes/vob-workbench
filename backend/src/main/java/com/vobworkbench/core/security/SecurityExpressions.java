package com.vobworkbench.core.security;

public final class SecurityExpressions {

    public static final String AUTHENTICATED = "isAuthenticated()";
    public static final String USER_MANAGE = "hasAuthority('USER_MANAGE')";

    private SecurityExpressions() {
    }
}

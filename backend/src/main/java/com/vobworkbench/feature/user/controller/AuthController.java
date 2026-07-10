package com.vobworkbench.feature.user.controller;

import com.vobworkbench.feature.user.dto.AuthResponse;
import com.vobworkbench.feature.user.dto.CurrentUserResponse;
import com.vobworkbench.feature.user.dto.LoginRequest;
import com.vobworkbench.core.security.SecurityExpressions;
import com.vobworkbench.feature.user.service.AuthService;
import com.vobworkbench.feature.user.service.RefreshTokenService;
import com.vobworkbench.feature.user.service.UserPrincipal;
import jakarta.validation.Valid;
import java.time.Duration;
import java.time.Instant;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "vob_refresh";
    private static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthSession session = authService.login(request);
        return withRefreshCookie(session);
    }

    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME) String refreshToken) {
        AuthService.AuthSession session = authService.refresh(refreshToken);
        return withRefreshCookie(session);
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            @AuthenticationPrincipal UserPrincipal principal) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken, principal);
        }
        return ResponseEntity
                .status(HttpStatus.NO_CONTENT)
                .header(HttpHeaders.SET_COOKIE, expiredRefreshCookie().toString())
                .build();
    }

    @GetMapping("/me")
    @PreAuthorize(SecurityExpressions.AUTHENTICATED)
    ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(CurrentUserResponse.from(principal));
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(AuthService.AuthSession session) {
        return ResponseEntity
                .ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken()).toString())
                .body(session.response());
    }

    private ResponseCookie refreshCookie(RefreshTokenService.IssuedRefreshToken refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken.value())
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(Duration.between(Instant.now(), refreshToken.expiresAt()))
                .build();
    }

    private ResponseCookie expiredRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(Duration.ZERO)
                .build();
    }
}

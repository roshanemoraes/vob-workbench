package com.vobworkbench.feature.user.controller;

import com.vobworkbench.feature.user.dto.AuthResponse;
import com.vobworkbench.feature.user.dto.CurrentUserResponse;
import com.vobworkbench.feature.user.dto.LoginRequest;
import com.vobworkbench.feature.user.dto.RefreshTokenRequest;
import com.vobworkbench.core.security.SecurityExpressions;
import com.vobworkbench.feature.user.service.AuthService;
import com.vobworkbench.feature.user.service.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @PostMapping("/logout")
    ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/me")
    @PreAuthorize(SecurityExpressions.AUTHENTICATED)
    ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(CurrentUserResponse.from(principal));
    }
}

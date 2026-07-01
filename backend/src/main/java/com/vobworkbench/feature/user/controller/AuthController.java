package com.vobworkbench.feature.user.controller;

import com.vobworkbench.feature.user.dto.AuthResponse;
import com.vobworkbench.feature.user.dto.CurrentUserResponse;
import com.vobworkbench.feature.user.dto.LoginRequest;
import com.vobworkbench.feature.user.service.AuthService;
import com.vobworkbench.feature.user.service.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/me")
    ResponseEntity<CurrentUserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(CurrentUserResponse.from(principal));
    }
}

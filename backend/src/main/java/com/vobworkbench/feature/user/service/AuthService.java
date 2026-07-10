package com.vobworkbench.feature.user.service;

import java.util.Map;

import com.vobworkbench.feature.audit.entity.AuditAction;
import com.vobworkbench.feature.audit.entity.AuditEntityType;
import com.vobworkbench.feature.audit.entity.AuditOutcome;
import com.vobworkbench.feature.audit.service.AuditService;
import com.vobworkbench.feature.user.dto.AuthResponse;
import com.vobworkbench.feature.user.dto.LoginRequest;
import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            UserRepository userRepository,
            AuditService auditService
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public AuthSession login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
        } catch (AuthenticationException exception) {
            auditService.recordSystemFailure(
                    AuditAction.LOGIN_FAILED,
                    AuditEntityType.AUTH,
                    null,
                    "Invalid username or password",
                    Map.of()
            );
            throw exception;
        }

        AppUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        JwtService.Token token = jwtService.generateToken(user);
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(user);

        auditService.recordActor(
                user.getPublicId(),
                user.getRole(),
                AuditAction.LOGIN_SUCCESS,
                AuditEntityType.AUTH,
                user.getPublicId(),
                AuditOutcome.SUCCESS,
                null,
                Map.of()
        );

        return buildAuthSession(user, token, refreshToken);
    }

    public AuthSession refresh(String refreshToken) {
        RefreshTokenService.RefreshResult result = refreshTokenService.rotate(refreshToken);
        JwtService.Token token = jwtService.generateToken(result.user());
        return buildAuthSession(result.user(), token, result.refreshToken());
    }

    public void logout(String refreshToken, UserPrincipal principal) {
        refreshTokenService.revoke(refreshToken);
        auditService.recordSuccess(principal, AuditAction.LOGOUT, AuditEntityType.AUTH, null, Map.of());
    }

    private AuthSession buildAuthSession(
            AppUser user,
            JwtService.Token token,
            RefreshTokenService.IssuedRefreshToken refreshToken
    ) {
        AuthResponse response = new AuthResponse(
                "Bearer",
                token.value(),
                token.expiresAt(),
                new AuthResponse.UserSummary(
                        user.getPublicId(),
                        user.getUsername(),
                        user.getRole(),
                        user.getRole().getPermissions()
                )
        );
        return new AuthSession(response, refreshToken);
    }

    public record AuthSession(
            AuthResponse response,
            RefreshTokenService.IssuedRefreshToken refreshToken
    ) {
    }
}

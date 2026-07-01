package com.vobworkbench.feature.user.service;

import com.vobworkbench.feature.user.dto.AuthResponse;
import com.vobworkbench.feature.user.dto.LoginRequest;
import com.vobworkbench.feature.user.dto.RefreshTokenRequest;
import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            UserRepository userRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.userRepository = userRepository;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        AppUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        JwtService.Token token = jwtService.generateToken(user);
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(user);

        return buildAuthResponse(user, token, refreshToken);
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshTokenService.RefreshResult result = refreshTokenService.rotate(request.refreshToken());
        JwtService.Token token = jwtService.generateToken(result.user());
        return buildAuthResponse(result.user(), token, result.refreshToken());
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revoke(request.refreshToken());
    }

    private AuthResponse buildAuthResponse(
            AppUser user,
            JwtService.Token token,
            RefreshTokenService.IssuedRefreshToken refreshToken
    ) {
        return new AuthResponse(
                "Bearer",
                token.value(),
                refreshToken.value(),
                token.expiresAt(),
                refreshToken.expiresAt(),
                new AuthResponse.UserSummary(
                        user.getId(),
                        user.getUsername(),
                        user.getRole(),
                        user.getRole().getPermissions()
                )
        );
    }
}

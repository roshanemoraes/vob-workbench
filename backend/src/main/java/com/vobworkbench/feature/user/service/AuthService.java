package com.vobworkbench.feature.user.service;

import com.vobworkbench.feature.user.dto.AuthResponse;
import com.vobworkbench.feature.user.dto.LoginRequest;
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
    private final UserRepository userRepository;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        AppUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        JwtService.Token token = jwtService.generateToken(user);

        return new AuthResponse(
                "Bearer",
                token.value(),
                token.expiresAt(),
                new AuthResponse.UserSummary(
                        user.getId(),
                        user.getUsername(),
                        user.getRole(),
                        user.getRole().getPermissions()
                )
        );
    }
}

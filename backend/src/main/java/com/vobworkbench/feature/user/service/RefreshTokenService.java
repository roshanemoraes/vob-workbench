package com.vobworkbench.feature.user.service;

import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.entity.RefreshToken;
import com.vobworkbench.feature.user.repository.RefreshTokenRepository;
import com.vobworkbench.feature.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;

@Service
public class RefreshTokenService {

    private final SecureRandom secureRandom = new SecureRandom();

    private final long expiresDays;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public RefreshTokenService(
            @Value("${vob.security.refresh-token.expires-days}") long expiresDays,
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository
    ) {
        this.expiresDays = expiresDays;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    public IssuedRefreshToken issue(AppUser user) {
        String rawToken = generateRawToken();
        Instant expiresAt = Instant.now().plus(expiresDays, ChronoUnit.DAYS);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(hash(rawToken));
        refreshToken.setUserId(user.getId());
        refreshToken.setExpiresAt(expiresAt);

        refreshTokenRepository.save(refreshToken);

        return new IssuedRefreshToken(rawToken, expiresAt);
    }

    public RefreshResult rotate(String rawToken) {
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (!existing.isActive()) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        existing.setRevokedAt(Instant.now());
        refreshTokenRepository.save(existing);

        AppUser user = userRepository.findById(existing.getUserId())
                .filter(AppUser::isEnabled)
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        return new RefreshResult(user, issue(user));
    }

    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .filter(RefreshToken::isActive)
                .ifPresent(refreshToken -> {
                    refreshToken.setRevokedAt(Instant.now());
                    refreshTokenRepository.save(refreshToken);
                });
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash refresh token", exception);
        }
    }

    public record IssuedRefreshToken(String value, Instant expiresAt) {
    }

    public record RefreshResult(AppUser user, IssuedRefreshToken refreshToken) {
    }
}

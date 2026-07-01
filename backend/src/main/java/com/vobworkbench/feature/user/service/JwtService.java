package com.vobworkbench.feature.user.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vobworkbench.feature.user.entity.AppUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String HMAC_SHA256 = "HmacSHA256";

    private final ObjectMapper objectMapper;
    private final String secret;
    private final long expiresMinutes;

    public JwtService(
            ObjectMapper objectMapper,
            @Value("${vob.security.jwt.secret}") String secret,
            @Value("${vob.security.jwt.expires-minutes}") long expiresMinutes
    ) {
        this.objectMapper = objectMapper;
        this.secret = secret;
        this.expiresMinutes = expiresMinutes;
    }

    public Token generateToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expiresMinutes, ChronoUnit.MINUTES);

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put("sub", user.getUsername());
        claims.put("uid", user.getId());
        claims.put("role", user.getRole().name());
        claims.put("permissions", user.getRole().getPermissions().stream().map(Enum::name).toList());
        claims.put("iat", now.getEpochSecond());
        claims.put("exp", expiresAt.getEpochSecond());

        String encodedHeader = base64Url(toJson(header));
        String encodedPayload = base64Url(toJson(claims));
        String signature = sign(encodedHeader + "." + encodedPayload);

        return new Token(encodedHeader + "." + encodedPayload + "." + signature, expiresAt);
    }

    public String extractUsername(String token) {
        return String.valueOf(claims(token).get("sub"));
    }

    public boolean isTokenValid(String token, UserPrincipal principal) {
        Map<String, Object> claims = claims(token);
        Number expiresAt = (Number) claims.get("exp");

        return principal.getUsername().equals(claims.get("sub"))
                && expiresAt != null
                && Instant.ofEpochSecond(expiresAt.longValue()).isAfter(Instant.now())
                && signatureIsValid(token);
    }

    private Map<String, Object> claims(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3 || !signatureIsValid(token)) {
                throw new BadCredentialsException("Invalid token");
            }

            byte[] decodedPayload = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(decodedPayload, new TypeReference<>() {
            });
        } catch (BadCredentialsException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadCredentialsException("Invalid token", exception);
        }
    }

    private boolean signatureIsValid(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return false;
        }

        String expected = sign(parts[0] + "." + parts[1]);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                parts[2].getBytes(StandardCharsets.UTF_8)
        );
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign JWT", exception);
        }
    }

    private byte[] toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsBytes(value);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to serialize JWT", exception);
        }
    }

    private String base64Url(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    public record Token(String value, Instant expiresAt) {
    }
}

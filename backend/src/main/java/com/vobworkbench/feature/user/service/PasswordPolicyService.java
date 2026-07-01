package com.vobworkbench.feature.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PasswordPolicyService {

    private final int minLength;
    private final boolean requireLetter;
    private final boolean requireDigit;

    public PasswordPolicyService(
            @Value("${vob.security.password.min-length}") int minLength,
            @Value("${vob.security.password.require-letter}") boolean requireLetter,
            @Value("${vob.security.password.require-digit}") boolean requireDigit
    ) {
        this.minLength = minLength;
        this.requireLetter = requireLetter;
        this.requireDigit = requireDigit;
    }

    public void validate(String password) {
        if (password == null || password.length() < minLength) {
            throw new IllegalArgumentException("Password must be at least " + minLength + " characters long");
        }

        if (requireLetter && password.chars().noneMatch(Character::isLetter)) {
            throw new IllegalArgumentException("Password must contain at least one letter");
        }

        if (requireDigit && password.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException("Password must contain at least one digit");
        }
    }
}

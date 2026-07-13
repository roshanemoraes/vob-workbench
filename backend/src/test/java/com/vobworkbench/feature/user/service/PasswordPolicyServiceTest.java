package com.vobworkbench.feature.user.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordPolicyServiceTest {

    @Test
    void acceptsPasswordThatMeetsAllRequirements() {
        PasswordPolicyService service = new PasswordPolicyService(8, true, true);

        service.validate("Passw0rd");
    }

    @Test
    void rejectsNullPassword() {
        PasswordPolicyService service = new PasswordPolicyService(8, true, true);

        assertThatThrownBy(() -> service.validate(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Password must be at least 8 characters long");
    }

    @Test
    void rejectsShortPassword() {
        PasswordPolicyService service = new PasswordPolicyService(8, true, true);

        assertThatThrownBy(() -> service.validate("P4ss"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Password must be at least 8 characters long");
    }

    @Test
    void rejectsPasswordWithoutLetterWhenRequired() {
        PasswordPolicyService service = new PasswordPolicyService(8, true, true);

        assertThatThrownBy(() -> service.validate("12345678"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Password must contain at least one letter");
    }

    @Test
    void rejectsPasswordWithoutDigitWhenRequired() {
        PasswordPolicyService service = new PasswordPolicyService(8, true, true);

        assertThatThrownBy(() -> service.validate("Password"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Password must contain at least one digit");
    }

    @Test
    void honorsDisabledLetterAndDigitRequirements() {
        PasswordPolicyService service = new PasswordPolicyService(4, false, false);

        service.validate("!!!!");
    }
}

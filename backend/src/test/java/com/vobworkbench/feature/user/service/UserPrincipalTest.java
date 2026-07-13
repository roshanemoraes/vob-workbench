package com.vobworkbench.feature.user.service;

import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.entity.AppUser;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import static org.assertj.core.api.Assertions.assertThat;

class UserPrincipalTest {

    @Test
    void exposesUserIdentityAndAuthorities() {
        AppUser user = new AppUser();
        user.setPublicId("user-public-id");
        user.setUsername("admin@example.com");
        user.setPasswordHash("hashed-password");
        user.setRole(AppRole.ADMIN);
        user.setEnabled(true);

        UserPrincipal principal = new UserPrincipal(user);

        assertThat(principal.getId()).isEqualTo("user-public-id");
        assertThat(principal.getUsername()).isEqualTo("admin@example.com");
        assertThat(principal.getPassword()).isEqualTo("hashed-password");
        assertThat(principal.getRole()).isEqualTo(AppRole.ADMIN);
        assertThat(principal.isEnabled()).isTrue();
        assertThat(principal.getAuthorities())
                .extracting(GrantedAuthority::getAuthority)
                .contains("ROLE_ADMIN", "PATIENT_CREATE", "USER_MANAGE");
    }
}

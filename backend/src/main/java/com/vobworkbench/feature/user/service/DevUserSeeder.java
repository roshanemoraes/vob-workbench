package com.vobworkbench.feature.user.service;

import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(1)
@ConditionalOnProperty(name = "vob.dev-seed.enabled", havingValue = "true")
public class DevUserSeeder implements CommandLineRunner {

    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;
    private final UserRepository userRepository;

    public DevUserSeeder(
            PasswordEncoder passwordEncoder,
            PasswordPolicyService passwordPolicyService,
            UserRepository userRepository
    ) {
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        seed("admin", "admin123", AppRole.ADMIN);
        seed("frontdesk", "frontdesk123", AppRole.FRONT_DESK_OPERATOR);
        seed("specialist", "specialist123", AppRole.SPECIALIST);
    }

    private void seed(String username, String password, AppRole role) {
        if (userRepository.existsByUsername(username)) {
            return;
        }

        passwordPolicyService.validate(password);

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEnabled(true);

        userRepository.save(user);
    }
}

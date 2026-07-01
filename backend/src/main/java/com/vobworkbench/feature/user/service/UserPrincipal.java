package com.vobworkbench.feature.user.service;

import com.vobworkbench.feature.user.entity.AppRole;
import com.vobworkbench.feature.user.entity.AppUser;
import com.vobworkbench.feature.user.entity.Permission;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

public class UserPrincipal implements UserDetails {

    private final AppUser user;

    public UserPrincipal(AppUser user) {
        this.user = user;
    }

    public String getId() {
        return user.getId();
    }

    public AppRole getRole() {
        return user.getRole();
    }

    public Set<Permission> getPermissions() {
        return user.getRole().getPermissions();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new LinkedHashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        authorities.addAll(user.getRole()
                .getPermissions()
                .stream()
                .map(permission -> new SimpleGrantedAuthority(permission.name()))
                .collect(Collectors.toCollection(LinkedHashSet::new)));
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isEnabled() {
        return user.isEnabled();
    }
}

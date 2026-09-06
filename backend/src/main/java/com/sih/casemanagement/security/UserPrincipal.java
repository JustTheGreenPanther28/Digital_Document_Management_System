package com.sih.casemanagement.security;

import com.sih.casemanagement.common.enums.SecurityClearance;
import com.sih.casemanagement.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.UUID;
import java.util.stream.Collectors;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String username;
    private final String email;
    private final String password;
    private final String fullName;
    private final SecurityClearance clearance;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final boolean mfaEnabled;
    private final Collection<? extends GrantedAuthority> authorities;
    
    // 1. New user field
    private final User user; 

    public UserPrincipal(User user) {
        // 2. Assign the user
        this.user = user; 
        
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPasswordHash();
        this.fullName = user.getFullName();
        this.clearance = user.getSecurityClearance();
        this.enabled = user.isEnabled();
        this.accountNonLocked = !user.isAccountLocked();
        this.mfaEnabled = user.isMfaEnabled();
        
        java.util.Set<GrantedAuthority> auths = new java.util.HashSet<>();
        if (user.getRoles() != null) {
            for (var role : user.getRoles()) {
                auths.add(new SimpleGrantedAuthority("ROLE_" + role.getName().name()));
                if (role.getPermissions() != null) {
                    for (var perm : role.getPermissions()) {
                        auths.add(new SimpleGrantedAuthority(perm.getName()));
                    }
                }
            }
        }
        this.authorities = auths;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public SecurityClearance getClearance() { return clearance; }
    public boolean isMfaEnabled() { return mfaEnabled; }
    
    // 3. New getter method
    public User getUser() { return user; } 

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return accountNonLocked; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return enabled; }
}
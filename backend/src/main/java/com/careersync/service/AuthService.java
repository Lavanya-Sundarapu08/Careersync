package com.careersync.service;

import com.careersync.common.ApiException;
import com.careersync.domain.company.Company;
import com.careersync.domain.user.Role;
import com.careersync.domain.user.User;
import com.careersync.dto.AuthDtos.*;
import com.careersync.repository.CompanyRepository;
import com.careersync.repository.UserRepository;
import com.careersync.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("Email already registered");
        }

        Company company = null;
        if (request.role() == Role.RECRUITER) {
            String email = request.email().toLowerCase().trim();
            if (isPublicEmailDomain(email)) {
                throw ApiException.badRequest("Recruiters must register with an official corporate work email (e.g. name@company.com). Public email providers are not permitted for SLA-backed job postings.");
            }
            if (request.companySlug() == null || request.companySlug().isBlank()) {
                throw ApiException.badRequest("companySlug is required for RECRUITER accounts");
            }
            company = companyRepository.findBySlug(request.companySlug())
                    .orElseThrow(() -> ApiException.notFound("Unknown company: " + request.companySlug()));
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .role(request.role())
                .company(company)
                .build();
        user = userRepository.save(user);

        return buildTokenResponse(user);
    }

    public TokenResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));
        return buildTokenResponse(user);
    }

    public TokenResponse refresh(RefreshRequest request) {
        String token = request.refreshToken();
        if (!jwtService.isValid(token) || !"refresh".equals(jwtService.extractTokenType(token))) {
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }
        User user = userRepository.findByEmail(jwtService.extractEmail(token))
                .orElseThrow(() -> ApiException.unauthorized("Unknown user"));
        return buildTokenResponse(user);
    }

    private TokenResponse buildTokenResponse(User user) {
        String access = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refresh = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());
        UserSummary summary = new UserSummary(
                user.getId().toString(), user.getEmail(), user.getFullName(), user.getRole(),
                user.getCompany() == null ? null : user.getCompany().getId().toString());
        return new TokenResponse(access, refresh, "Bearer", summary);
    }

    private static final java.util.Set<String> PUBLIC_DOMAINS = java.util.Set.of(
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
            "icloud.com", "mail.com", "aol.com", "zoho.com", "proton.me", "protonmail.com"
    );

    private boolean isPublicEmailDomain(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex == -1 || atIndex == email.length() - 1) return false;
        String domain = email.substring(atIndex + 1).toLowerCase();
        return PUBLIC_DOMAINS.contains(domain);
    }
}

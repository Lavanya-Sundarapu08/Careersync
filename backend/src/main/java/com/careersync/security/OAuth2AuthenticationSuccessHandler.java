package com.careersync.security;

import com.careersync.domain.company.Company;
import com.careersync.domain.user.Role;
import com.careersync.domain.user.User;
import com.careersync.repository.CompanyRepository;
import com.careersync.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Handles successful Google OAuth2 authentication — Option 2 implementation.
 *
 * <ul>
 *   <li><b>CANDIDATE flow</b>: any Google account (gmail, corporate, etc.) is accepted.
 *       A new user is provisioned on first sign-in with {@code Role.CANDIDATE}.</li>
 *   <li><b>RECRUITER flow</b>: only corporate Google Workspace accounts are accepted.
 *       Public providers (gmail.com, yahoo.com, etc.) are rejected with a clear error.
 *       The recruiter's email domain is matched against a company record; if found, the
 *       company is auto-linked. On subsequent logins the existing account is reused.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Set<String> PUBLIC_DOMAINS = Set.of(
            "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
            "icloud.com", "mail.com", "aol.com", "zoho.com",
            "proton.me", "protonmail.com", "ymail.com", "live.com"
    );

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final HttpCookieOAuth2AuthorizationRequestRepository authorizationRequestRepository;

    @Value("${app.oauth2.authorized-redirect-uri:http://localhost:5173/oauth2/callback}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name  = oAuth2User.getAttribute("name");

        // Read + consume role cookie set during authorization request
        String roleCookie = authorizationRequestRepository.consumeRoleCookie(request, response);
        authorizationRequestRepository.removeAuthorizationRequest(request, response);

        if (email == null || email.isBlank()) {
            log.error("OAuth2 user did not provide an email address");
            sendError(request, response, "email_not_provided");
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();
        String domain = extractDomain(normalizedEmail);

        // ── RECRUITER flow ────────────────────────────────────────────────────
        if ("RECRUITER".equalsIgnoreCase(roleCookie)) {
            if (PUBLIC_DOMAINS.contains(domain)) {
                log.warn("Recruiter OAuth attempt rejected — public domain '{}' ({})", domain, normalizedEmail);
                sendError(request, response,
                        URLEncoder.encode(
                                "Recruiter sign-in requires a corporate Google Workspace account. " +
                                "Public email providers (Gmail, Yahoo, Outlook…) are not permitted. " +
                                "Please use your company work email.",
                                StandardCharsets.UTF_8));
                return;
            }

            Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                if (user.getRole() != Role.RECRUITER) {
                    log.warn("Account {} exists as {} — cannot re-use as RECRUITER via OAuth.", normalizedEmail, user.getRole());
                    sendError(request, response,
                            URLEncoder.encode(
                                    "This email is already registered as a " + user.getRole().name().toLowerCase() +
                                    " account. Please log in with your password instead.",
                                    StandardCharsets.UTF_8));
                    return;
                }
                log.info("Existing recruiter {} signed in via Google Workspace.", normalizedEmail);
            } else {
                // Auto-match company by email domain
                Optional<Company> companyOpt = companyRepository.findByEmailDomain(domain);

                if (companyOpt.isEmpty()) {
                    log.warn("No company registered for domain '{}'. Recruiter OAuth blocked.", domain);
                    sendError(request, response,
                            URLEncoder.encode(
                                    "Your company (" + domain + ") is not yet registered on CareerSync. " +
                                    "Please ask your admin to register your company first, then sign up with a company slug.",
                                    StandardCharsets.UTF_8));
                    return;
                }

                Company company = companyOpt.get();
                log.info("Provisioning new recruiter {} linked to company '{}'.", normalizedEmail, company.getName());
                user = User.builder()
                        .email(normalizedEmail)
                        .fullName(name != null && !name.isBlank() ? name : normalizedEmail.split("@")[0])
                        .role(Role.RECRUITER)
                        .company(company)
                        .passwordHash("{oauth2}" + UUID.randomUUID())
                        .enabled(true)
                        .build();
                user = userRepository.save(user);
            }

            mintAndRedirect(request, response, user);
            return;
        }

        // ── CANDIDATE flow ────────────────────────────────────────────────────
        Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);
        User user;

        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (user.getRole() == Role.RECRUITER) {
                log.warn("Recruiter account {} tried Candidate Google OAuth. Blocked.", normalizedEmail);
                sendError(request, response,
                        URLEncoder.encode(
                                "This email is registered as a Recruiter account. " +
                                "Recruiters must sign in with their corporate email and password.",
                                StandardCharsets.UTF_8));
                return;
            }
            log.info("Existing candidate {} signed in via Google.", normalizedEmail);
        } else {
            log.info("Provisioning new candidate for Google OAuth: {}", normalizedEmail);
            user = User.builder()
                    .email(normalizedEmail)
                    .fullName(name != null && !name.isBlank() ? name : normalizedEmail.split("@")[0])
                    .role(Role.CANDIDATE)
                    .passwordHash("{oauth2}" + UUID.randomUUID())
                    .enabled(true)
                    .build();
            user = userRepository.save(user);
        }

        mintAndRedirect(request, response, user);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void mintAndRedirect(HttpServletRequest request, HttpServletResponse response, User user) throws IOException {
        String accessToken  = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getRole().name());

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private void sendError(HttpServletRequest request, HttpServletResponse response, String encodedError) throws IOException {
        String errorUrl = redirectUri + "?error=" + encodedError;
        getRedirectStrategy().sendRedirect(request, response, errorUrl);
    }

    private String extractDomain(String email) {
        int at = email.indexOf('@');
        return (at >= 0 && at < email.length() - 1) ? email.substring(at + 1) : "";
    }
}

package com.careersync.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

import java.io.*;
import java.util.Base64;
import java.util.Optional;

/**
 * Cookie-based authorization request repository for stateless JWT architecture.
 * Prevents "authorization_request_not_found" errors when SessionCreationPolicy is STATELESS.
 *
 * Additionally persists a companion {@code careersync_oauth_role} cookie so that the
 * OAuth2 success handler knows whether the user initiated the flow as CANDIDATE or RECRUITER.
 */
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    public static final String OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME = "careersync_oauth2_req";
    public static final String OAUTH2_ROLE_COOKIE_NAME = "careersync_oauth_role";
    private static final int COOKIE_EXPIRE_SECONDS = 180;

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return getCookie(request, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME)
                .map(this::deserialize)
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request, HttpServletResponse response) {
        if (authorizationRequest == null) {
            deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
            deleteCookie(request, response, OAUTH2_ROLE_COOKIE_NAME);
            return;
        }

        // Persist the OAuth2 authorization request itself
        String serialized = serialize(authorizationRequest);
        if (serialized != null) {
            Cookie cookie = new Cookie(OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME, serialized);
            cookie.setPath("/");
            cookie.setHttpOnly(true);
            cookie.setMaxAge(COOKIE_EXPIRE_SECONDS);
            response.addCookie(cookie);
        }

        // Persist the role indicator from the query param (?role=CANDIDATE or ?role=RECRUITER)
        String role = request.getParameter("role");
        if (role != null && (role.equalsIgnoreCase("CANDIDATE") || role.equalsIgnoreCase("RECRUITER"))) {
            Cookie roleCookie = new Cookie(OAUTH2_ROLE_COOKIE_NAME, role.toUpperCase());
            roleCookie.setPath("/");
            roleCookie.setHttpOnly(true);
            roleCookie.setMaxAge(COOKIE_EXPIRE_SECONDS);
            response.addCookie(roleCookie);
        }
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request, HttpServletResponse response) {
        OAuth2AuthorizationRequest req = this.loadAuthorizationRequest(request);
        deleteCookie(request, response, OAUTH2_AUTHORIZATION_REQUEST_COOKIE_NAME);
        // NOTE: role cookie is deliberately NOT deleted here; the success handler reads it first.
        return req;
    }

    /**
     * Reads the role cookie and deletes it. Called once by the success handler after reading.
     */
    public String consumeRoleCookie(HttpServletRequest request, HttpServletResponse response) {
        String role = getCookie(request, OAUTH2_ROLE_COOKIE_NAME)
                .map(Cookie::getValue)
                .orElse("CANDIDATE"); // default to CANDIDATE if cookie is missing
        deleteCookie(request, response, OAUTH2_ROLE_COOKIE_NAME);
        return role;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private Optional<Cookie> getCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    return Optional.of(cookie);
                }
            }
        }
        return Optional.empty();
    }

    private void deleteCookie(HttpServletRequest request, HttpServletResponse response, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(name)) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    response.addCookie(cookie);
                }
            }
        }
    }

    private String serialize(OAuth2AuthorizationRequest object) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(object);
            return Base64.getUrlEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }

    private OAuth2AuthorizationRequest deserialize(Cookie cookie) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(cookie.getValue());
            try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
                 ObjectInputStream ois = new ObjectInputStream(bais)) {
                return (OAuth2AuthorizationRequest) ois.readObject();
            }
        } catch (Exception e) {
            return null;
        }
    }
}

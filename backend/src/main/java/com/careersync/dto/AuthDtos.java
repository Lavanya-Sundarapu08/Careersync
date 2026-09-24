package com.careersync.dto;

import com.careersync.domain.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
            @NotBlank String fullName,
            @NotNull Role role,
            String companySlug // required only for RECRUITER
    ) {}

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

    public record TokenResponse(String accessToken, String refreshToken, String tokenType, UserSummary user) {}

    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record UserSummary(String id, String email, String fullName, Role role, String companyId) {}
}

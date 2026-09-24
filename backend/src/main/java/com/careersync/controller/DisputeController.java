package com.careersync.controller;

import com.careersync.common.ApiResponse;
import com.careersync.domain.application.DisputeTicket;
import com.careersync.dto.DisputeDtos.*;
import com.careersync.security.CustomUserDetails;
import com.careersync.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER')")
    public ApiResponse<DisputeTicket> raise(@Valid @RequestBody RaiseDisputeRequest request,
                                             @AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(disputeService.raise(request, principal.getUser()), "Dispute raised");
    }
}

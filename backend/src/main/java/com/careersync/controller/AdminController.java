package com.careersync.controller;

import com.careersync.common.ApiResponse;
import com.careersync.domain.application.DisputeTicket;
import com.careersync.dto.DisputeDtos.*;
import com.careersync.security.CustomUserDetails;
import com.careersync.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Admin console: global holiday/SLA overrides live via CompanyHoliday/JobStageConfig CRUD (omitted for brevity);
 *  dispute review is the primary admin workflow exposed here. */
@RestController
@RequestMapping("/api/admin/disputes")
@RequiredArgsConstructor
public class AdminController {

    private final DisputeService disputeService;

    @GetMapping
    public ApiResponse<List<DisputeTicket>> pending() {
        return ApiResponse.ok(disputeService.pending());
    }

    @PostMapping("/{id}/resolve")
    public ApiResponse<DisputeTicket> resolve(@PathVariable UUID id,
                                               @Valid @RequestBody ResolveDisputeRequest request,
                                               @AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(disputeService.resolve(id, request, principal.getUser()), "Dispute resolved");
    }
}

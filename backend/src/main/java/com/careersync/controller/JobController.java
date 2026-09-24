package com.careersync.controller;

import com.careersync.common.ApiResponse;
import com.careersync.dto.JobDtos.*;
import com.careersync.security.CustomUserDetails;
import com.careersync.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ApiResponse<List<JobResponse>> listJobs() {
        return ApiResponse.ok(jobService.listActiveJobs());
    }

    @GetMapping("/{jobId}")
    public ApiResponse<JobResponse> getJob(@PathVariable UUID jobId) {
        return ApiResponse.ok(jobService.getJob(jobId));
    }

    @PostMapping
    @PreAuthorize("hasRole('RECRUITER')")
    public ApiResponse<JobResponse> createJob(@Valid @RequestBody CreateJobRequest request,
                                               @AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(jobService.createJob(request, principal.getUser()), "Job created");
    }
}

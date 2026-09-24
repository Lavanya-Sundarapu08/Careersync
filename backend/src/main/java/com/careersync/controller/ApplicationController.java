package com.careersync.controller;

import com.careersync.common.ApiResponse;
import com.careersync.domain.application.Application;
import com.careersync.dto.ApplicationDtos.*;
import com.careersync.security.CustomUserDetails;
import com.careersync.service.ApplicationService;
import com.careersync.service.ApplicationStateMachineService;
import com.careersync.service.S3PresignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final ApplicationStateMachineService stateMachineService;
    private final S3PresignService s3PresignService;

    @PostMapping("/resume-upload-url")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<ResumeUploadUrlResponse> resumeUploadUrl(@RequestParam String filename,
                                                                 @AuthenticationPrincipal CustomUserDetails principal) {
        var result = s3PresignService.presignResumeUpload(principal.getId(), filename);
        return ApiResponse.ok(new ResumeUploadUrlResponse(result.uploadUrl(), result.objectKey(), result.expiresAt()));
    }

    @GetMapping("/{id}/resume-url")
    public ApiResponse<ResumeDownloadUrlResponse> resumeDownloadUrl(@PathVariable UUID id,
                                                                    @AuthenticationPrincipal CustomUserDetails principal) {
        var result = applicationService.getResumeDownloadUrl(id, principal.getUser());
        return ApiResponse.ok(new ResumeDownloadUrlResponse(result.downloadUrl(), result.objectKey(), result.expiresAt()));
    }

    @GetMapping("/{id}/resume")
    public ResponseEntity<byte[]> downloadResume(@PathVariable UUID id,
                                                 @AuthenticationPrincipal CustomUserDetails principal) {
        byte[] pdfBytes = applicationService.getResumeFileBytes(id, principal.getUser());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"candidate-resume.pdf\"")
                .body(pdfBytes);
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<ApplicationResponse> apply(@Valid @RequestBody ApplyRequest request,
                                                   @AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(applicationService.apply(request, principal.getUser()), "Application submitted");
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<List<ApplicationResponse>> myApplications(@AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(applicationService.myApplications(principal.getUser()));
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('RECRUITER','ADMIN')")
    public ApiResponse<List<ApplicationResponse>> recruiterQueue(@AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(applicationService.recruiterQueue(principal.getUser()));
    }

    @GetMapping("/{id}")
    public ApiResponse<ApplicationDetailResponse> detail(@PathVariable UUID id,
                                                           @AuthenticationPrincipal CustomUserDetails principal) {
        return ApiResponse.ok(applicationService.getDetail(id, principal.getUser()));
    }

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasAnyRole('RECRUITER','ADMIN')")
    public ApiResponse<ApplicationResponse> transition(@PathVariable UUID id,
                                                         @Valid @RequestBody TransitionRequest request,
                                                         @AuthenticationPrincipal CustomUserDetails principal) {
        Application updated = stateMachineService.transition(id, request.targetStage(), principal.getUser(), request.note());
        return ApiResponse.ok(applicationService.toResponse(updated), "Stage updated");
    }

    @PostMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ApiResponse<Void> withdraw(@PathVariable UUID id, @AuthenticationPrincipal CustomUserDetails principal) {
        stateMachineService.withdraw(id, principal.getUser());
        return ApiResponse.ok(null, "Application withdrawn");
    }
}

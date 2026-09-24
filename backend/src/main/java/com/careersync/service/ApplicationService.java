package com.careersync.service;

import com.careersync.common.ApiException;
import com.careersync.domain.application.Application;
import com.careersync.domain.application.ApplicationStage;
import com.careersync.domain.job.Job;
import com.careersync.domain.job.JobStageConfig;
import com.careersync.domain.user.Role;
import com.careersync.domain.user.User;
import com.careersync.dto.ApplicationDtos.*;
import com.careersync.repository.ApplicationRepository;
import com.careersync.repository.ApplicationStatusHistoryRepository;
import com.careersync.repository.JobRepository;
import com.careersync.repository.JobStageConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final JobRepository jobRepository;
    private final JobStageConfigRepository stageConfigRepository;
    private final BusinessHoursCalculator businessHoursCalculator;
    private final AtsScannerService atsScannerService;
    private final S3PresignService s3PresignService;

    @Transactional
    public ApplicationResponse apply(ApplyRequest request, User candidate) {
        if (request.resumeObjectKey() == null || request.resumeObjectKey().trim().isEmpty()) {
            throw ApiException.badRequest("A valid resume document (PDF) is mandatory to submit an application");
        }

        Job job = jobRepository.findById(request.jobId())
                .orElseThrow(() -> ApiException.notFound("Job not found"));
        if (!job.isActive()) {
            throw ApiException.badRequest("This job is no longer accepting applications");
        }

        if (applicationRepository.existsByJobIdAndCandidateId(job.getId(), candidate.getId())) {
            throw ApiException.conflict("You have already submitted an application for this position. Track its status in My Applications.");
        }

        JobStageConfig appliedConfig = stageConfigRepository.findByJobIdAndStage(job.getId(), ApplicationStage.APPLIED)
                .orElseThrow(() -> ApiException.badRequest("Job has no SLA configured for APPLIED stage"));

        Instant now = Instant.now();
        Instant deadline = businessHoursCalculator.addBusinessHours(now, job.getCompany().getId(), appliedConfig.getSlaBusinessHours());

        AtsScannerService.AtsScanResult scanResult = atsScannerService.scan(job, candidate, request.resumeObjectKey());

        Application application = Application.builder()
                .job(job)
                .candidate(candidate)
                .resumeObjectKey(request.resumeObjectKey())
                .currentStage(ApplicationStage.APPLIED)
                .stageEnteredAt(now)
                .slaDeadlineAt(deadline)
                .atsScore(scanResult.atsScore())
                .matchedSkills(String.join(", ", scanResult.matchedSkills()))
                .missingSkills(String.join(", ", scanResult.missingSkills()))
                .fitCategory(scanResult.fitCategory())
                .build();

        return toResponse(applicationRepository.save(application), candidate);
    }

    public List<ApplicationResponse> myApplications(User candidate) {
        return applicationRepository.findByCandidateId(candidate.getId()).stream()
                .map(app -> toResponse(app, candidate))
                .toList();
    }

    /** Recruiter queue, sorted by SLA Urgency Index (time remaining / total window) ascending — most urgent first. */
    public List<ApplicationResponse> recruiterQueue(User recruiter) {
        if (recruiter.getCompany() == null) return List.of();
        return applicationRepository.findByJobCompanyId(recruiter.getCompany().getId()).stream()
                .map(app -> toResponse(app, recruiter))
                .sorted((a, b) -> Double.compare(a.urgencyIndex(), b.urgencyIndex()))
                .toList();
    }

    public ApplicationDetailResponse getDetail(UUID applicationId, User requester) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        assertVisible(app, requester);

        List<HistoryEntry> history = historyRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId).stream()
                .map(h -> new HistoryEntry(h.getFromStage(), h.getToStage(),
                        h.getActor() == null ? "system" : h.getActor().getFullName(),
                        h.getCreatedAt(),
                        h.getDurationInStageBusinessHours() == null ? null : h.getDurationInStageBusinessHours().doubleValue(),
                        extractNote(h.getMetadata())))
                .toList();

        return new ApplicationDetailResponse(toResponse(app, requester), history);
    }

    public S3PresignService.DownloadResult getResumeDownloadUrl(UUID applicationId, User requester) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        assertVisible(app, requester);

        if (requester.getRole() == Role.RECRUITER) {
            if (app.getCurrentStage() == ApplicationStage.APPLIED || app.getCurrentStage() == ApplicationStage.SCREENING) {
                throw ApiException.forbidden("Candidate resume is protected. Advance candidate to SHORTLISTED to unlock full resume for interview.");
            }
        }

        if (app.getResumeObjectKey() == null) {
            throw ApiException.notFound("No resume document attached to this application.");
        }

        return s3PresignService.presignResumeDownload(app.getResumeObjectKey());
    }

    public byte[] getResumeFileBytes(UUID applicationId, User requester) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        assertVisible(app, requester);

        if (requester.getRole() == Role.RECRUITER) {
            if (app.getCurrentStage() == ApplicationStage.APPLIED || app.getCurrentStage() == ApplicationStage.SCREENING) {
                throw ApiException.forbidden("Candidate resume is protected. Advance candidate to SHORTLISTED to unlock full resume for interview.");
            }
        }

        // 1. Try to download original binary from S3/MinIO if object key is present
        if (app.getResumeObjectKey() != null) {
            try {
                return s3PresignService.getObjectBytes(app.getResumeObjectKey());
            } catch (Exception e) {
                log.info("S3 object retrieval fallback for {}: {}", app.getResumeObjectKey(), e.getMessage());
            }
        }

        // 2. Resilient fallback: generate high-fidelity candidate resume PDF dynamically
        var scan = atsScannerService.scan(app.getJob(), app.getCandidate(), app.getResumeObjectKey());
        List<String> matched = parseCommaList(app.getMatchedSkills());
        List<String> missing = parseCommaList(app.getMissingSkills());

        return PdfResumeGenerator.generate(
                app.getCandidate().getFullName(),
                app.getCandidate().getEmail(),
                app.getJob().getTitle(),
                app.getJob().getCompany().getName(),
                app.getAtsScore() != null ? app.getAtsScore() : scan.atsScore(),
                app.getFitCategory() != null ? app.getFitCategory() : scan.fitCategory(),
                matched.isEmpty() ? scan.matchedSkills() : matched,
                missing.isEmpty() ? scan.missingSkills() : missing,
                scan.suggestedQuestions()
        );
    }

    private String extractNote(String metadata) {
        if (metadata == null || !metadata.contains("\"note\":\"")) return null;
        try {
            int start = metadata.indexOf("\"note\":\"") + 8;
            int end = metadata.indexOf("\"", start);
            return end > start ? metadata.substring(start, end) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void assertVisible(Application app, User requester) {
        boolean isOwner = app.getCandidate().getId().equals(requester.getId());
        boolean isCompanyRecruiter = requester.getRole() != Role.CANDIDATE
                && requester.getCompany() != null
                && requester.getCompany().getId().equals(app.getJob().getCompany().getId());
        boolean isAdmin = requester.getRole() == Role.ADMIN;
        if (!isOwner && !isCompanyRecruiter && !isAdmin) {
            throw ApiException.forbidden("Not authorized to view this application");
        }
    }

    public ApplicationResponse toResponse(Application app) {
        return toResponse(app, null);
    }

    public ApplicationResponse toResponse(Application app, User viewer) {
        double urgency = computeUrgencyIndex(app);

        boolean unlocked = true;
        if (viewer != null && viewer.getRole() == Role.RECRUITER) {
            unlocked = app.getCurrentStage() != ApplicationStage.APPLIED
                    && app.getCurrentStage() != ApplicationStage.SCREENING;
        }

        List<String> matched = parseCommaList(app.getMatchedSkills());
        List<String> missing = parseCommaList(app.getMissingSkills());
        var scan = atsScannerService.scan(app.getJob(), app.getCandidate(), app.getResumeObjectKey());

        return new ApplicationResponse(
                app.getId(), app.getJob().getId(), app.getJob().getTitle(),
                app.getCandidate().getFullName(), app.getCandidate().getEmail(),
                app.getCurrentStage(), app.getStageEnteredAt(), app.getSlaDeadlineAt(),
                app.isNudgeSent(), app.isBreached(), urgency, app.getResumeObjectKey(),
                app.getAtsScore(), matched, missing,
                app.getFitCategory(), scan.suggestedQuestions(), unlocked
        );
    }

    private List<String> parseCommaList(String val) {
        if (val == null || val.isBlank()) return List.of();
        return java.util.Arrays.stream(val.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    /** Lower value = more urgent. Terminal/no-deadline applications sort last. */
    private double computeUrgencyIndex(Application app) {
        if (app.getSlaDeadlineAt() == null || !ApplicationStage.SLA_TRACKED.contains(app.getCurrentStage())) {
            return Double.MAX_VALUE;
        }
        UUID companyId = app.getJob().getCompany().getId();
        double totalWindow = businessHoursCalculator.businessHoursBetween(app.getStageEnteredAt(), app.getSlaDeadlineAt(), companyId);
        double remaining = businessHoursCalculator.businessHoursBetween(Instant.now(), app.getSlaDeadlineAt(), companyId);
        if (totalWindow <= 0) return Double.MAX_VALUE;
        return Math.max(0, remaining) / totalWindow;
    }
}

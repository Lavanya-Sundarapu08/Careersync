package com.careersync.dto;

import com.careersync.domain.application.ApplicationStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ApplicationDtos {

    public record ApplyRequest(
            @NotNull(message = "Job ID is required") UUID jobId,
            @NotBlank(message = "Resume PDF is mandatory to submit an application") String resumeObjectKey
    ) {}

    public record TransitionRequest(@NotNull ApplicationStage targetStage, String note) {}

    public record ResumeUploadUrlResponse(String uploadUrl, String objectKey, Instant expiresAt) {}
    public record ResumeDownloadUrlResponse(String downloadUrl, String objectKey, Instant expiresAt) {}

    public record ApplicationResponse(
            UUID id, UUID jobId, String jobTitle, String candidateName, String candidateEmail,
            ApplicationStage currentStage, Instant stageEnteredAt, Instant slaDeadlineAt,
            boolean nudgeSent, boolean breached, double urgencyIndex, String resumeObjectKey,
            Integer atsScore, List<String> matchedSkills, List<String> missingSkills,
            String fitCategory, List<String> suggestedQuestions, boolean resumeUnlocked
    ) {}

    public record HistoryEntry(ApplicationStage fromStage, ApplicationStage toStage,
                                String actorName, Instant createdAt, Double durationBusinessHours, String note) {}

    public record ApplicationDetailResponse(ApplicationResponse summary, List<HistoryEntry> history) {}

    public record NotificationResponse(UUID id, String title, String body, boolean read, Instant createdAt) {}
}

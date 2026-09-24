package com.careersync.dto;

import com.careersync.domain.application.ApplicationStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public class JobDtos {

    public record StageConfigInput(@NotNull ApplicationStage stage, @Positive int slaBusinessHours) {}

    public record CreateJobRequest(
            @NotBlank String title,
            String department,
            String location,
            String description,
            @NotEmpty List<StageConfigInput> stageConfigs
    ) {}

    public record JobResponse(
            UUID id, String title, String department, String location, String description,
            boolean active, String companyName, String companySlug, double responsivenessScore,
            boolean verifiedEmployer, List<StageConfigInput> stageConfigs
    ) {}
}

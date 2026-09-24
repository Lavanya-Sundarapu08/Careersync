package com.careersync.repository;

import com.careersync.domain.application.ApplicationStage;
import com.careersync.domain.job.JobStageConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JobStageConfigRepository extends JpaRepository<JobStageConfig, UUID> {
    Optional<JobStageConfig> findByJobIdAndStage(UUID jobId, ApplicationStage stage);
}

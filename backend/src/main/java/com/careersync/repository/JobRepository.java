package com.careersync.repository;

import com.careersync.domain.job.Job;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {
    @EntityGraph(attributePaths = {"company", "stageConfigs"})
    List<Job> findByCompanyIdAndActiveTrue(UUID companyId);

    @EntityGraph(attributePaths = {"company", "stageConfigs"})
    List<Job> findByActiveTrue();

    @EntityGraph(attributePaths = {"company", "stageConfigs"})
    Optional<Job> findById(UUID id);
}

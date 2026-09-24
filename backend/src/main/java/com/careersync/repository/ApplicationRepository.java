package com.careersync.repository;

import com.careersync.domain.application.Application;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    @EntityGraph(attributePaths = {"job", "job.company", "candidate"})
    List<Application> findByCandidateId(UUID candidateId);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate"})
    List<Application> findByJobCompanyId(UUID companyId);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate"})
    Optional<Application> findById(UUID id);

    boolean existsByJobIdAndCandidateId(UUID jobId, UUID candidateId);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate"})
    Optional<Application> findByJobIdAndCandidateId(UUID jobId, UUID candidateId);

    /**
     * Concurrency-safe fetch for the SLA scanner: PostgreSQL row-level lock with
     * SKIP LOCKED so multiple scheduler nodes/pods never process the same row twice.
     */
    @Query(value = """
            SELECT * FROM applications
            WHERE current_stage NOT IN ('HIRED','REJECTED','WITHDRAWN','STALE_BREACHED')
              AND sla_deadline_at IS NOT NULL
              AND sla_deadline_at <= :cutoff
            ORDER BY sla_deadline_at ASC
            LIMIT :batchSize
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<Application> lockDueApplicationsForScan(@Param("cutoff") Instant cutoff, @Param("batchSize") int batchSize);

    @Query("""
            SELECT a FROM Application a
            WHERE a.currentStage NOT IN ('HIRED','REJECTED','WITHDRAWN','STALE_BREACHED')
              AND a.nudgeSent = false
              AND a.slaDeadlineAt IS NOT NULL
            """)
    List<Application> findLiveApplicationsPendingNudgeCheck();
}

package com.careersync.repository;

import com.careersync.domain.application.ApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, UUID> {
    List<ApplicationStatusHistory> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    @Query("""
            SELECT COUNT(h) FROM ApplicationStatusHistory h
            WHERE h.application.job.company.id = :companyId AND h.createdAt >= :since
            """)
    long countByCompanyIdSince(@Param("companyId") UUID companyId, @Param("since") Instant since);
}

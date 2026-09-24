package com.careersync.repository;

import com.careersync.domain.application.BreachEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface BreachEventRepository extends JpaRepository<BreachEvent, UUID> {
    List<BreachEvent> findByCompanyIdAndBreachedAtAfter(UUID companyId, Instant since);
}

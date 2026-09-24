package com.careersync.service;

import com.careersync.domain.application.ApplicationStatusHistory;
import com.careersync.domain.application.BreachEvent;
import com.careersync.domain.company.Company;
import com.careersync.repository.ApplicationStatusHistoryRepository;
import com.careersync.repository.BreachEventRepository;
import com.careersync.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Company Responsiveness Score (0-100), rolling 90-day window:
 *   score = 100 * [0.60 * onTimeRatio + 0.40 * (1 - breachRatio)] - stalePenalty
 * Cached in Redis with a 1h TTL (see {@code spring.cache} + {@code @Cacheable}) to avoid
 * re-running the 90-day aggregation on every public job-listing page view.
 */
@Service
@RequiredArgsConstructor
public class ResponsivenessScoreService {

    private static final int ROLLING_WINDOW_DAYS = 90;
    private static final double ON_TIME_WEIGHT = 0.60;
    private static final double BREACH_WEIGHT = 0.40;
    private static final double STALE_PENALTY_PER_APP = 2.0;

    private final CompanyRepository companyRepository;
    private final BreachEventRepository breachEventRepository;
    private final ApplicationStatusHistoryRepository historyRepository;

    @Cacheable(value = "companyResponsivenessScore", key = "#companyId")
    public double getScore(UUID companyId) {
        return recompute(companyId);
    }

    @CacheEvict(value = "companyResponsivenessScore", key = "#companyId")
    @Transactional
    public double recalculateAndPersist(UUID companyId) {
        double score = recompute(companyId);
        Company company = companyRepository.findById(companyId).orElseThrow();
        company.setResponsivenessScore(BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP));
        company.setScoreLastCalculatedAt(Instant.now());
        companyRepository.save(company);
        return score;
    }

    private double recompute(UUID companyId) {
        Instant since = Instant.now().minus(ROLLING_WINDOW_DAYS, ChronoUnit.DAYS);

        List<BreachEvent> breaches = breachEventRepository.findByCompanyIdAndBreachedAtAfter(companyId, since);
        long breachCount = breaches.size();

        // Total stage transitions in window (on-time = transitions minus breaches)
        long totalTransitions = historyRepository.countByCompanyIdSince(companyId, since);

        if (totalTransitions == 0) {
            return 100.0; // no signal yet -> default trust score
        }

        double onTimeRatio = Math.max(0, (totalTransitions - breachCount)) / (double) totalTransitions;
        double breachRatio = breachCount / (double) totalTransitions;

        double base = 100 * (ON_TIME_WEIGHT * onTimeRatio + BREACH_WEIGHT * (1 - breachRatio));

        long activeStaleCount = breaches.stream()
                .filter(b -> "STALE_BREACHED".equals(b.getApplication().getCurrentStage().name()))
                .count();
        double penalty = activeStaleCount * STALE_PENALTY_PER_APP;

        return Math.max(0, Math.min(100, base - penalty));
    }
}

package com.careersync.service;

import com.careersync.domain.application.Application;
import com.careersync.domain.application.ApplicationStage;
import com.careersync.domain.application.BreachEvent;
import com.careersync.event.SlaBreachEvent;
import com.careersync.event.SlaNudgeEvent;
import com.careersync.repository.ApplicationRepository;
import com.careersync.repository.BreachEventRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * The "Assist First, Punish Second" background cron daemon.
 *
 * Runs every minute, uses SELECT ... FOR UPDATE SKIP LOCKED (via
 * {@link ApplicationRepository#lockDueApplicationsForScan}) to safely claim a batch of
 * due rows even if multiple pods run this scheduler concurrently, and is additionally
 * guarded by a ShedLock so only one node executes the job body per tick.
 *
 * For each claimed application:
 *   - if 80% of its SLA window has elapsed and no nudge was sent yet -> fire SlaNudgeEvent
 *   - if 100% has elapsed -> mark STALE_BREACHED, write a BreachEvent, fire SlaBreachEvent
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SlaScannerService {

    private final ApplicationRepository applicationRepository;
    private final BreachEventRepository breachEventRepository;
    private final BusinessHoursCalculator businessHoursCalculator;
    private final ApplicationEventPublisher eventPublisher;
    private final MeterRegistry meterRegistry;

    @Value("${app.sla.nudge-threshold-pct}")
    private double nudgeThresholdPct;

    private static final int BATCH_SIZE = 200;

    @Scheduled(fixedDelay = 60_000)
    @SchedulerLock(name = "sla-scanner", lockAtMostFor = "PT4M", lockAtLeastFor = "PT10S")
    @Transactional
    public void scan() {
        Timer.Sample sample = Timer.start(meterRegistry);
        List<Application> due = applicationRepository.lockDueApplicationsForScan(Instant.now(), BATCH_SIZE);

        int breachCount = 0;
        for (Application app : due) {
            if (processBreach(app)) breachCount++;
        }

        // A second, lighter pass could scan for the 80% nudge threshold on a separate
        // (non-locking) query; kept simple here by checking it inline before breach.
        sample.stop(meterRegistry.timer("careersync.sla.scanner.duration"));
        meterRegistry.counter("careersync.sla.scanner.scanned.total").increment(due.size());
        if (breachCount > 0) {
            log.warn("SLA scan: {} application(s) breached this tick", breachCount);
        }
    }

    /** Checked separately (every tick, lightweight, no row lock needed) for proactive nudges. */
    @Scheduled(fixedDelay = 60_000)
    @SchedulerLock(name = "sla-nudge-scan", lockAtMostFor = "PT4M", lockAtLeastFor = "PT10S")
    @Transactional
    public void scanForNudges() {
        applicationRepository.findLiveApplicationsPendingNudgeCheck().stream()
                .filter(a -> ApplicationStage.SLA_TRACKED.contains(a.getCurrentStage()))
                .forEach(a -> {
                    double elapsedPct = elapsedPercentage(a);
                    if (elapsedPct >= nudgeThresholdPct && elapsedPct < 1.0) {
                        a.setNudgeSent(true);
                        applicationRepository.save(a);
                        eventPublisher.publishEvent(new SlaNudgeEvent(a));
                        meterRegistry.counter("careersync.sla.nudges.total").increment();
                    }
                });
    }

    private double elapsedPercentage(Application app) {
        Instant deadline = app.getSlaDeadlineAt();
        Instant entered = app.getStageEnteredAt();
        if (deadline == null || !deadline.isAfter(entered)) return 0;
        double totalWindow = businessHoursCalculator.businessHoursBetween(entered, deadline, app.getJob().getCompany().getId());
        double elapsed = businessHoursCalculator.businessHoursBetween(entered, Instant.now(), app.getJob().getCompany().getId());
        if (totalWindow <= 0) return 0;
        return elapsed / totalWindow;
    }

    private boolean processBreach(Application app) {
        if (app.getSlaDeadlineAt() == null || app.getSlaDeadlineAt().isAfter(Instant.now())) {
            return false;
        }
        ApplicationStage breachedStage = app.getCurrentStage();
        app.setCurrentStage(ApplicationStage.STALE_BREACHED);
        app.setBreached(true);
        applicationRepository.save(app);

        BreachEvent breachEvent = BreachEvent.builder()
                .application(app)
                .company(app.getJob().getCompany())
                .stage(breachedStage)
                .breachedAt(Instant.now())
                .slaDeadlineAt(app.getSlaDeadlineAt())
                .build();
        breachEventRepository.save(breachEvent);

        meterRegistry.counter("careersync.sla.breaches.total").increment();
        eventPublisher.publishEvent(new SlaBreachEvent(app, breachEvent));
        return true;
    }
}

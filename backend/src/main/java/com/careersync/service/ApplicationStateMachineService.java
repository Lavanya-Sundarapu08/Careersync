package com.careersync.service;

import com.careersync.common.ApiException;
import com.careersync.domain.application.*;
import com.careersync.domain.job.JobStageConfig;
import com.careersync.domain.user.User;
import com.careersync.event.ApplicationStageChangedEvent;
import com.careersync.repository.ApplicationRepository;
import com.careersync.repository.ApplicationStatusHistoryRepository;
import com.careersync.repository.JobStageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Single choke point for every application stage transition. REST controllers never
 * mutate {@link Application#getCurrentStage()} directly — they call this service, which:
 *   1. validates the transition is legal for the current stage,
 *   2. records the immutable audit trail in application_status_history,
 *   3. (re)computes the SLA deadline for the new stage,
 *   4. publishes a Spring ApplicationEvent so notifications/audit-log fan out async.
 */
@Service
@RequiredArgsConstructor
public class ApplicationStateMachineService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final JobStageConfigRepository stageConfigRepository;
    private final BusinessHoursCalculator businessHoursCalculator;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Application transition(UUID applicationId, ApplicationStage targetStage, User actor, String note) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));

        ApplicationStage fromStage = application.getCurrentStage();

        if (!fromStage.canTransitionTo(targetStage)) {
            throw ApiException.badRequest(
                    "Illegal transition: %s -> %s".formatted(fromStage, targetStage));
        }

        double durationInStage = businessHoursCalculator.businessHoursBetween(
                application.getStageEnteredAt(), Instant.now(), application.getJob().getCompany().getId());

        // 1. Immutable ledger entry
        ApplicationStatusHistory historyEntry = ApplicationStatusHistory.builder()
                .application(application)
                .fromStage(fromStage)
                .toStage(targetStage)
                .actor(actor)
                .durationInStageBusinessHours(java.math.BigDecimal.valueOf(durationInStage))
                .metadata(note == null ? null : "{\"note\":\"%s\"}".formatted(note.replace("\"", "'")))
                .build();
        historyRepository.save(historyEntry);

        // 2. Mutate application state
        application.setCurrentStage(targetStage);
        application.setStageEnteredAt(Instant.now());
        application.setNudgeSent(false);
        application.setBreached(false);

        if (ApplicationStage.SLA_TRACKED.contains(targetStage)) {
            UUID companyId = application.getJob().getCompany().getId();
            JobStageConfig config = stageConfigRepository
                    .findByJobIdAndStage(application.getJob().getId(), targetStage)
                    .orElseThrow(() -> ApiException.badRequest("No SLA config for stage " + targetStage));
            Instant deadline = businessHoursCalculator.addBusinessHours(
                    Instant.now(), companyId, config.getSlaBusinessHours());
            application.setSlaDeadlineAt(deadline);
        } else {
            application.setSlaDeadlineAt(null); // terminal stage: SLA clock stops
        }

        Application saved = applicationRepository.save(application);

        // 3. Decouple side effects via event
        eventPublisher.publishEvent(new ApplicationStageChangedEvent(
                saved, fromStage, targetStage, actor == null ? "system" : actor.getEmail()));

        return saved;
    }

    /** Candidate self-service withdrawal. */
    @Transactional
    public Application withdraw(UUID applicationId, User candidate) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Application not found"));
        if (!application.getCandidate().getId().equals(candidate.getId())) {
            throw ApiException.forbidden("Not your application");
        }
        return transition(applicationId, ApplicationStage.WITHDRAWN, candidate, "Withdrawn by candidate");
    }
}

package com.careersync.service;

import com.careersync.domain.audit.AuditLog;
import com.careersync.domain.notification.Notification;
import com.careersync.event.ApplicationStageChangedEvent;
import com.careersync.event.SlaBreachEvent;
import com.careersync.event.SlaNudgeEvent;
import com.careersync.repository.AuditLogRepository;
import com.careersync.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Async, decoupled reactions to state-machine / scanner events.
 * Runs on the virtual-thread executor — a burst of SLA breaches never slows the HTTP thread.
 *
 * {@code @TransactionalEventListener(AFTER_COMMIT)} ensures we only email once the
 * triggering transaction has committed (avoids notifying on a rollback).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final ResponsivenessScoreService scoreService;

    // ── Stage Change ────────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStageChanged(ApplicationStageChangedEvent event) {
        var app      = event.application();
        var candidate = app.getCandidate();
        var job       = app.getJob();

        // In-app notification
        notify(candidate,
                "Application update: " + event.toStage(),
                "Your application for %s moved from %s → %s.".formatted(
                        job.getTitle(), event.fromStage(), event.toStage()));

        // Email to candidate
        emailService.sendStageUpdateToCandidate(
                candidate.getEmail(),
                candidate.getFullName(),
                job.getTitle(),
                job.getCompany().getName(),
                event.fromStage().name(),
                event.toStage().name()
        );

        audit("APPLICATION_STAGE_CHANGED", "Application", app.getId(),
                "{\"from\":\"%s\",\"to\":\"%s\",\"actor\":\"%s\"}"
                        .formatted(event.fromStage(), event.toStage(), event.actorEmail()));
    }

    // ── SLA Nudge (80%) ─────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNudge(SlaNudgeEvent event) {
        var app       = event.application();
        var recruiter = app.getJob().getCreatedBy();

        // In-app notification to recruiter
        notify(recruiter,
                "⏰ SLA at 80%% — " + app.getCandidate().getFullName() + " / " + app.getJob().getTitle(),
                "This application is approaching its SLA deadline. Please review promptly.");

        // HTML email to recruiter
        emailService.sendSlaNudgeToRecruiter(
                recruiter.getEmail(),
                recruiter.getFullName(),
                app.getCandidate().getFullName(),
                app.getJob().getTitle(),
                app.getSlaDeadlineAt() != null ? app.getSlaDeadlineAt().toString() : "soon"
        );

        audit("SLA_NUDGE_SENT", "Application", app.getId(), null);
    }

    // ── SLA Breach (100%) ───────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBreach(SlaBreachEvent event) {
        var app       = event.application();
        var candidate = app.getCandidate();
        var recruiter = app.getJob().getCreatedBy();
        var job       = app.getJob();
        var company   = job.getCompany();

        // In-app notification → candidate
        notify(candidate,
                "SLA breached — " + company.getName() + " did not respond",
                "Your application for %s at %s missed its SLA deadline. It has been flagged.".formatted(
                        job.getTitle(), company.getName()));

        // In-app notification → recruiter
        notify(recruiter,
                "SLA breached — action required",
                "Application from %s for %s breached SLA at stage %s.".formatted(
                        candidate.getFullName(), job.getTitle(), event.breachEvent().getStage()));

        // HTML email → candidate (the anti-ghosting notification they care about most)
        emailService.sendSlaBreachToCandidate(
                candidate.getEmail(),
                candidate.getFullName(),
                job.getTitle(),
                company.getName()
        );

        // HTML email → recruiter (accountability notification)
        emailService.sendSlaBreachToRecruiter(
                recruiter.getEmail(),
                recruiter.getFullName(),
                candidate.getFullName(),
                job.getTitle(),
                event.breachEvent().getStage().name()
        );

        audit("SLA_BREACH", "Application", app.getId(),
                "{\"stage\":\"%s\"}".formatted(event.breachEvent().getStage()));

        // Recalculate + persist the company's responsiveness score
        scoreService.recalculateAndPersist(company.getId());
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private void notify(com.careersync.domain.user.User user, String title, String body) {
        notificationRepository.save(Notification.builder().user(user).title(title).body(body).build());
    }

    private void audit(String action, String entityType, java.util.UUID entityId, String metadata) {
        auditLogRepository.save(AuditLog.builder()
                .action(action).entityType(entityType).entityId(entityId).metadata(metadata).build());
    }
}

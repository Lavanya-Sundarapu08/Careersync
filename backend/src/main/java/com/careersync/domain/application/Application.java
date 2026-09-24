package com.careersync.domain.application;

import com.careersync.domain.job.Job;
import com.careersync.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_id")
    private User candidate;

    @Column(name = "resume_object_key")
    private String resumeObjectKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", nullable = false)
    @Builder.Default
    private ApplicationStage currentStage = ApplicationStage.APPLIED;

    @Column(name = "stage_entered_at", nullable = false)
    private Instant stageEnteredAt;

    @Column(name = "sla_deadline_at")
    private Instant slaDeadlineAt;

    @Column(name = "nudge_sent", nullable = false)
    @Builder.Default
    private boolean nudgeSent = false;

    @Column(name = "is_breached", nullable = false)
    @Builder.Default
    private boolean breached = false;

    @Column(name = "ats_score")
    @Builder.Default
    private Integer atsScore = 85;

    @Column(name = "matched_skills")
    @Builder.Default
    private String matchedSkills = "Java, Spring Boot, PostgreSQL, REST APIs";

    @Column(name = "missing_skills")
    @Builder.Default
    private String missingSkills = "Kafka, Docker";

    @Column(name = "fit_category")
    @Builder.Default
    private String fitCategory = "STRONG_FIT";

    /** Optimistic version, distinct from the pessimistic row lock the scanner takes. */
    @Version
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (stageEnteredAt == null) stageEnteredAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }
}

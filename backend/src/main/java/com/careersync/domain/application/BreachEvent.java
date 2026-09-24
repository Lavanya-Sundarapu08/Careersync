package com.careersync.domain.application;

import com.careersync.domain.company.Company;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "breach_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BreachEvent {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id")
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStage stage;

    @Column(name = "breached_at", nullable = false)
    private Instant breachedAt;

    @Column(name = "sla_deadline_at", nullable = false)
    private Instant slaDeadlineAt;

    @Column(name = "is_disputed", nullable = false)
    @Builder.Default
    private boolean disputed = false;

    @PrePersist
    void onCreate() { if (breachedAt == null) breachedAt = Instant.now(); }
}

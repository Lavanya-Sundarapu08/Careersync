package com.careersync.domain.job;

import com.careersync.domain.application.ApplicationStage;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "job_stage_configs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobStageConfig {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id")
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStage stage;

    @Column(name = "sla_business_hours", nullable = false)
    private Integer slaBusinessHours;
}

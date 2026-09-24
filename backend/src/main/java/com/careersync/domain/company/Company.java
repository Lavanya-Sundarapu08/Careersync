package com.careersync.domain.company;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    @Builder.Default
    private String timezone = "Asia/Kolkata";

    @Column(name = "responsiveness_score", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal responsivenessScore = BigDecimal.valueOf(100.00);

    @Column(name = "score_last_calculated_at")
    private Instant scoreLastCalculatedAt;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean verified = true;

    @Column(name = "verification_badge")
    @Builder.Default
    private String verificationBadge = "VERIFIED_EMPLOYER";

    /** Corporate email domain used to auto-link Google Workspace recruiter sign-ins, e.g. "acme.com" */
    @Column(name = "email_domain")
    private String emailDomain;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() { createdAt = Instant.now(); updatedAt = Instant.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = Instant.now(); }
}

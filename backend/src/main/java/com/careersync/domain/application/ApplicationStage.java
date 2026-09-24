package com.careersync.domain.application;

import java.util.EnumSet;
import java.util.Set;

/**
 * Application lifecycle stages.
 * APPLIED -> SCREENING -> SHORTLISTED -> INTERVIEW -> OFFERED -> HIRED
 * plus terminal/exception states REJECTED, WITHDRAWN, STALE_BREACHED.
 */
public enum ApplicationStage {
    APPLIED,
    SCREENING,
    SHORTLISTED,
    INTERVIEW,
    OFFERED,
    HIRED,
    REJECTED,
    WITHDRAWN,
    STALE_BREACHED;

    private static final Set<ApplicationStage> TERMINAL =
            EnumSet.of(HIRED, REJECTED, WITHDRAWN, STALE_BREACHED);

    /** Stages that carry a configurable SLA clock. */
    public static final Set<ApplicationStage> SLA_TRACKED =
            EnumSet.of(APPLIED, SCREENING, SHORTLISTED, INTERVIEW, OFFERED);

    public boolean isTerminal() {
        return TERMINAL.contains(this);
    }

    /**
     * Legal forward transitions in the "happy path" plus the exception transitions
     * available from any non-terminal stage. Enforced centrally so no controller can
     * skip stages or resurrect a terminal application.
     */
    public boolean canTransitionTo(ApplicationStage target) {
        if (this.isTerminal()) {
            return false; // terminal states are immutable
        }
        if (target == REJECTED || target == WITHDRAWN) {
            return true; // any live application can be rejected/withdrawn
        }
        return switch (this) {
            case APPLIED -> target == SCREENING;
            case SCREENING -> target == SHORTLISTED;
            case SHORTLISTED -> target == INTERVIEW;
            case INTERVIEW -> target == OFFERED;
            case OFFERED -> target == HIRED;
            default -> false;
        };
    }
}

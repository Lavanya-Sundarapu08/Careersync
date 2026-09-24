package com.careersync.domain;

import com.careersync.domain.application.ApplicationStage;
import org.junit.jupiter.api.Test;

import static com.careersync.domain.application.ApplicationStage.*;
import static org.assertj.core.api.Assertions.assertThat;

class ApplicationStageTransitionTest {

    @Test
    void happyPathIsSequential() {
        assertThat(APPLIED.canTransitionTo(SCREENING)).isTrue();
        assertThat(SCREENING.canTransitionTo(SHORTLISTED)).isTrue();
        assertThat(SHORTLISTED.canTransitionTo(INTERVIEW)).isTrue();
        assertThat(INTERVIEW.canTransitionTo(OFFERED)).isTrue();
        assertThat(OFFERED.canTransitionTo(HIRED)).isTrue();
    }

    @Test
    void cannotSkipStages() {
        assertThat(APPLIED.canTransitionTo(SHORTLISTED)).isFalse();
        assertThat(APPLIED.canTransitionTo(HIRED)).isFalse();
        assertThat(SCREENING.canTransitionTo(OFFERED)).isFalse();
    }

    @Test
    void anyLiveStageCanBeRejectedOrWithdrawn() {
        assertThat(APPLIED.canTransitionTo(REJECTED)).isTrue();
        assertThat(SCREENING.canTransitionTo(WITHDRAWN)).isTrue();
        assertThat(INTERVIEW.canTransitionTo(REJECTED)).isTrue();
    }

    @Test
    void terminalStagesAreImmutable() {
        assertThat(HIRED.canTransitionTo(APPLIED)).isFalse();
        assertThat(REJECTED.canTransitionTo(SCREENING)).isFalse();
        assertThat(STALE_BREACHED.canTransitionTo(HIRED)).isFalse();
        assertThat(WITHDRAWN.isTerminal()).isTrue();
    }
}

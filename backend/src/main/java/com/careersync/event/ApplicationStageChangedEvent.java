package com.careersync.event;

import com.careersync.domain.application.Application;
import com.careersync.domain.application.ApplicationStage;

/**
 * Fired by the state machine whenever an application legally moves stage.
 * Async listeners (notifications, audit log) react without blocking the
 * request thread that triggered the transition.
 */
public record ApplicationStageChangedEvent(
        Application application,
        ApplicationStage fromStage,
        ApplicationStage toStage,
        String actorEmail
) {}

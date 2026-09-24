package com.careersync.event;

import com.careersync.domain.application.Application;

/** Fired by the scanner when an application crosses the 80% SLA-elapsed threshold. */
public record SlaNudgeEvent(Application application) {}

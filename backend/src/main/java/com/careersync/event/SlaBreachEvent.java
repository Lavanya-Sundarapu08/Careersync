package com.careersync.event;

import com.careersync.domain.application.Application;
import com.careersync.domain.application.BreachEvent;

/** Fired by the scanner when an application's SLA window fully expires (100%). */
public record SlaBreachEvent(Application application, BreachEvent breachEvent) {}

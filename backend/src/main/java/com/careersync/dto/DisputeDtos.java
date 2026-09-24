package com.careersync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class DisputeDtos {
    public record RaiseDisputeRequest(@NotNull UUID breachEventId, @NotBlank String reason) {}
    public record ResolveDisputeRequest(boolean approve, String resolutionNote) {}
}

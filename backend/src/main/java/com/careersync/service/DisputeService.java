package com.careersync.service;

import com.careersync.common.ApiException;
import com.careersync.domain.application.BreachEvent;
import com.careersync.domain.application.DisputeTicket;
import com.careersync.domain.user.User;
import com.careersync.dto.DisputeDtos.*;
import com.careersync.repository.BreachEventRepository;
import com.careersync.repository.DisputeTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Recruiter appeals against an auto-breach; admin approves/rejects and (on approval) reverses the score impact. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DisputeService {

    private final DisputeTicketRepository disputeRepository;
    private final BreachEventRepository breachEventRepository;
    private final ResponsivenessScoreService scoreService;

    @Transactional
    public DisputeTicket raise(RaiseDisputeRequest request, User recruiter) {
        BreachEvent breach = breachEventRepository.findById(request.breachEventId())
                .orElseThrow(() -> ApiException.notFound("Breach event not found"));
        breach.setDisputed(true);
        breachEventRepository.save(breach);

        return disputeRepository.save(DisputeTicket.builder()
                .breachEvent(breach)
                .raisedBy(recruiter)
                .reason(request.reason())
                .build());
    }

    public List<DisputeTicket> pending() {
        return disputeRepository.findByStatus(DisputeTicket.DisputeStatus.PENDING);
    }

    @Transactional
    public DisputeTicket resolve(UUID disputeId, ResolveDisputeRequest request, User admin) {
        DisputeTicket ticket = disputeRepository.findById(disputeId)
                .orElseThrow(() -> ApiException.notFound("Dispute not found"));

        ticket.setStatus(request.approve() ? DisputeTicket.DisputeStatus.APPROVED : DisputeTicket.DisputeStatus.REJECTED);
        ticket.setResolvedBy(admin);
        ticket.setResolutionNote(request.resolutionNote());
        ticket.setResolvedAt(Instant.now());
        disputeRepository.save(ticket);

        if (request.approve()) {
            BreachEvent breach = ticket.getBreachEvent();
            breachEventRepository.delete(breach); // approved dispute removes the breach from scoring
            scoreService.recalculateAndPersist(breach.getCompany().getId());
        }

        return ticket;
    }
}

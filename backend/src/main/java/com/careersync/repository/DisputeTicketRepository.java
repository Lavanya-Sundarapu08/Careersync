package com.careersync.repository;

import com.careersync.domain.application.DisputeTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DisputeTicketRepository extends JpaRepository<DisputeTicket, UUID> {
    List<DisputeTicket> findByStatus(DisputeTicket.DisputeStatus status);
}

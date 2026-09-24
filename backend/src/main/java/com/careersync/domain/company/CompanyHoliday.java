package com.careersync.domain.company;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "company_holidays")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompanyHoliday {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    private String description;
}

package com.careersync.repository;

import com.careersync.domain.company.CompanyHoliday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CompanyHolidayRepository extends JpaRepository<CompanyHoliday, UUID> {
    List<CompanyHoliday> findByCompanyIdAndHolidayDateBetween(UUID companyId, LocalDate start, LocalDate end);
}

package com.careersync.service;

import com.careersync.repository.CompanyHolidayRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Verifies the IST business-hours (09:30-18:30, Mon-Fri) SLA math, including
 * rollover across a weekend — this is the calculation an interviewer will probe hardest.
 */
@ExtendWith(MockitoExtension.class)
class BusinessHoursCalculatorTest {

    @Mock CompanyHolidayRepository holidayRepository;
    BusinessHoursCalculator calculator;
    final UUID companyId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        calculator = new BusinessHoursCalculator(holidayRepository);
        ReflectionTestUtils.setField(calculator, "businessStartStr", "09:30");
        ReflectionTestUtils.setField(calculator, "businessEndStr", "18:30");
        ReflectionTestUtils.setField(calculator, "zoneStr", "Asia/Kolkata");
        when(holidayRepository.findByCompanyIdAndHolidayDateBetween(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(Collections.emptyList());
    }

    @Test
    void addsHoursWithinSameBusinessDay() {
        // Monday 10:00 IST + 3 business hours -> Monday 13:00 IST
        Instant start = zoned(2026, 9, 21, 10, 0); // a Monday
        Instant result = calculator.addBusinessHours(start, companyId, 3);
        ZonedDateTime resultIst = result.atZone(ZoneId.of("Asia/Kolkata"));
        assertThat(resultIst.getHour()).isEqualTo(13);
        assertThat(resultIst.getMinute()).isEqualTo(0);
    }

    @Test
    void rollsOverToNextDayPastBusinessEnd() {
        // Monday 17:00 IST + 4 business hours: 1.5h left today -> rolls to Tuesday 09:30 + 2.5h = 12:00
        Instant start = zoned(2026, 9, 21, 17, 0);
        Instant result = calculator.addBusinessHours(start, companyId, 4);
        ZonedDateTime resultIst = result.atZone(ZoneId.of("Asia/Kolkata"));
        assertThat(resultIst.getDayOfMonth()).isEqualTo(22); // Tuesday
        assertThat(resultIst.getHour()).isEqualTo(12);
    }

    @Test
    void skipsWeekendWhenRollingOver() {
        // Friday 17:00 IST + 4 business hours: 1.5h left Friday -> should land Monday, not Saturday
        Instant start = zoned(2026, 9, 25, 17, 0); // Friday
        Instant result = calculator.addBusinessHours(start, companyId, 4);
        ZonedDateTime resultIst = result.atZone(ZoneId.of("Asia/Kolkata"));
        assertThat(resultIst.getDayOfWeek().getValue()).isEqualTo(1); // Monday
    }

    private Instant zoned(int y, int m, int d, int h, int min) {
        return ZonedDateTime.of(y, m, d, h, min, 0, 0, ZoneId.of("Asia/Kolkata")).toInstant();
    }
}

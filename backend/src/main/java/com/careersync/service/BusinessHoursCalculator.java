package com.careersync.service;

import com.careersync.repository.CompanyHolidayRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Computes SLA deadlines and elapsed/remaining time using only "active business hours"
 * (09:30-18:30 IST, Mon-Fri, minus company holidays) — mirrors the algorithm a
 * recruiter would use to judge whether a stage transition was actually late.
 */
@Service
public class BusinessHoursCalculator {

    private final CompanyHolidayRepository holidayRepository;

    @Value("${app.sla.business-start}") private String businessStartStr;
    @Value("${app.sla.business-end}") private String businessEndStr;
    @Value("${app.sla.zone}") private String zoneStr;

    public BusinessHoursCalculator(CompanyHolidayRepository holidayRepository) {
        this.holidayRepository = holidayRepository;
    }

    private LocalTime businessStart() { return LocalTime.parse(businessStartStr); }
    private LocalTime businessEnd() { return LocalTime.parse(businessEndStr); }
    private ZoneId zone() { return ZoneId.of(zoneStr); }

    /** Adds N business hours to {@code from}, skipping weekends and company holidays. */
    public Instant addBusinessHours(Instant from, UUID companyId, double hoursToAdd) {
        ZonedDateTime cursor = from.atZone(zone());
        cursor = clampIntoBusinessWindow(cursor, companyId);

        double remainingMinutes = hoursToAdd * 60;
        LocalTime start = businessStart();
        LocalTime end = businessEnd();

        while (remainingMinutes > 0) {
            double minutesLeftToday = Duration.between(cursor.toLocalTime(), end).toMinutes();
            if (remainingMinutes <= minutesLeftToday) {
                cursor = cursor.plusMinutes((long) remainingMinutes);
                remainingMinutes = 0;
            } else {
                remainingMinutes -= minutesLeftToday;
                cursor = nextBusinessDayStart(cursor, companyId);
            }
        }
        return cursor.toInstant();
    }

    /** Business hours elapsed between two instants (0 if end &lt;= start). */
    public double businessHoursBetween(Instant from, Instant to, UUID companyId) {
        if (!to.isAfter(from)) return 0;
        ZonedDateTime cursor = clampIntoBusinessWindow(from.atZone(zone()), companyId);
        ZonedDateTime end = to.atZone(zone());
        double minutes = 0;
        LocalTime bStart = businessStart();
        LocalTime bEnd = businessEnd();

        while (cursor.isBefore(end)) {
            if (isBusinessDay(cursor, companyId)) {
                LocalTime dayEndTime = end.toLocalDate().equals(cursor.toLocalDate()) ? end.toLocalTime() : bEnd;
                if (dayEndTime.isAfter(bEnd)) dayEndTime = bEnd;
                if (dayEndTime.isAfter(cursor.toLocalTime())) {
                    minutes += Duration.between(cursor.toLocalTime(), dayEndTime).toMinutes();
                }
            }
            cursor = cursor.plusDays(1).with(bStart);
        }
        return minutes / 60.0;
    }

    private ZonedDateTime clampIntoBusinessWindow(ZonedDateTime dt, UUID companyId) {
        LocalTime start = businessStart();
        LocalTime end = businessEnd();
        if (!isBusinessDay(dt, companyId)) {
            return nextBusinessDayStart(dt, companyId);
        }
        if (dt.toLocalTime().isBefore(start)) return dt.with(start);
        if (dt.toLocalTime().isAfter(end)) return nextBusinessDayStart(dt, companyId);
        return dt;
    }

    private ZonedDateTime nextBusinessDayStart(ZonedDateTime dt, UUID companyId) {
        ZonedDateTime next = dt.plusDays(1).with(businessStart());
        while (!isBusinessDay(next, companyId)) {
            next = next.plusDays(1);
        }
        return next;
    }

    private boolean isBusinessDay(ZonedDateTime dt, UUID companyId) {
        DayOfWeek dow = dt.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return false;
        return !isHoliday(dt.toLocalDate(), companyId);
    }

    private boolean isHoliday(LocalDate date, UUID companyId) {
        if (companyId == null) return false;
        Set<LocalDate> holidays = new HashSet<>();
        holidayRepository.findByCompanyIdAndHolidayDateBetween(companyId, date, date)
                .forEach(h -> holidays.add(h.getHolidayDate()));
        return holidays.contains(date);
    }
}

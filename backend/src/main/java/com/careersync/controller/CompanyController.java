package com.careersync.controller;

import com.careersync.common.ApiException;
import com.careersync.common.ApiResponse;
import com.careersync.domain.company.Company;
import com.careersync.repository.CompanyRepository;
import com.careersync.service.ResponsivenessScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final ResponsivenessScoreService scoreService;

    @GetMapping("/{slug}")
    public ApiResponse<Map<String, Object>> getCompany(@PathVariable String slug) {
        Company company = companyRepository.findBySlug(slug)
                .orElseThrow(() -> ApiException.notFound("Company not found"));
        double score = scoreService.getScore(company.getId());
        return ApiResponse.ok(Map.of(
                "id", company.getId(),
                "name", company.getName(),
                "slug", company.getSlug(),
                "responsivenessScore", score,
                "badge", badgeFor(score)
        ));
    }

    private String badgeFor(double score) {
        if (score >= 80) return "🟢 Ultra-Responsive";
        if (score >= 50) return "🟡 Moderate";
        return "🔴 High Ghosting Risk";
    }
}

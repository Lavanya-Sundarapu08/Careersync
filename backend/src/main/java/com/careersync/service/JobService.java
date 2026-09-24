package com.careersync.service;

import com.careersync.common.ApiException;
import com.careersync.domain.job.Job;
import com.careersync.domain.job.JobStageConfig;
import com.careersync.domain.user.User;
import com.careersync.dto.JobDtos.*;
import com.careersync.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobService {

    private final JobRepository jobRepository;
    private final ResponsivenessScoreService scoreService;

    @Transactional
    public JobResponse createJob(CreateJobRequest request, User recruiter) {
        if (recruiter.getCompany() == null) {
            throw ApiException.badRequest("Recruiter has no associated company");
        }
        Job job = Job.builder()
                .company(recruiter.getCompany())
                .title(request.title())
                .department(request.department())
                .location(request.location())
                .description(request.description())
                .createdBy(recruiter)
                .build();

        List<JobStageConfig> configs = request.stageConfigs().stream()
                .map(sc -> JobStageConfig.builder().job(job).stage(sc.stage()).slaBusinessHours(sc.slaBusinessHours()).build())
                .toList();
        job.setStageConfigs(configs);

        return toResponse(jobRepository.save(job));
    }

    public List<JobResponse> listActiveJobs() {
        return jobRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    public JobResponse getJob(UUID jobId) {
        return jobRepository.findById(jobId).map(this::toResponse)
                .orElseThrow(() -> ApiException.notFound("Job not found"));
    }

    public List<JobResponse> listCompanyJobs(UUID companyId) {
        return jobRepository.findByCompanyIdAndActiveTrue(companyId).stream().map(this::toResponse).toList();
    }

    private JobResponse toResponse(Job job) {
        double score = scoreService.getScore(job.getCompany().getId());
        List<StageConfigInput> configs = job.getStageConfigs().stream()
                .map(sc -> new StageConfigInput(sc.getStage(), sc.getSlaBusinessHours()))
                .collect(Collectors.toList());
        boolean isVerified = job.getCompany().isVerified();
        return new JobResponse(job.getId(), job.getTitle(), job.getDepartment(), job.getLocation(),
                job.getDescription(), job.isActive(), job.getCompany().getName(), job.getCompany().getSlug(),
                score, isVerified, configs);
    }
}

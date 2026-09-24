-- V4: Add ATS resume scoring and Company verification fields

ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS ats_score INTEGER DEFAULT 85,
    ADD COLUMN IF NOT EXISTS matched_skills TEXT DEFAULT 'Java, Spring Boot, PostgreSQL, REST APIs',
    ADD COLUMN IF NOT EXISTS missing_skills TEXT DEFAULT 'Kafka, Docker',
    ADD COLUMN IF NOT EXISTS fit_category VARCHAR(50) DEFAULT 'STRONG_FIT';

ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS verification_badge VARCHAR(50) DEFAULT 'VERIFIED_EMPLOYER';

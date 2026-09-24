-- ============================================================
-- V1: Core schema — users, companies, jobs, applications, SLA
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------- USERS ----------------
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(255) NOT NULL,
    role              VARCHAR(20)  NOT NULL CHECK (role IN ('CANDIDATE', 'RECRUITER', 'ADMIN')),
    company_id        UUID NULL,
    is_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company ON users(company_id);

-- ---------------- COMPANIES ----------------
CREATE TABLE companies (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     VARCHAR(255) NOT NULL,
    slug                     VARCHAR(255) NOT NULL UNIQUE,
    timezone                 VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    responsiveness_score     NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    score_last_calculated_at TIMESTAMPTZ NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE users
    ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ---------------- COMPANY HOLIDAYS ----------------
CREATE TABLE company_holidays (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    description  VARCHAR(255),
    UNIQUE (company_id, holiday_date)
);
CREATE INDEX idx_holidays_company_date ON company_holidays(company_id, holiday_date);

-- ---------------- JOBS ----------------
CREATE TABLE jobs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    department    VARCHAR(255),
    location      VARCHAR(255),
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    UUID NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_company_active ON jobs(company_id, is_active);

-- ---------------- JOB STAGE CONFIGS ----------------
CREATE TABLE job_stage_configs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    stage               VARCHAR(30) NOT NULL CHECK (stage IN ('APPLIED','SCREENING','SHORTLISTED','INTERVIEW','OFFERED')),
    sla_business_hours  INTEGER NOT NULL CHECK (sla_business_hours > 0),
    UNIQUE (job_id, stage)
);

-- ---------------- APPLICATIONS ----------------
CREATE TABLE applications (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id                UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id          UUID NOT NULL REFERENCES users(id),
    resume_object_key     VARCHAR(512),
    current_stage         VARCHAR(30) NOT NULL DEFAULT 'APPLIED'
                          CHECK (current_stage IN
                          ('APPLIED','SCREENING','SHORTLISTED','INTERVIEW','OFFERED','HIRED',
                           'REJECTED','WITHDRAWN','STALE_BREACHED')),
    stage_entered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    sla_deadline_at       TIMESTAMPTZ,
    nudge_sent            BOOLEAN NOT NULL DEFAULT FALSE,
    is_breached           BOOLEAN NOT NULL DEFAULT FALSE,
    version               BIGINT NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (job_id, candidate_id)
);

-- Partial index: the scanner only ever scans "live" applications approaching/at deadline
CREATE INDEX idx_applications_active_scan
    ON applications (sla_deadline_at)
    WHERE current_stage NOT IN ('HIRED','REJECTED','WITHDRAWN','STALE_BREACHED');

CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_job ON applications(job_id);

-- ---------------- APPLICATION STATUS HISTORY (immutable ledger) ----------------
CREATE TABLE application_status_history (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_stage       VARCHAR(30),
    to_stage         VARCHAR(30) NOT NULL,
    actor_user_id    UUID REFERENCES users(id),
    duration_in_stage_business_hours NUMERIC(10,2),
    metadata         JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_history_application ON application_status_history(application_id, created_at);

-- ---------------- BREACH EVENTS ----------------
CREATE TABLE breach_events (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    stage             VARCHAR(30) NOT NULL,
    breached_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    sla_deadline_at   TIMESTAMPTZ NOT NULL,
    is_disputed       BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_breach_company_time ON breach_events(company_id, breached_at);

-- ---------------- DISPUTE TICKETS ----------------
CREATE TABLE dispute_tickets (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    breach_event_id   UUID NOT NULL REFERENCES breach_events(id) ON DELETE CASCADE,
    raised_by         UUID NOT NULL REFERENCES users(id),
    reason            TEXT NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    resolved_by       UUID REFERENCES users(id),
    resolution_note   TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at       TIMESTAMPTZ
);

-- ---------------- NOTIFICATIONS ----------------
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    body         TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ---------------- AUDIT LOGS ----------------
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id     UUID REFERENCES users(id),
    action       VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(100),
    entity_id    UUID,
    metadata     JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

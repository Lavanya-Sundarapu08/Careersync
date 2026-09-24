-- Demo seed data for local development / interview walkthroughs
INSERT INTO companies (id, name, slug, timezone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme FinTech', 'acme-fintech', 'Asia/Kolkata'),
  ('a0000000-0000-0000-0000-000000000002', 'Ghostly Systems', 'ghostly-systems', 'Asia/Kolkata');

-- password for all demo users: "Password@123" (bcrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role, company_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'admin@careersync.dev', '$2a$10$6nlvNw3RgZ0P0dqUGpAhW.9gyI/ebjd9Voi.xRbWgQsj93gO.nxBS', 'Site Admin', 'ADMIN', NULL),
  ('b0000000-0000-0000-0000-000000000002', 'recruiter@acme.dev', '$2a$10$6nlvNw3RgZ0P0dqUGpAhW.9gyI/ebjd9Voi.xRbWgQsj93gO.nxBS', 'Riya Recruiter', 'RECRUITER', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000003', 'candidate@example.dev', '$2a$10$6nlvNw3RgZ0P0dqUGpAhW.9gyI/ebjd9Voi.xRbWgQsj93gO.nxBS', 'Chandra Candidate', 'CANDIDATE', NULL);

INSERT INTO jobs (id, company_id, title, department, location, description, created_by) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Backend Engineer - Payments', 'Engineering', 'Bengaluru, IN',
   'Own the ledger and settlement services.', 'b0000000-0000-0000-0000-000000000002');

INSERT INTO job_stage_configs (job_id, stage, sla_business_hours) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'APPLIED', 40),
  ('c0000000-0000-0000-0000-000000000001', 'SCREENING', 24),
  ('c0000000-0000-0000-0000-000000000001', 'SHORTLISTED', 16),
  ('c0000000-0000-0000-0000-000000000001', 'INTERVIEW', 32),
  ('c0000000-0000-0000-0000-000000000001', 'OFFERED', 24);

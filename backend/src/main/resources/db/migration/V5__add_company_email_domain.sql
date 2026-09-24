-- V5: Add email_domain to companies for Recruiter Google Workspace OAuth matching
ALTER TABLE companies
    ADD COLUMN IF NOT EXISTS email_domain VARCHAR(255);

-- Patch existing seed companies with their known demo domains
UPDATE companies SET email_domain = 'acme.dev'      WHERE slug = 'acme-fintech';
UPDATE companies SET email_domain = 'ghostly.dev'   WHERE slug = 'ghostly-systems';

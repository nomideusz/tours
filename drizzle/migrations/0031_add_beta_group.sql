-- Add beta_group field to track beta cohorts (Beta 1, Beta 2, Early Access)
-- Migration: 0031_add_beta_group.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_group VARCHAR(20);

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_beta_group ON users(beta_group);

-- Possible values: 'beta_1', 'beta_2', 'early_access', NULL (for public launch users)

COMMENT ON COLUMN users.beta_group IS 'Beta cohort identifier: beta_1 (30% lifetime discount), beta_2 (20% lifetime discount), early_access (30% lifetime discount), or NULL for public users';


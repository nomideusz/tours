-- Add beta_cohort enum type for pricing cohorts
-- Migration: 0032_add_beta_cohort_enum.sql

-- Create the beta_cohort enum type
DO $$ BEGIN
  CREATE TYPE beta_cohort AS ENUM ('beta_1', 'beta_2', 'public');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Convert existing beta_group varchar to the new enum type
-- First, update any existing values to match enum values
UPDATE users SET beta_group = 'beta_1' WHERE beta_group = 'beta_1';
UPDATE users SET beta_group = 'beta_2' WHERE beta_group = 'beta_2';
UPDATE users SET beta_group = NULL WHERE beta_group NOT IN ('beta_1', 'beta_2');

-- Add a temporary column with the enum type
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_cohort beta_cohort;

-- Copy data from beta_group to beta_cohort
UPDATE users SET beta_cohort = beta_group::beta_cohort WHERE beta_group IS NOT NULL;

-- Drop the old beta_group column and its index
DROP INDEX IF EXISTS idx_users_beta_group;
ALTER TABLE users DROP COLUMN IF EXISTS beta_group;

-- Rename the new column to beta_group for consistency with existing code
ALTER TABLE users RENAME COLUMN beta_cohort TO beta_group;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_users_beta_group ON users(beta_group);

-- Update the comment
COMMENT ON COLUMN users.beta_group IS 'Beta cohort identifier: beta_1 (30% lifetime discount + 1 year free), beta_2 (20% lifetime discount + 4 months free), public (full price + 14 day trial), or NULL for legacy users';


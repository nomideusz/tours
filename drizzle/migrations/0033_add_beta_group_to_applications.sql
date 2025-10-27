-- Add beta_group column to beta_applications table
-- This allows tracking which beta cohort (beta_1 or beta_2) an application is for

ALTER TABLE "beta_applications" ADD COLUMN "beta_group" VARCHAR(20) DEFAULT 'beta_2';

-- Set default to beta_2 for new applications (current beta phase)
-- Existing applications can be manually updated to beta_1 if needed

-- Add index for filtering by beta group
CREATE INDEX IF NOT EXISTS "idx_beta_applications_beta_group" ON "beta_applications"("beta_group");

-- Comment on column
COMMENT ON COLUMN "beta_applications"."beta_group" IS 'Beta cohort: beta_1 (30% lifetime discount), beta_2 (20% lifetime discount), or null';


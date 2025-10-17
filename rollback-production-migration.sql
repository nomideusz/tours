-- Rollback Script for Production Migration
-- Use this ONLY if you need to undo the migration
-- Date: 2025-10-08

BEGIN;

-- =============================================================================
-- WARNING: This will remove the new columns and data in them
-- Only run if absolutely necessary!
-- =============================================================================

-- Drop new columns from tours table
ALTER TABLE tours DROP COLUMN IF EXISTS pricing_model;
ALTER TABLE tours DROP COLUMN IF EXISTS participant_categories;
ALTER TABLE tours DROP COLUMN IF EXISTS private_tour;
ALTER TABLE tours DROP COLUMN IF EXISTS group_discounts;
ALTER TABLE tours DROP COLUMN IF EXISTS optional_addons;
ALTER TABLE tours DROP COLUMN IF EXISTS guide_pays_stripe_fee;
ALTER TABLE tours DROP COLUMN IF EXISTS min_capacity;
ALTER TABLE tours DROP COLUMN IF EXISTS max_capacity;
ALTER TABLE tours DROP COLUMN IF EXISTS count_infants_toward_capacity;

-- Drop feature_feedback table
DROP TABLE IF EXISTS feature_feedback CASCADE;

-- Drop pricing_model enum type
DROP TYPE IF EXISTS pricing_model CASCADE;

COMMIT;

-- Verify rollback
SELECT COUNT(*) as remaining_tours FROM tours;

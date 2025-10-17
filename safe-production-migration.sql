-- Safe Production Migration Script
-- Adds all missing pricing and feedback fields
-- Date: 2025-10-08
-- 
-- IMPORTANT: You mentioned you have a backup - good!
-- This script is idempotent (safe to run multiple times)
-- All operations use IF NOT EXISTS or safe ALTER TABLE statements

BEGIN;

-- =============================================================================
-- STEP 1: Add Pricing Model Enum (if it doesn't exist)
-- =============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_model') THEN
        CREATE TYPE pricing_model AS ENUM ('per_person', 'group_tiers', 'participant_categories');
        RAISE NOTICE 'Created pricing_model enum';
    ELSE
        RAISE NOTICE 'pricing_model enum already exists';
    END IF;
END $$;

-- =============================================================================
-- STEP 2: Add Missing Columns to Tours Table
-- =============================================================================

-- Pricing model column
ALTER TABLE tours ADD COLUMN IF NOT EXISTS pricing_model pricing_model DEFAULT 'participant_categories';

-- Participant categories (flexible pricing by category)
ALTER TABLE tours ADD COLUMN IF NOT EXISTS participant_categories json;

-- Private tour (flat rate pricing)
ALTER TABLE tours ADD COLUMN IF NOT EXISTS private_tour json;

-- Group discounts
ALTER TABLE tours ADD COLUMN IF NOT EXISTS group_discounts json;

-- Optional add-ons
ALTER TABLE tours ADD COLUMN IF NOT EXISTS optional_addons json;

-- Stripe fee payment option
ALTER TABLE tours ADD COLUMN IF NOT EXISTS guide_pays_stripe_fee boolean NOT NULL DEFAULT false;

-- Capacity settings
ALTER TABLE tours ADD COLUMN IF NOT EXISTS min_capacity integer NOT NULL DEFAULT 1;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS max_capacity integer NOT NULL DEFAULT 20;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS count_infants_toward_capacity boolean NOT NULL DEFAULT false;

-- Legacy field that might be missing
ALTER TABLE tours ADD COLUMN IF NOT EXISTS group_pricing_tiers json;

RAISE NOTICE 'Added all missing tour columns';

-- =============================================================================
-- STEP 3: Create Feature Feedback Table (if it doesn't exist)
-- =============================================================================

CREATE TABLE IF NOT EXISTS feature_feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    feature_id VARCHAR(100) NOT NULL,
    feature_version VARCHAR(50) NOT NULL,
    -- Legacy rating field for backward compatibility
    rating VARCHAR(20) NOT NULL,
    -- New 5-star rating system
    rating_score INTEGER CHECK (rating_score >= 1 AND rating_score <= 5),
    usability_score INTEGER CHECK (usability_score >= 1 AND usability_score <= 5),
    -- Feedback details
    comment TEXT,
    improvements TEXT[],
    would_use BOOLEAN DEFAULT false,
    -- Metadata
    page_url TEXT,
    user_agent TEXT,
    session_id TEXT,
    comparison_group VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for feature_feedback
CREATE INDEX IF NOT EXISTS idx_feature_feedback_feature ON feature_feedback(feature_id, feature_version);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_user ON feature_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_created ON feature_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_rating_score ON feature_feedback(rating_score);

RAISE NOTICE 'Feature feedback table ready';

-- =============================================================================
-- STEP 4: Verify Migration Success
-- =============================================================================

DO $$
DECLARE
    missing_cols text[];
    col_name text;
BEGIN
    -- Check for all expected columns in tours table
    SELECT ARRAY_AGG(expected_col)
    INTO missing_cols
    FROM (
        SELECT unnest(ARRAY[
            'pricing_model',
            'participant_categories',
            'private_tour',
            'group_discounts',
            'optional_addons',
            'guide_pays_stripe_fee',
            'min_capacity',
            'max_capacity',
            'count_infants_toward_capacity'
        ]) AS expected_col
    ) expected
    WHERE NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = expected_col
    );
    
    IF missing_cols IS NOT NULL AND array_length(missing_cols, 1) > 0 THEN
        RAISE EXCEPTION 'Migration incomplete! Missing columns: %', array_to_string(missing_cols, ', ');
    END IF;
    
    RAISE NOTICE '✓ All tour columns verified';
    
    -- Check feature_feedback table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_feedback') THEN
        RAISE EXCEPTION 'feature_feedback table was not created!';
    END IF;
    
    RAISE NOTICE '✓ Feature feedback table verified';
END $$;

-- =============================================================================
-- SUCCESS!
-- =============================================================================

COMMIT;

-- Show final column list
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' 
AND column_name IN (
    'pricing_model',
    'participant_categories', 
    'private_tour',
    'group_discounts',
    'optional_addons',
    'guide_pays_stripe_fee',
    'min_capacity',
    'max_capacity',
    'count_infants_toward_capacity'
)
ORDER BY ordinal_position;

-- ============================================================================
-- GROUP PRICING & ADD-ONS - PRODUCTION MIGRATION
-- ============================================================================
-- 
-- This migration adds support for flexible group-based pricing tiers and
-- optional add-ons to the tours system.
--
-- IMPORTANT: Execute each step manually and verify results before proceeding
-- to the next step. Each step includes verification queries.
--
-- Date: 2025-09-30
-- Feature: Advanced Group Pricing & Optional Add-ons
-- ============================================================================

-- ============================================================================
-- STEP 1: Create pricing_model enum type
-- ============================================================================
-- This enum defines the 4 pricing models available in the system:
--   - per_person: Traditional per-participant pricing (default)
--   - adult_child: Different prices for adults and children (existing)
--   - group_tiers: Price based on total group size (NEW)
--   - hybrid: Group tiers + optional add-ons (NEW)

DO $$ BEGIN
  CREATE TYPE pricing_model AS ENUM ('per_person', 'adult_child', 'group_tiers', 'hybrid');
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'pricing_model enum already exists, skipping creation';
END $$;

-- VERIFY STEP 1:
-- Run this query to confirm the enum was created:
/*
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'pricing_model'
ORDER BY e.enumsortorder;

Expected output:
 enum_name     | enum_value
---------------+-------------
 pricing_model | per_person
 pricing_model | adult_child
 pricing_model | group_tiers
 pricing_model | hybrid
*/

-- ============================================================================
-- STEP 2: Add pricing_model column to tours table
-- ============================================================================
-- This column determines which pricing model a tour uses.
-- Default is 'per_person' for backward compatibility.

ALTER TABLE tours 
  ADD COLUMN IF NOT EXISTS pricing_model pricing_model DEFAULT 'per_person';

-- VERIFY STEP 2:
-- Run this query to confirm the column was added:
/*
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' 
  AND column_name = 'pricing_model';

Expected output:
 column_name   | data_type    | column_default   | is_nullable
---------------+--------------+------------------+-------------
 pricing_model | USER-DEFINED | 'per_person'::.. | YES
*/

-- ============================================================================
-- STEP 3: Add group_pricing_tiers column to tours table
-- ============================================================================
-- This JSON column stores group pricing tier configurations.
-- Structure: { "tiers": [{ "minParticipants": 1, "maxParticipants": 2, 
--                          "price": 150, "label": "Solo/Couple" }] }

ALTER TABLE tours 
  ADD COLUMN IF NOT EXISTS group_pricing_tiers JSON;

-- VERIFY STEP 3:
-- Run this query to confirm the column was added:
/*
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' 
  AND column_name = 'group_pricing_tiers';

Expected output:
 column_name          | data_type | is_nullable
----------------------+-----------+-------------
 group_pricing_tiers  | json      | YES
*/

-- ============================================================================
-- STEP 4: Add optional_addons column to tours table
-- ============================================================================
-- This JSON column stores optional add-ons configuration.
-- Structure: { "addons": [{ "id": "uuid", "name": "Transport", 
--                           "description": "...", "price": 80, 
--                           "required": false, "icon": "car" }] }

ALTER TABLE tours 
  ADD COLUMN IF NOT EXISTS optional_addons JSON;

-- VERIFY STEP 4:
-- Run this query to confirm the column was added:
/*
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' 
  AND column_name = 'optional_addons';

Expected output:
 column_name      | data_type | is_nullable
------------------+-----------+-------------
 optional_addons  | json      | YES
*/

-- ============================================================================
-- STEP 5: Add selected_addons column to bookings table
-- ============================================================================
-- This JSON column stores which add-ons were selected for a booking.
-- Structure: [{ "addonId": "uuid", "name": "Transport", "price": 80 }]

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS selected_addons JSON;

-- VERIFY STEP 5:
-- Run this query to confirm the column was added:
/*
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'selected_addons';

Expected output:
 column_name      | data_type | is_nullable
------------------+-----------+-------------
 selected_addons  | json      | YES
*/

-- ============================================================================
-- STEP 6: Add price_breakdown column to bookings table
-- ============================================================================
-- This JSON column stores the price breakdown for transparency.
-- Structure: { "basePrice": 150, "addonsTotal": 80, "totalAmount": 230 }

ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS price_breakdown JSON;

-- VERIFY STEP 6:
-- Run this query to confirm the column was added:
/*
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND column_name = 'price_breakdown';

Expected output:
 column_name      | data_type | is_nullable
------------------+-----------+-------------
 price_breakdown  | json      | YES
*/

-- ============================================================================
-- STEP 7: Migrate existing tours to appropriate pricing models
-- ============================================================================
-- Set pricing_model based on whether adult/child pricing is enabled.
-- Tours with enable_pricing_tiers = true → 'adult_child'
-- All other tours → 'per_person' (default)

UPDATE tours
SET pricing_model = CASE
  WHEN enable_pricing_tiers = true THEN 'adult_child'::pricing_model
  ELSE 'per_person'::pricing_model
END
WHERE pricing_model IS NULL OR pricing_model = 'per_person';

-- VERIFY STEP 7:
-- Run this query to see the distribution of pricing models:
/*
SELECT 
  pricing_model,
  COUNT(*) as tour_count
FROM tours
GROUP BY pricing_model
ORDER BY tour_count DESC;

Expected output (example):
 pricing_model | tour_count
---------------+------------
 per_person    | 45
 adult_child   | 5
*/

-- ============================================================================
-- STEP 8: Add price breakdown to existing bookings
-- ============================================================================
-- Populate price_breakdown for existing bookings with their total_amount.
-- This ensures backward compatibility and provides a consistent data structure.

UPDATE bookings
SET price_breakdown = json_build_object(
  'basePrice', total_amount::numeric,
  'addonsTotal', 0,
  'totalAmount', total_amount::numeric
)
WHERE price_breakdown IS NULL;

-- VERIFY STEP 8:
-- Run this query to confirm price_breakdown was populated:
/*
SELECT 
  COUNT(*) as total_bookings,
  COUNT(price_breakdown) as bookings_with_breakdown,
  COUNT(*) - COUNT(price_breakdown) as bookings_without_breakdown
FROM bookings;

Expected output:
 total_bookings | bookings_with_breakdown | bookings_without_breakdown
----------------+-------------------------+----------------------------
 150            | 150                     | 0
*/

-- Check a sample booking to verify the structure:
/*
SELECT 
  id,
  total_amount,
  price_breakdown
FROM bookings
WHERE price_breakdown IS NOT NULL
LIMIT 3;

Expected output (example):
 id     | total_amount | price_breakdown
--------+--------------+----------------------------------------------------------
 abc123 | 150.00       | {"basePrice": 150.00, "addonsTotal": 0, "totalAmount": 150.00}
*/

-- ============================================================================
-- STEP 9: Create index on pricing_model for performance
-- ============================================================================
-- This index improves query performance when filtering tours by pricing model.

CREATE INDEX IF NOT EXISTS idx_tours_pricing_model 
ON tours (pricing_model);

-- VERIFY STEP 9:
-- Run this query to confirm the index was created:
/*
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'tours' 
  AND indexname = 'idx_tours_pricing_model';

Expected output:
 schemaname | tablename | indexname                | indexdef
------------+-----------+--------------------------+--------------------------------
 public     | tours     | idx_tours_pricing_model  | CREATE INDEX idx_tours_pric...
*/

-- ============================================================================
-- STEP 10: Add column comments for documentation
-- ============================================================================
-- These comments provide inline documentation in the database schema.

COMMENT ON COLUMN tours.pricing_model IS 
  'Pricing model: per_person (default), adult_child (existing), group_tiers (new), or hybrid (new with add-ons)';

COMMENT ON COLUMN tours.group_pricing_tiers IS 
  'Group-based pricing tiers JSON: { tiers: [{ minParticipants, maxParticipants, price, label }] }';

COMMENT ON COLUMN tours.optional_addons IS 
  'Optional add-ons JSON: { addons: [{ id, name, description, price, required, icon }] }';

COMMENT ON COLUMN bookings.selected_addons IS 
  'Add-ons selected for this booking: [{ addonId, name, price }]';

COMMENT ON COLUMN bookings.price_breakdown IS 
  'Price breakdown: { basePrice, addonsTotal, totalAmount }';

-- VERIFY STEP 10:
-- Run this query to confirm comments were added:
/*
SELECT 
  column_name,
  col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) as column_comment
FROM information_schema.columns
WHERE table_name IN ('tours', 'bookings')
  AND column_name IN ('pricing_model', 'group_pricing_tiers', 'optional_addons', 'selected_addons', 'price_breakdown')
ORDER BY table_name, column_name;

Expected output:
 column_name          | column_comment
----------------------+--------------------------------------------------
 group_pricing_tiers  | Group-based pricing tiers JSON: { tiers: ...
 optional_addons      | Optional add-ons JSON: { addons: [{ id, ...
 pricing_model        | Pricing model: per_person (default), adult...
 price_breakdown      | Price breakdown: { basePrice, addonsTotal,...
 selected_addons      | Add-ons selected for this booking: [{ addon...
*/

-- ============================================================================
-- FINAL VERIFICATION - Run all these queries to confirm migration success
-- ============================================================================

-- 1. Check all new columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE (table_name = 'tours' AND column_name IN ('pricing_model', 'group_pricing_tiers', 'optional_addons'))
   OR (table_name = 'bookings' AND column_name IN ('selected_addons', 'price_breakdown'))
ORDER BY table_name, column_name;

-- 2. Check enum values
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'pricing_model'
ORDER BY e.enumsortorder;

-- 3. Check index
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'tours' 
  AND indexname = 'idx_tours_pricing_model';

-- 4. Check sample data migration
SELECT 
  COUNT(*) as total_tours,
  COUNT(CASE WHEN pricing_model = 'per_person' THEN 1 END) as per_person_tours,
  COUNT(CASE WHEN pricing_model = 'adult_child' THEN 1 END) as adult_child_tours
FROM tours;

SELECT 
  COUNT(*) as total_bookings,
  COUNT(price_breakdown) as bookings_with_breakdown
FROM bookings;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If you need to rollback this migration, run these commands in reverse order:
--
-- STEP 1: Drop comments
-- COMMENT ON COLUMN tours.pricing_model IS NULL;
-- COMMENT ON COLUMN tours.group_pricing_tiers IS NULL;
-- COMMENT ON COLUMN tours.optional_addons IS NULL;
-- COMMENT ON COLUMN bookings.selected_addons IS NULL;
-- COMMENT ON COLUMN bookings.price_breakdown IS NULL;
--
-- STEP 2: Drop index
-- DROP INDEX IF EXISTS idx_tours_pricing_model;
--
-- STEP 3: Drop columns from bookings table
-- ALTER TABLE bookings DROP COLUMN IF EXISTS price_breakdown;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS selected_addons;
--
-- STEP 4: Drop columns from tours table
-- ALTER TABLE tours DROP COLUMN IF EXISTS optional_addons;
-- ALTER TABLE tours DROP COLUMN IF EXISTS group_pricing_tiers;
-- ALTER TABLE tours DROP COLUMN IF EXISTS pricing_model;
--
-- STEP 5: Drop enum type
-- DROP TYPE IF EXISTS pricing_model;
--
-- WARNING: Rollback will permanently delete any data stored in these columns!
-- Only use in emergency situations or during testing.

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary of changes:
-- - Created pricing_model enum with 4 values
-- - Added 3 new columns to tours table
-- - Added 2 new columns to bookings table
-- - Created performance index
-- - Migrated existing data
-- - Added documentation comments
--
-- Next steps:
-- 1. Verify all verification queries return expected results
-- 2. Test creating a tour with group pricing in the application
-- 3. Test creating a booking with the new pricing models
-- 4. Monitor application logs for any errors
--
-- ============================================================================

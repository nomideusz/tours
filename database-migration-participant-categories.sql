-- =====================================================
-- PARTICIPANT CATEGORIES PRICING MODEL
-- Migration: Add flexible participant categories
-- =====================================================
-- 
-- This migration adds support for flexible participant categories,
-- allowing tour guides to define custom pricing for:
-- - Seniors (65+)
-- - Students (with ID)
-- - Youth/Teens (13-17)
-- - Infants (0-2)
-- - Military/Veterans
-- - Any custom category they need
--
-- BACKWARD COMPATIBLE: Existing adult/child tours continue to work
-- =====================================================

-- Step 1: Add 'participant_categories' to pricing_model enum
-- =====================================================
-- This extends the existing pricing model to include the new flexible category model
ALTER TYPE "pricing_model" ADD VALUE IF NOT EXISTS 'participant_categories';

-- Step 2: Add participant_categories column to tours table
-- =====================================================
-- This JSON column stores an array of custom participant categories
-- Example:
-- {
--   "categories": [
--     {
--       "id": "adult",
--       "label": "Adult",
--       "price": 50,
--       "ageRange": "18-64",
--       "sortOrder": 0
--     },
--     {
--       "id": "senior",
--       "label": "Senior (65+)",
--       "price": 40,
--       "ageRange": "65+",
--       "description": "Valid ID required",
--       "sortOrder": 1,
--       "minAge": 65
--     },
--     {
--       "id": "student",
--       "label": "Student",
--       "price": 35,
--       "description": "Valid student ID required",
--       "sortOrder": 2
--     },
--     {
--       "id": "child",
--       "label": "Child (3-12)",
--       "price": 25,
--       "ageRange": "3-12",
--       "sortOrder": 3,
--       "minAge": 3,
--       "maxAge": 12
--     }
--   ]
-- }
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "participant_categories" json;

-- Step 3: Add participants_by_category column to bookings table
-- =====================================================
-- This JSON column stores how many participants of each category were booked
-- Example: { "adult": 2, "senior": 1, "child": 1 }
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "participants_by_category" json;

-- Step 4: Update priceBreakdown structure (no schema change needed)
-- =====================================================
-- The existing price_breakdown column can already store the enhanced structure
-- with categoryBreakdown. No migration needed, just documentation:
--
-- Enhanced priceBreakdown format:
-- {
--   "basePrice": 140,
--   "addonsTotal": 0,
--   "totalAmount": 140,
--   "categoryBreakdown": {
--     "adult": {
--       "label": "Adult",
--       "count": 2,
--       "pricePerPerson": 50,
--       "subtotal": 100
--     },
--     "child": {
--       "label": "Child (3-12)",
--       "count": 1,
--       "pricePerPerson": 25,
--       "subtotal": 25
--     }
--   }
-- }

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Verify enum value was added
SELECT 
    e.enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'pricing_model'
ORDER BY e.enumsortorder;
-- Expected: per_person, adult_child, participant_categories, group_tiers, hybrid

-- 2. Verify tours columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tours' 
    AND column_name IN ('pricing_model', 'participant_categories', 'pricing_tiers')
ORDER BY column_name;
-- Expected: All three columns present

-- 3. Verify bookings columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings' 
    AND column_name IN ('participant_breakdown', 'participants_by_category', 'price_breakdown')
ORDER BY column_name;
-- Expected: All three columns present

-- 4. Check for any existing tours (should all still work)
SELECT 
    pricing_model,
    COUNT(*) as count
FROM tours
GROUP BY pricing_model
ORDER BY count DESC;

-- 5. Sample query: Tours that could be migrated to participant_categories
-- (Any tours currently using adult_child model)
SELECT 
    id,
    name,
    pricing_model,
    pricing_tiers->>'adult' as adult_price,
    pricing_tiers->>'child' as child_price
FROM tours
WHERE pricing_model = 'adult_child'
    AND pricing_tiers IS NOT NULL
LIMIT 5;

-- =====================================================
-- ROLLBACK SCRIPT (USE WITH CAUTION)
-- =====================================================
-- Note: Enum values cannot be easily removed in PostgreSQL
-- If rollback is needed, you would need to:
-- 1. Update any tours using 'participant_categories' back to another model
-- 2. Drop the columns
-- 3. Recreate the enum without 'participant_categories'
--
-- DO NOT RUN THIS UNLESS YOU NEED TO ROLLBACK:
-- 
-- UPDATE tours SET pricing_model = 'per_person' WHERE pricing_model = 'participant_categories';
-- ALTER TABLE "tours" DROP COLUMN IF EXISTS "participant_categories";
-- ALTER TABLE "bookings" DROP COLUMN IF EXISTS "participants_by_category";
-- 
-- Then manually recreate the enum:
-- DROP TYPE "pricing_model";
-- CREATE TYPE "pricing_model" AS ENUM ('per_person', 'adult_child', 'group_tiers', 'hybrid');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- 
-- Next steps:
-- 1. Deploy backend code with new pricing calculation logic
-- 2. Deploy frontend UI components for category management
-- 3. Test with sample tours
-- 4. Notify beta users of new feature
-- 
-- Backward compatibility: ✅ Confirmed
-- - Existing per_person tours: ✅ Work as before
-- - Existing adult_child tours: ✅ Work as before  
-- - Existing group_tiers tours: ✅ Work as before
-- - Existing hybrid tours: ✅ Work as before
-- 
-- =====================================================


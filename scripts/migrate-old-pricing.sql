-- =====================================================
-- Migrate Old Pricing System to New Participant Categories
-- =====================================================
-- This script migrates tours from old pricing models to the new
-- participant_categories system while preserving original prices.
--
-- IMPORTANT: Back up your database before running this script!
--
-- Usage:
--   psql $DATABASE_URL -f scripts/migrate-old-pricing.sql
--   OR copy/paste into your database client
-- =====================================================

BEGIN;

-- Step 1: Migrate tours with per_person or undefined pricing model (without adult/child tiers)
-- These tours will get standard Adult/Child/Infant categories with same price for all
UPDATE tours
SET 
  pricing_model = 'participant_categories',
  participant_categories = jsonb_build_object(
    'categories', jsonb_build_array(
      jsonb_build_object(
        'id', 'adult',
        'label', 'Adult',
        'description', 'Ages 13+',
        'price', COALESCE(price::numeric, 0),
        'minAge', 13,
        'maxAge', null,
        'sortOrder', 0,
        'required', true
      ),
      jsonb_build_object(
        'id', 'child',
        'label', 'Child',
        'description', 'Ages 3-12',
        'price', COALESCE(price::numeric, 0),
        'minAge', 3,
        'maxAge', 12,
        'sortOrder', 1,
        'required', false
      ),
      jsonb_build_object(
        'id', 'infant',
        'label', 'Infant',
        'description', 'Ages 0-2 (Free)',
        'price', 0,
        'minAge', 0,
        'maxAge', 2,
        'sortOrder', 2,
        'required', false
      )
    )
  ),
  updated_at = NOW()
WHERE 
  pricing_model = 'per_person'
  AND (enable_pricing_tiers = false OR enable_pricing_tiers IS NULL OR pricing_tiers IS NULL)
  AND participant_categories IS NULL;

-- Get count of migrated tours from step 1
SELECT 
  COUNT(*) as "Tours migrated from per_person/undefined",
  ROUND(AVG(price::numeric), 2) as "Average price"
FROM tours 
WHERE pricing_model = 'participant_categories' 
  AND participant_categories IS NOT NULL
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Step 2: Migrate tours with per_person and adult/child pricing tiers
-- These tours will get proper Adult/Child/Infant categories with different prices
UPDATE tours
SET 
  pricing_model = 'participant_categories',
  participant_categories = jsonb_build_object(
    'categories', jsonb_build_array(
      jsonb_build_object(
        'id', 'adult',
        'label', 'Adult',
        'description', 'Ages 13+',
        'price', COALESCE((pricing_tiers->>'adult')::numeric, price::numeric, 0),
        'minAge', 13,
        'maxAge', null,
        'sortOrder', 0,
        'required', true
      ),
      jsonb_build_object(
        'id', 'child',
        'label', 'Child',
        'description', 'Ages 3-12',
        'price', COALESCE((pricing_tiers->>'child')::numeric, price::numeric, 0),
        'minAge', 3,
        'maxAge', 12,
        'sortOrder', 1,
        'required', false
      ),
      jsonb_build_object(
        'id', 'infant',
        'label', 'Infant',
        'description', 'Ages 0-2 (Free)',
        'price', 0,
        'minAge', 0,
        'maxAge', 2,
        'sortOrder', 2,
        'required', false
      )
    )
  ),
  updated_at = NOW()
WHERE 
  pricing_model = 'per_person'
  AND enable_pricing_tiers = true
  AND pricing_tiers IS NOT NULL
  AND participant_categories IS NULL;

-- Get count of migrated tours from step 2
SELECT 
  COUNT(*) as "Tours migrated from per_person with adult/child tiers",
  ROUND(AVG((pricing_tiers->>'adult')::numeric), 2) as "Average adult price",
  ROUND(AVG(COALESCE((pricing_tiers->>'child')::numeric, 0)), 2) as "Average child price"
FROM tours 
WHERE pricing_model = 'participant_categories' 
  AND participant_categories IS NOT NULL
  AND pricing_tiers IS NOT NULL
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Step 3: Fix tours that have participant_categories pricing model but missing categories data
-- These tours were set to the new model but never had categories created
UPDATE tours
SET 
  participant_categories = jsonb_build_object(
    'categories', jsonb_build_array(
      jsonb_build_object(
        'id', 'adult',
        'label', 'Adult',
        'description', 'Ages 13+',
        'price', COALESCE(price::numeric, 0),
        'minAge', 13,
        'maxAge', null,
        'sortOrder', 0,
        'required', true
      ),
      jsonb_build_object(
        'id', 'child',
        'label', 'Child',
        'description', 'Ages 3-12',
        'price', COALESCE(price::numeric, 0),
        'minAge', 3,
        'maxAge', 12,
        'sortOrder', 1,
        'required', false
      ),
      jsonb_build_object(
        'id', 'infant',
        'label', 'Infant',
        'description', 'Ages 0-2 (Free)',
        'price', 0,
        'minAge', 0,
        'maxAge', 2,
        'sortOrder', 2,
        'required', false
      )
    )
  ),
  updated_at = NOW()
WHERE 
  pricing_model = 'participant_categories'
  AND participant_categories IS NULL;

-- Show count of fixed tours
SELECT 
  COUNT(*) as "Tours fixed (had model but no categories)",
  ROUND(AVG(price::numeric), 2) as "Average price"
FROM tours 
WHERE pricing_model = 'participant_categories' 
  AND participant_categories IS NOT NULL
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Step 4: Sync price field for all tours with new pricing models
-- This ensures the legacy price field matches the new pricing model

-- For participant_categories: use first category price
UPDATE tours
SET 
  price = (participant_categories->'categories'->0->>'price')::numeric,
  updated_at = NOW()
WHERE 
  pricing_model = 'participant_categories'
  AND participant_categories IS NOT NULL
  AND (
    price::numeric != (participant_categories->'categories'->0->>'price')::numeric
    OR price IS NULL
    OR price = '0'
  );

-- For group_tiers: use minimum tier price
UPDATE tours
SET 
  price = (
    SELECT MIN((tier->>'price')::numeric)
    FROM json_array_elements(group_pricing_tiers::json->'tiers') as tier
  ),
  updated_at = NOW()
WHERE 
  pricing_model = 'group_tiers'
  AND group_pricing_tiers IS NOT NULL
  AND (
    price IS NULL
    OR price = '0'
    OR price::numeric != (
      SELECT MIN((tier->>'price')::numeric)
      FROM json_array_elements(group_pricing_tiers::json->'tiers') as tier
    )
  );

-- Step 5: Summary Report
SELECT 
  '=== MIGRATION SUMMARY ===' as summary;

SELECT 
  pricing_model as "Pricing Model",
  COUNT(*) as "Tour Count",
  ROUND(AVG(price::numeric), 2) as "Average Price",
  MIN(price::numeric) as "Min Price",
  MAX(price::numeric) as "Max Price"
FROM tours
GROUP BY pricing_model
ORDER BY COUNT(*) DESC;

SELECT 
  '=== TOURS BY STATUS ===' as summary;

SELECT 
  status as "Status",
  COUNT(*) as "Tour Count"
FROM tours
GROUP BY status;

SELECT 
  '=== RECENTLY UPDATED TOURS ===' as summary;

SELECT 
  name as "Tour Name",
  pricing_model as "Pricing Model",
  price as "Price",
  LEFT(id, 8) || '...' as "ID"
FROM tours
WHERE updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC
LIMIT 20;

-- Commit the transaction
COMMIT;

-- =====================================================
-- Verification Queries (run these after migration)
-- =====================================================

-- Check for tours without proper pricing
SELECT 
  name as "Tour Name",
  pricing_model as "Pricing Model",
  price as "Price",
  CASE 
    WHEN participant_categories IS NULL THEN 'Missing participant_categories'
    WHEN group_pricing_tiers IS NULL AND pricing_model = 'group_tiers' THEN 'Missing group_pricing_tiers'
    ELSE 'OK'
  END as "Status"
FROM tours
WHERE (
  (pricing_model = 'participant_categories' AND participant_categories IS NULL)
  OR (pricing_model = 'group_tiers' AND group_pricing_tiers IS NULL)
  OR price IS NULL
  OR price = '0'
);

-- Check participant categories structure
SELECT 
  name as "Tour Name",
  pricing_model as "Pricing Model",
  jsonb_array_length(participant_categories->'categories') as "Category Count",
  (participant_categories->'categories'->0->>'label') as "First Category",
  (participant_categories->'categories'->0->>'price') as "First Category Price"
FROM tours
WHERE pricing_model = 'participant_categories'
LIMIT 10;


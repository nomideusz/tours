-- =====================================================
-- Sync Legacy Price Field with New Pricing Models
-- =====================================================
-- This script updates the legacy 'price' field to match
-- the values in the new pricing model structures.
--
-- Safe to run multiple times - it's idempotent.
--
-- Run: psql $DATABASE_URL -f scripts/sync-prices.sql
-- =====================================================

BEGIN;

-- Sync participant_categories: use first category price (typically Adult)
UPDATE tours
SET 
  price = (participant_categories->'categories'->0->>'price')::numeric::text,
  updated_at = NOW()
WHERE 
  pricing_model = 'participant_categories'
  AND participant_categories IS NOT NULL
  AND participant_categories->'categories' IS NOT NULL
  AND jsonb_array_length(participant_categories->'categories') > 0
  AND (
    price IS NULL 
    OR price = '0'
    OR price::numeric != (participant_categories->'categories'->0->>'price')::numeric
  );

SELECT 
  COUNT(*) as "Participant Categories Tours Synced"
FROM tours 
WHERE pricing_model = 'participant_categories'
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Sync private_tour: use flat price
UPDATE tours
SET 
  price = (private_tour->>'flatPrice')::numeric::text,
  updated_at = NOW()
WHERE 
  pricing_model = 'private_tour'
  AND private_tour IS NOT NULL
  AND private_tour->>'flatPrice' IS NOT NULL
  AND (
    price IS NULL
    OR price = '0'
    OR price::numeric != (private_tour->>'flatPrice')::numeric
  );

SELECT 
  COUNT(*) as "Private Tour Tours Synced"
FROM tours 
WHERE pricing_model = 'private_tour'
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Sync group_tiers: use minimum tier price
UPDATE tours
SET 
  price = (
    SELECT MIN((tier->>'price')::numeric)::text
    FROM jsonb_array_elements(group_pricing_tiers->'tiers') as tier
  ),
  updated_at = NOW()
WHERE 
  pricing_model = 'group_tiers'
  AND group_pricing_tiers IS NOT NULL
  AND group_pricing_tiers->'tiers' IS NOT NULL
  AND (
    price IS NULL
    OR price = '0'
    OR price::numeric != (
      SELECT MIN((tier->>'price')::numeric)
      FROM jsonb_array_elements(group_pricing_tiers->'tiers') as tier
    )
  );

SELECT 
  COUNT(*) as "Group Tiers Tours Synced"
FROM tours 
WHERE pricing_model = 'group_tiers'
  AND updated_at >= NOW() - INTERVAL '1 minute';

-- Summary
SELECT 
  pricing_model as "Pricing Model",
  COUNT(*) as "Total Tours",
  ROUND(AVG(price::numeric), 2) as "Avg Price",
  COUNT(CASE WHEN price::numeric = 0 THEN 1 END) as "Free Tours",
  COUNT(CASE WHEN price::numeric > 0 THEN 1 END) as "Paid Tours"
FROM tours
GROUP BY pricing_model
ORDER BY COUNT(*) DESC;

COMMIT;

-- Verification: Check for tours with price = 0 that shouldn't be free
SELECT 
  name as "Potentially Incorrect Tours",
  pricing_model as "Model",
  price as "Current Price",
  CASE 
    WHEN pricing_model = 'participant_categories' 
      THEN (participant_categories->'categories'->0->>'price')
    WHEN pricing_model = 'private_tour'
      THEN (private_tour->>'flatPrice')
    ELSE 'N/A'
  END as "Expected Price"
FROM tours
WHERE price::numeric = 0
  AND (
    (pricing_model = 'participant_categories' 
      AND (participant_categories->'categories'->0->>'price')::numeric > 0)
    OR (pricing_model = 'private_tour' 
      AND (private_tour->>'flatPrice')::numeric > 0)
  )
LIMIT 20;


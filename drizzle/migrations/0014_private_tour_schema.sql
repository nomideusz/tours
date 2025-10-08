-- Migration: Update private tour schema and add capacity fields
-- Replace groupPricingTiers with simpler privateTour structure
-- Add missing capacity and infant fields
-- Date: 2025-10-08

-- Add new private_tour column
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "private_tour" json;

-- Add capacity fields (min/max)
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "min_capacity" integer NOT NULL DEFAULT 1;
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "max_capacity" integer NOT NULL DEFAULT 20;

-- Add infant capacity setting
ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "count_infants_toward_capacity" boolean NOT NULL DEFAULT false;

-- The old group_pricing_tiers column can remain for backward compatibility
-- Note: For existing tours using group_tiers pricing model,
-- application code should handle converting groupPricingTiers to privateTour format

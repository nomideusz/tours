-- Add 'private_tour' value to pricing_model enum
-- This is a safe, additive change that doesn't affect existing data
-- Run this manually when convenient

ALTER TYPE pricing_model ADD VALUE IF NOT EXISTS 'private_tour';

-- Verify the enum values
SELECT enum_range(NULL::pricing_model);


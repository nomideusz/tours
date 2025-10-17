-- ============================================================================
-- Rollback: Simplify Pricing Models
-- Date: 2025-10-02
-- Description: Reverts the pricing model simplification
-- ============================================================================

-- STEP 1: Convert participant_categories back to adult_child (if they match the pattern)
UPDATE tours 
SET 
    pricing_model = 'adult_child',
    price = (participant_categories->'categories'->0->>'price')::numeric,
    enable_pricing_tiers = true,
    pricing_tiers = jsonb_build_object(
        'adult', (participant_categories->'categories'->0->>'price')::numeric,
        'child', (participant_categories->'categories'->1->>'price')::numeric
    ),
    participant_categories = NULL
WHERE 
    pricing_model = 'participant_categories'
    AND jsonb_array_length(participant_categories->'categories') = 2
    AND participant_categories->'categories'->0->>'id' = 'adult'
    AND participant_categories->'categories'->1->>'id' = 'child';

-- STEP 2: Convert group_tiers with add-ons back to hybrid
UPDATE tours 
SET 
    pricing_model = 'hybrid'
WHERE 
    pricing_model = 'group_tiers'
    AND optional_addons IS NOT NULL
    AND jsonb_array_length(optional_addons->'addons') > 0;

-- Note: This rollback is not perfect as we cannot determine which tours
-- were originally adult_child vs participant_categories, or which were
-- originally group_tiers vs hybrid. Manual review may be needed.

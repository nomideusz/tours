-- ============================================================================
-- Update Beta 2 Promo Codes
-- 
-- Changes Beta 2 promo codes from 6 months free to 4 months free
-- Updates both the free_months value and the description text
-- ============================================================================

BEGIN;

-- Preview what will be updated (uncomment to see before applying)
/*
SELECT 
    code,
    description,
    free_months as current_free_months,
    discount_percentage,
    is_lifetime
FROM promo_codes
WHERE code IN ('BETA2', 'BETA2_GUIDE', 'BETA2_PRO');
*/

-- ============================================================================
-- Update BETA2_GUIDE (Essential plan)
-- ============================================================================
UPDATE promo_codes
SET 
    description = 'Beta 2 - Essential: 4 months free + 20% lifetime discount',
    free_months = 4,
    updated_at = NOW()
WHERE code = 'BETA2_GUIDE';

-- ============================================================================
-- Update BETA2_PRO (Premium plan)
-- ============================================================================
UPDATE promo_codes
SET 
    description = 'Beta 2 - Premium: 4 months free + 20% lifetime discount',
    free_months = 4,
    updated_at = NOW()
WHERE code = 'BETA2_PRO';

-- ============================================================================
-- Update BETA2 (General - any plan)
-- ============================================================================
UPDATE promo_codes
SET 
    description = 'Beta 2 - General: 4 months free + 20% lifetime discount (any plan)',
    free_months = 4,
    updated_at = NOW()
WHERE code = 'BETA2';

-- ============================================================================
-- Verify the updates
-- ============================================================================
SELECT 
    code,
    description,
    free_months,
    discount_percentage,
    is_lifetime,
    is_active,
    current_uses,
    max_uses
FROM promo_codes
WHERE code IN ('BETA2', 'BETA2_GUIDE', 'BETA2_PRO')
ORDER BY code;

-- Expected result:
-- BETA2       | Beta 2 - General: 4 months free + 20% lifetime discount (any plan) | 4 | 20 | true
-- BETA2_GUIDE | Beta 2 - Essential: 4 months free + 20% lifetime discount           | 4 | 20 | true
-- BETA2_PRO   | Beta 2 - Premium: 4 months free + 20% lifetime discount             | 4 | 20 | true

COMMIT;
-- ROLLBACK;  -- Uncomment to undo changes


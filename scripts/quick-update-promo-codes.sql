-- Quick Update: Change Beta 2 promo codes from 6 months to 4 months
-- Run this directly in pgweb

-- Single query to update all three promo codes at once
UPDATE promo_codes
SET 
    free_months = 4,
    description = CASE 
        WHEN code = 'BETA2_GUIDE' THEN 'Beta 2 - Essential: 4 months free + 20% lifetime discount'
        WHEN code = 'BETA2_PRO' THEN 'Beta 2 - Premium: 4 months free + 20% lifetime discount'
        WHEN code = 'BETA2' THEN 'Beta 2 - General: 4 months free + 20% lifetime discount (any plan)'
        ELSE description
    END,
    updated_at = NOW()
WHERE code IN ('BETA2', 'BETA2_GUIDE', 'BETA2_PRO');

-- Verify the changes
SELECT code, description, free_months, discount_percentage, is_lifetime
FROM promo_codes
WHERE code IN ('BETA2', 'BETA2_GUIDE', 'BETA2_PRO')
ORDER BY code;


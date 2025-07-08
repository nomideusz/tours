-- Production SQL to update EARLY2025 promo code
-- Changes: early_access (1 year free + 50% lifetime) -> lifetime_discount (50% forever)

-- First, let's check the current state
SELECT 
    code,
    description,
    type,
    discount_percentage,
    free_months,
    is_lifetime,
    current_uses,
    max_uses
FROM promo_codes 
WHERE code = 'EARLY2025';

-- Update the EARLY2025 promo code
UPDATE promo_codes 
SET 
    description = 'Early 2025 member - 50% discount forever',
    type = 'lifetime_discount',
    free_months = 0,
    updated_at = NOW()
WHERE code = 'EARLY2025';

-- Verify the update
SELECT 
    code,
    description,
    type,
    discount_percentage,
    free_months,
    is_lifetime,
    current_uses,
    max_uses,
    updated_at
FROM promo_codes 
WHERE code = 'EARLY2025';

-- Optional: Check if any users are currently using this code
SELECT 
    id,
    email,
    promo_code_used,
    subscription_discount_percentage,
    subscription_free_until,
    is_lifetime_discount,
    created_at
FROM users 
WHERE promo_code_used = 'EARLY2025'
ORDER BY created_at DESC; 
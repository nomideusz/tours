-- Promo Codes Management Queries
-- Useful SQL queries for managing and monitoring promo codes in production

-- =============================================================================
-- MONITORING QUERIES
-- =============================================================================

-- 1. Check promo code usage statistics
SELECT 
    code,
    type,
    COALESCE(discount_percentage, 0) || '%' as discount,
    COALESCE(free_months, 0) || ' months' as free_period,
    current_uses || '/' || COALESCE(max_uses::text, 'unlimited') as usage,
    CASE 
        WHEN is_active = false THEN 'Inactive'
        WHEN valid_until < NOW() THEN 'Expired'
        WHEN max_uses IS NOT NULL AND current_uses >= max_uses THEN 'Exhausted'
        ELSE 'Active'
    END as status,
    created_at::date as created
FROM promo_codes
ORDER BY current_uses DESC, code;

-- 2. Find users by promo code
SELECT 
    u.email,
    u.name,
    u.promo_code_used,
    u.subscription_plan,
    u.subscription_discount_percentage || '%' as discount,
    u.subscription_free_until,
    u.created_at::date as joined
FROM users u
WHERE u.promo_code_used IS NOT NULL
ORDER BY u.created_at DESC;

-- 3. Revenue impact analysis
SELECT 
    pc.code,
    COUNT(u.id) as users_count,
    AVG(u.subscription_discount_percentage) as avg_discount,
    -- Assuming €29/month average subscription price
    SUM(29 * u.subscription_discount_percentage / 100.0) as monthly_discount_amount,
    SUM(29 * u.subscription_discount_percentage / 100.0 * 12) as yearly_discount_amount
FROM promo_codes pc
LEFT JOIN users u ON u.promo_code_used = pc.code
WHERE u.subscription_plan != 'free'
GROUP BY pc.code
ORDER BY users_count DESC;

-- 4. Check expiring free trials
SELECT 
    email,
    name,
    promo_code_used,
    subscription_free_until::date as free_until,
    (subscription_free_until::date - CURRENT_DATE) as days_remaining
FROM users
WHERE subscription_free_until > NOW()
    AND subscription_free_until < NOW() + INTERVAL '7 days'
ORDER BY subscription_free_until;

-- =============================================================================
-- MANAGEMENT QUERIES
-- =============================================================================

-- 5. Create a new promo code
INSERT INTO promo_codes (code, description, type, discount_percentage, free_months, is_lifetime, max_uses, is_active)
VALUES 
    ('SUMMER2025', 'Summer 2025 special - 25% off for 3 months', 'percentage_discount', 25, 3, false, 100, true);

-- 6. Deactivate a promo code
UPDATE promo_codes 
SET is_active = false, 
    updated_at = NOW()
WHERE code = 'SUMMER2025';

-- 7. Extend a promo code's validity
UPDATE promo_codes 
SET valid_until = NOW() + INTERVAL '30 days',
    updated_at = NOW()
WHERE code = 'SUMMER2025';

-- 8. Apply promo benefits to a specific user manually
UPDATE users 
SET promo_code_used = 'PARTNER',
    subscription_discount_percentage = 100,
    is_lifetime_discount = true,
    early_access_member = true,
    updated_at = NOW()
WHERE email = 'partner@example.com';

-- 9. Remove promo benefits from a user
UPDATE users 
SET subscription_discount_percentage = 0,
    subscription_free_until = NULL,
    is_lifetime_discount = false,
    updated_at = NOW()
WHERE email = 'user@example.com';

-- =============================================================================
-- REPORTING QUERIES
-- =============================================================================

-- 10. Monthly promo code performance report
SELECT 
    DATE_TRUNC('month', u.created_at) as month,
    pc.code,
    COUNT(u.id) as new_users,
    SUM(CASE WHEN u.subscription_plan != 'free' THEN 1 ELSE 0 END) as paid_users,
    ROUND(AVG(u.subscription_discount_percentage), 2) as avg_discount
FROM users u
JOIN promo_codes pc ON u.promo_code_used = pc.code
WHERE u.created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', u.created_at), pc.code
ORDER BY month DESC, new_users DESC;

-- 11. Promo code conversion rates
WITH promo_stats AS (
    SELECT 
        pc.code,
        pc.current_uses as total_uses,
        COUNT(CASE WHEN u.subscription_plan != 'free' THEN 1 END) as converted_to_paid,
        COUNT(u.id) as total_users
    FROM promo_codes pc
    LEFT JOIN users u ON u.promo_code_used = pc.code
    GROUP BY pc.code, pc.current_uses
)
SELECT 
    code,
    total_uses,
    converted_to_paid,
    CASE 
        WHEN total_users > 0 
        THEN ROUND(converted_to_paid::numeric / total_users * 100, 2) 
        ELSE 0 
    END as conversion_rate_percent
FROM promo_stats
WHERE total_uses > 0
ORDER BY conversion_rate_percent DESC;

-- 12. Active discounts summary
SELECT 
    CASE 
        WHEN subscription_discount_percentage = 100 THEN 'Free Forever'
        WHEN is_lifetime_discount THEN 'Lifetime Discount'
        WHEN subscription_free_until > NOW() THEN 'Free Trial'
        ELSE 'Limited Time Discount'
    END as discount_type,
    COUNT(*) as user_count,
    AVG(subscription_discount_percentage) as avg_discount_percent
FROM users
WHERE (subscription_discount_percentage > 0 OR subscription_free_until > NOW())
    AND subscription_plan != 'free'
GROUP BY 
    CASE 
        WHEN subscription_discount_percentage = 100 THEN 'Free Forever'
        WHEN is_lifetime_discount THEN 'Lifetime Discount'
        WHEN subscription_free_until > NOW() THEN 'Free Trial'
        ELSE 'Limited Time Discount'
    END;

-- =============================================================================
-- CLEANUP QUERIES
-- =============================================================================

-- 13. Find and clean up expired free trials
UPDATE users 
SET subscription_free_until = NULL,
    updated_at = NOW()
WHERE subscription_free_until < NOW()
    AND subscription_free_until IS NOT NULL;

-- 14. Archive old inactive promo codes
-- First, check what would be archived
SELECT code, created_at, current_uses, max_uses 
FROM promo_codes 
WHERE is_active = false 
    AND created_at < NOW() - INTERVAL '6 months'
    AND current_uses = 0;

-- Then archive (delete) if needed
-- DELETE FROM promo_codes 
-- WHERE is_active = false 
--     AND created_at < NOW() - INTERVAL '6 months'
--     AND current_uses = 0;

-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- 15. Check for data inconsistencies
SELECT 
    'Users with invalid discount percentages' as issue,
    COUNT(*) as count
FROM users
WHERE subscription_discount_percentage NOT BETWEEN 0 AND 100

UNION ALL

SELECT 
    'Users with promo code but no benefits' as issue,
    COUNT(*) as count
FROM users
WHERE promo_code_used IS NOT NULL
    AND subscription_discount_percentage = 0
    AND subscription_free_until IS NULL

UNION ALL

SELECT 
    'Promo codes with invalid configuration' as issue,
    COUNT(*) as count
FROM promo_codes
WHERE (discount_percentage IS NULL AND free_months IS NULL)
    OR (discount_percentage NOT BETWEEN 0 AND 100); 
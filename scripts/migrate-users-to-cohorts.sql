-- ============================================================================
-- User Cohort Migration SQL Script
-- 
-- Assigns beta_group (cohort) to existing users based on their promo codes
-- and subscription discount percentages.
-- 
-- Safe to run multiple times (idempotent) - only updates users who don't 
-- already have a cohort assigned.
-- ============================================================================

BEGIN;

-- Preview what will be updated (comment out BEGIN; and run this first to preview)
-- Uncomment the SELECT statements below to see what would be changed:

/*
SELECT 
    email, 
    name,
    beta_group as current_cohort,
    subscription_discount_percentage,
    is_lifetime_discount,
    early_access_member,
    promo_code_used,
    CASE
        WHEN beta_group IS NOT NULL THEN 'Already assigned: ' || beta_group
        WHEN subscription_discount_percentage = 30 AND is_lifetime_discount = true THEN 'Will assign: beta_1 (30% discount)'
        WHEN promo_code_used = 'BETA_APPRECIATION' THEN 'Will assign: beta_1 (BETA_APPRECIATION)'
        WHEN early_access_member = true THEN 'Will assign: beta_1 (early access)'
        WHEN subscription_discount_percentage = 20 AND is_lifetime_discount = true THEN 'Will assign: beta_2 (20% discount)'
        WHEN promo_code_used LIKE 'BETA2%' THEN 'Will assign: beta_2 (BETA2 code)'
        ELSE 'No change (will default to public)'
    END as action
FROM users
ORDER BY 
    CASE
        WHEN beta_group IS NOT NULL THEN 1
        WHEN subscription_discount_percentage = 30 AND is_lifetime_discount = true THEN 2
        WHEN promo_code_used = 'BETA_APPRECIATION' THEN 2
        WHEN early_access_member = true THEN 2
        WHEN subscription_discount_percentage = 20 AND is_lifetime_discount = true THEN 3
        WHEN promo_code_used LIKE 'BETA2%' THEN 3
        ELSE 4
    END;
*/

-- ============================================================================
-- ACTUAL MIGRATION - Assign Beta 1 Cohort
-- ============================================================================
-- Update users with 30% lifetime discount to Beta 1
UPDATE users
SET 
    beta_group = 'beta_1',
    updated_at = NOW()
WHERE 
    beta_group IS NULL  -- Only update if not already assigned
    AND (
        -- 30% lifetime discount
        (subscription_discount_percentage = 30 AND is_lifetime_discount = true)
        -- BETA_APPRECIATION promo code
        OR promo_code_used = 'BETA_APPRECIATION'
        -- Early access member flag
        OR early_access_member = true
    );

-- ============================================================================
-- ACTUAL MIGRATION - Assign Beta 2 Cohort
-- ============================================================================
-- Update users with 20% lifetime discount to Beta 2
UPDATE users
SET 
    beta_group = 'beta_2',
    updated_at = NOW()
WHERE 
    beta_group IS NULL  -- Only update if not already assigned
    AND (
        -- 20% lifetime discount
        (subscription_discount_percentage = 20 AND is_lifetime_discount = true)
        -- BETA2* promo codes
        OR promo_code_used LIKE 'BETA2%'
    );

-- ============================================================================
-- Summary of changes
-- ============================================================================
SELECT 
    beta_group,
    COUNT(*) as user_count,
    STRING_AGG(email, ', ') as users
FROM users
GROUP BY beta_group
ORDER BY 
    CASE 
        WHEN beta_group = 'beta_1' THEN 1
        WHEN beta_group = 'beta_2' THEN 2
        WHEN beta_group = 'public' THEN 3
        ELSE 4
    END;

-- Uncomment COMMIT to apply changes, or ROLLBACK to cancel
COMMIT;
-- ROLLBACK;


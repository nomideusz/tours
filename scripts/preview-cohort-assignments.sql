-- ============================================================================
-- Preview Cohort Assignments (Read-Only)
-- 
-- Run this query in pgweb to preview which users will be assigned to which
-- cohorts WITHOUT making any changes to the database.
-- ============================================================================

SELECT 
    email, 
    name,
    beta_group as current_cohort,
    subscription_discount_percentage,
    is_lifetime_discount,
    early_access_member,
    promo_code_used,
    subscription_plan,
    -- Determine what cohort will be assigned
    CASE
        WHEN beta_group IS NOT NULL THEN '✓ Already assigned: ' || beta_group
        WHEN subscription_discount_percentage = 30 AND is_lifetime_discount = true THEN '→ Will assign: beta_1 (30% discount)'
        WHEN promo_code_used = 'BETA_APPRECIATION' THEN '→ Will assign: beta_1 (BETA_APPRECIATION)'
        WHEN early_access_member = true THEN '→ Will assign: beta_1 (early access)'
        WHEN subscription_discount_percentage = 20 AND is_lifetime_discount = true THEN '→ Will assign: beta_2 (20% discount)'
        WHEN promo_code_used LIKE 'BETA2%' THEN '→ Will assign: beta_2 (BETA2 code)'
        ELSE '• No change (defaults to public cohort)'
    END as migration_action
FROM users
ORDER BY 
    -- Group by action type for easier reading
    CASE
        WHEN beta_group IS NOT NULL THEN 1
        WHEN subscription_discount_percentage = 30 AND is_lifetime_discount = true THEN 2
        WHEN promo_code_used = 'BETA_APPRECIATION' THEN 2
        WHEN early_access_member = true THEN 2
        WHEN subscription_discount_percentage = 20 AND is_lifetime_discount = true THEN 3
        WHEN promo_code_used LIKE 'BETA2%' THEN 3
        ELSE 4
    END,
    email;

-- Summary counts by cohort
SELECT 
    '=== SUMMARY ===' as section,
    '' as detail;

SELECT 
    CASE 
        WHEN beta_group = 'beta_1' THEN '🥇 Beta 1 (30% lifetime + 1yr free)'
        WHEN beta_group = 'beta_2' THEN '🥈 Beta 2 (20% lifetime + 4mo free)'
        WHEN beta_group = 'public' THEN '🌍 Public (full price + 14d trial)'
        ELSE '⚪ Unassigned (will default to public)'
    END as cohort_description,
    COUNT(*) as user_count
FROM users
GROUP BY beta_group
ORDER BY 
    CASE 
        WHEN beta_group = 'beta_1' THEN 1
        WHEN beta_group = 'beta_2' THEN 2
        WHEN beta_group = 'public' THEN 3
        ELSE 4
    END;


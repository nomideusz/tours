-- Rollback Script: Remove Promo Codes Functionality
-- USE WITH CAUTION: This will remove all promo code data
-- Consider backing up data before running this script

BEGIN;

-- 1. Backup promo code data before deletion (optional)
CREATE TABLE IF NOT EXISTS promo_codes_backup AS 
SELECT * FROM promo_codes;

CREATE TABLE IF NOT EXISTS users_promo_backup AS 
SELECT 
    id,
    email,
    promo_code_used,
    subscription_discount_percentage,
    subscription_free_until,
    is_lifetime_discount,
    early_access_member
FROM users
WHERE promo_code_used IS NOT NULL;

-- 2. Remove constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_subscription_discount_percentage;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS check_discount_percentage;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS check_free_months_positive;
ALTER TABLE promo_codes DROP CONSTRAINT IF EXISTS check_current_uses_positive;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_users_promo_code_used;
DROP INDEX IF EXISTS idx_users_subscription_discount_percentage;
DROP INDEX IF EXISTS idx_users_subscription_free_until;
DROP INDEX IF EXISTS idx_users_early_access_member;

DROP INDEX IF EXISTS idx_promo_codes_code;
DROP INDEX IF EXISTS idx_promo_codes_type;
DROP INDEX IF EXISTS idx_promo_codes_is_active;
DROP INDEX IF EXISTS idx_promo_codes_valid_from;
DROP INDEX IF EXISTS idx_promo_codes_valid_until;
DROP INDEX IF EXISTS idx_promo_codes_current_uses;

-- 4. Drop trigger
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;

-- 5. Remove columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS promo_code_used;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_discount_percentage;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_free_until;
ALTER TABLE users DROP COLUMN IF EXISTS is_lifetime_discount;
ALTER TABLE users DROP COLUMN IF EXISTS early_access_member;

-- 6. Drop promo_codes table
DROP TABLE IF EXISTS promo_codes;

-- 7. Verify rollback
DO $$ 
DECLARE
    promo_table_exists BOOLEAN;
    user_columns_count INTEGER;
BEGIN
    -- Check if promo_codes table still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'promo_codes'
    ) INTO promo_table_exists;
    
    -- Count promo-related user columns
    SELECT COUNT(*) INTO user_columns_count
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('promo_code_used', 'subscription_discount_percentage', 
                        'subscription_free_until', 'is_lifetime_discount', 'early_access_member');
    
    -- Output verification
    RAISE NOTICE '=== Rollback Verification ===';
    RAISE NOTICE 'Promo codes table removed: %', NOT promo_table_exists;
    RAISE NOTICE 'User promo columns removed: %', user_columns_count = 0;
    
    IF promo_table_exists OR user_columns_count > 0 THEN
        RAISE EXCEPTION 'Rollback verification failed!';
    END IF;
END $$;

COMMIT;

-- Post-rollback report
SELECT 
    'Backup Tables Created' as status,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'promo_codes_backup') as promo_codes_backup,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users_promo_backup') as users_promo_backup;

-- To restore from backup (if needed):
-- INSERT INTO promo_codes SELECT * FROM promo_codes_backup;
-- UPDATE users u SET 
--     promo_code_used = b.promo_code_used,
--     subscription_discount_percentage = b.subscription_discount_percentage,
--     subscription_free_until = b.subscription_free_until,
--     is_lifetime_discount = b.is_lifetime_discount,
--     early_access_member = b.early_access_member
-- FROM users_promo_backup b
-- WHERE u.id = b.id; 
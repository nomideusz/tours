-- Production Migration Script: Add Promo Codes Functionality
-- This script safely adds promo code features to an existing production database
-- It checks for existing objects before creating them to avoid errors

BEGIN;

-- 1. Create promo_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'early_access', 'lifetime_discount', 'free_period', 'percentage_discount'
    
    -- Benefit details
    discount_percentage INTEGER, -- 0-100
    free_months INTEGER, -- Number of free months
    is_lifetime BOOLEAN NOT NULL DEFAULT FALSE, -- If discount applies forever
    
    -- Usage limits
    max_uses INTEGER, -- NULL for unlimited
    current_uses INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE, -- NULL for no expiry
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Add new columns to users table (only if they don't exist)
DO $$ 
BEGIN
    -- Add promo_code_used column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'promo_code_used') THEN
        ALTER TABLE users ADD COLUMN promo_code_used VARCHAR(50);
    END IF;
    
    -- Add subscription_discount_percentage column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_discount_percentage') THEN
        ALTER TABLE users ADD COLUMN subscription_discount_percentage INTEGER DEFAULT 0;
    END IF;
    
    -- Add subscription_free_until column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'subscription_free_until') THEN
        ALTER TABLE users ADD COLUMN subscription_free_until TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add is_lifetime_discount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_lifetime_discount') THEN
        ALTER TABLE users ADD COLUMN is_lifetime_discount BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add early_access_member column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'early_access_member') THEN
        ALTER TABLE users ADD COLUMN early_access_member BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_promo_code_used ON users(promo_code_used);
CREATE INDEX IF NOT EXISTS idx_users_subscription_discount_percentage ON users(subscription_discount_percentage);
CREATE INDEX IF NOT EXISTS idx_users_subscription_free_until ON users(subscription_free_until);
CREATE INDEX IF NOT EXISTS idx_users_early_access_member ON users(early_access_member);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_type ON promo_codes(type);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_from ON promo_codes(valid_from);
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_until ON promo_codes(valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_codes_current_uses ON promo_codes(current_uses);

-- 4. Add constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Add constraint for users.subscription_discount_percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_subscription_discount_percentage') THEN
        ALTER TABLE users ADD CONSTRAINT check_subscription_discount_percentage 
        CHECK (subscription_discount_percentage >= 0 AND subscription_discount_percentage <= 100);
    END IF;
    
    -- Add constraint for promo_codes.discount_percentage
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_discount_percentage') THEN
        ALTER TABLE promo_codes ADD CONSTRAINT check_discount_percentage 
        CHECK (discount_percentage >= 0 AND discount_percentage <= 100);
    END IF;
    
    -- Add constraint for promo_codes.free_months
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_free_months_positive') THEN
        ALTER TABLE promo_codes ADD CONSTRAINT check_free_months_positive 
        CHECK (free_months >= 0);
    END IF;
    
    -- Add constraint for promo_codes.current_uses
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_current_uses_positive') THEN
        ALTER TABLE promo_codes ADD CONSTRAINT check_current_uses_positive 
        CHECK (current_uses >= 0);
    END IF;
END $$;

-- 5. Create or replace trigger for promo_codes updated_at
DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at 
    BEFORE UPDATE ON promo_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert default promo codes (only if they don't exist)
INSERT INTO promo_codes (code, description, type, discount_percentage, free_months, is_lifetime, max_uses, is_active)
VALUES 
    -- First 10 users: 1 year free then 50% lifetime discount
    ('FOUNDER', 'Founder member - 1 year free + 50% lifetime discount', 'early_access', 50, 12, true, 10, true),
    ('EARLY2025', 'Early 2025 member - 1 year free + 50% lifetime discount', 'early_access', 50, 12, true, 10, true),
    
    -- Various discount codes
    ('PREMIUM50', '50% lifetime discount', 'lifetime_discount', 50, 0, true, NULL, true),
    ('HALFOFF', '50% discount for 6 months', 'percentage_discount', 50, 6, false, NULL, true),
    ('TOURGUIDE25', '25% lifetime discount for tour guides', 'lifetime_discount', 25, 0, true, NULL, true),
    
    -- Free period codes
    ('FREETRIAL6', '6 months free trial', 'free_period', 0, 6, false, NULL, true),
    ('YEARFREE', '1 year free access', 'free_period', 0, 12, false, 50, true),
    
    -- Partner codes (free forever)
    ('PARTNER', 'Partner - Free forever', 'lifetime_discount', 100, 0, true, NULL, true),
    ('INFLUENCER', 'Influencer partnership - Free forever', 'lifetime_discount', 100, 0, true, 20, true),
    
    -- Limited time offers
    ('LAUNCH2025', 'Launch special - 3 months free + 30% lifetime', 'early_access', 30, 3, true, 100, true),
    ('BETAUSER', 'Beta user appreciation - 40% lifetime', 'lifetime_discount', 40, 0, true, 50, true)
ON CONFLICT (code) DO NOTHING;

-- 7. Verify the migration
DO $$ 
DECLARE
    promo_table_exists BOOLEAN;
    user_columns_count INTEGER;
    promo_codes_count INTEGER;
BEGIN
    -- Check if promo_codes table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'promo_codes'
    ) INTO promo_table_exists;
    
    -- Count new user columns
    SELECT COUNT(*) INTO user_columns_count
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name IN ('promo_code_used', 'subscription_discount_percentage', 
                        'subscription_free_until', 'is_lifetime_discount', 'early_access_member');
    
    -- Count promo codes
    SELECT COUNT(*) INTO promo_codes_count FROM promo_codes;
    
    -- Output verification
    RAISE NOTICE '=== Migration Verification ===';
    RAISE NOTICE 'Promo codes table exists: %', promo_table_exists;
    RAISE NOTICE 'New user columns added: %/5', user_columns_count;
    RAISE NOTICE 'Promo codes inserted: %', promo_codes_count;
    
    IF NOT promo_table_exists OR user_columns_count < 5 THEN
        RAISE EXCEPTION 'Migration verification failed!';
    END IF;
END $$;

COMMIT;

-- Post-migration report
SELECT 
    'Promo Codes Summary' as report_type,
    COUNT(*) as total_codes,
    COUNT(CASE WHEN is_active THEN 1 END) as active_codes,
    COUNT(CASE WHEN max_uses IS NOT NULL THEN 1 END) as limited_codes
FROM promo_codes

UNION ALL

SELECT 
    'User Promo Usage' as report_type,
    COUNT(CASE WHEN promo_code_used IS NOT NULL THEN 1 END) as users_with_promo,
    COUNT(CASE WHEN subscription_discount_percentage > 0 THEN 1 END) as users_with_discount,
    COUNT(CASE WHEN subscription_free_until > NOW() THEN 1 END) as users_in_free_trial
FROM users; 
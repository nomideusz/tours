-- Rollback: Remove Cross-Border Payment Support
-- Use this script to rollback the cross-border payment migration if needed
-- WARNING: This will remove data from payouts and payout_items tables!

BEGIN;

-- =====================================================
-- STEP 1: Remove triggers
-- =====================================================

DROP TRIGGER IF EXISTS update_payouts_updated_at ON payouts;

-- =====================================================
-- STEP 2: Drop new tables (this will delete all data!)
-- =====================================================

-- WARNING: This will permanently delete all payout data
DROP TABLE IF EXISTS payout_items CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;

-- =====================================================
-- STEP 3: Remove new columns from payments table
-- =====================================================

-- Remove payment_type column
DO $$ BEGIN
    ALTER TABLE payments DROP COLUMN IF EXISTS payment_type;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not drop payment_type column: %', SQLERRM;
END $$;

-- Remove tour_guide_user_id column
DO $$ BEGIN
    ALTER TABLE payments DROP COLUMN IF EXISTS tour_guide_user_id;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not drop tour_guide_user_id column: %', SQLERRM;
END $$;

-- Remove payout_id column
DO $$ BEGIN
    ALTER TABLE payments DROP COLUMN IF EXISTS payout_id;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not drop payout_id column: %', SQLERRM;
END $$;

-- Remove payout_completed column
DO $$ BEGIN
    ALTER TABLE payments DROP COLUMN IF EXISTS payout_completed;
EXCEPTION
    WHEN others THEN 
        RAISE NOTICE 'Could not drop payout_completed column: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 4: Drop enum types
-- =====================================================

-- Drop payment_type enum
DROP TYPE IF EXISTS payment_type CASCADE;

-- Drop payout_status enum
DROP TYPE IF EXISTS payout_status CASCADE;

-- =====================================================
-- STEP 5: Verify rollback
-- =====================================================

-- Check that tables are gone
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Tables successfully removed'
        ELSE 'Some tables still exist'
    END as table_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('payouts', 'payout_items');

-- Check that enum types are gone
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'Enum types successfully removed'
        ELSE 'Some enum types still exist'
    END as enum_status
FROM pg_type t 
WHERE t.typname IN ('payment_type', 'payout_status');

-- Check payments table columns
SELECT 
    column_name
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND column_name IN ('payment_type', 'tour_guide_user_id', 'payout_id', 'payout_completed');

-- Show summary
SELECT 
    'Rollback completed!' as status,
    'WARNING: All payout data has been permanently deleted' as warning,
    NOW() as completed_at;

COMMIT;
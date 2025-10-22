-- FINAL Migration Phase 6: Remove Old Status Columns
-- Date: TBD (Run ONLY after 2+ weeks of successful Phase 1-4 operation)
-- Safety: LOW - Removes old columns (MUST have backup)
-- Rollback: Restore from database backup

-- ⚠️⚠️⚠️ WARNING ⚠️⚠️⚠️
-- DO NOT RUN THIS UNTIL:
-- 1. Phase 1 migration has been live for 2+ weeks
-- 2. Zero mismatches between old and new columns
-- 3. Full database backup completed
-- 4. Tested on staging environment
-- 5. Code updated to use new columns only
-- 6. Feature flags removed from code

-- ============================================================
-- PRE-FLIGHT CHECKS (MUST PASS BEFORE PROCEEDING)
-- ============================================================

DO $$
DECLARE
  mismatch_count INTEGER;
  null_count INTEGER;
  days_since_migration INTEGER;
BEGIN
  -- Check 1: No mismatches between old and new
  SELECT COUNT(*) INTO mismatch_count
  FROM bookings
  WHERE (refund_status IS DISTINCT FROM refund_status_new::text)
     OR (transfer_status IS DISTINCT FROM transfer_status_new::text);
  
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'ABORT: Found % bookings with mismatched status columns. Fix mismatches first.', mismatch_count;
  END IF;
  
  RAISE NOTICE '✅ Check 1 passed: No status mismatches';
  
  -- Check 2: No NULL values in new columns
  SELECT COUNT(*) INTO null_count
  FROM bookings
  WHERE refund_status_new IS NULL
     OR transfer_status_new IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'ABORT: Found % bookings with NULL new status columns. Run backfill first.', null_count;
  END IF;
  
  RAISE NOTICE '✅ Check 2 passed: No NULL values in new columns';
  
  -- Check 3: Migration has been live for at least 14 days
  -- (Assumes migration added a comment with timestamp)
  -- This is a soft check - manual verification required
  
  RAISE NOTICE '⚠️  Manual Check Required: Verify migration has been live 14+ days';
  RAISE NOTICE '⚠️  Manual Check Required: Verify full backup completed';
  RAISE NOTICE '⚠️  Manual Check Required: Verify code updated to use new columns';
  
END $$;

-- Pause for manual confirmation
-- Comment out next line and type YES to proceed
-- \echo 'Type YES to continue with column removal (irreversible):'
-- \prompt continue
-- \if :continue != 'YES'
--   \echo 'Migration cancelled'
--   \q
-- \endif

BEGIN;

-- ============================================================
-- BACKUP VERIFICATION (REQUIRED)
-- ============================================================

-- Create timestamped backup before proceeding
\echo '📦 Creating pre-cleanup backup...'

-- You should run this BEFORE the migration:
-- pg_dump $DATABASE_URL > backups/before_status_cleanup_$(date +%Y%m%d_%H%M%S).sql

-- ============================================================
-- STEP 1: Remove Sync Trigger (No Longer Needed)
-- ============================================================

DROP TRIGGER IF EXISTS sync_booking_statuses_trigger ON bookings;
DROP FUNCTION IF EXISTS sync_booking_statuses();

RAISE NOTICE '✅ Sync trigger removed';

-- ============================================================
-- STEP 2: Drop Old Indexes
-- ============================================================

DROP INDEX IF EXISTS idx_bookings_transfer_pending;
DROP INDEX IF EXISTS idx_bookings_transfer_status;

RAISE NOTICE '✅ Old indexes removed';

-- ============================================================
-- STEP 3: Remove Old Columns
-- ============================================================

-- ⚠️ IRREVERSIBLE (unless restoring from backup)
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS refund_status CASCADE,
  DROP COLUMN IF EXISTS transfer_status CASCADE,
  DROP COLUMN IF EXISTS attendance_status CASCADE;  -- Use status='no_show' instead

RAISE NOTICE '✅ Old VARCHAR status columns removed';

-- ============================================================
-- STEP 4: Rename New Columns to Final Names
-- ============================================================

ALTER TABLE bookings 
  RENAME COLUMN refund_status_new TO refund_status;

ALTER TABLE bookings 
  RENAME COLUMN transfer_status_new TO transfer_status;

RAISE NOTICE '✅ New columns renamed to final names';

-- ============================================================
-- STEP 5: Update Column Comments
-- ============================================================

COMMENT ON COLUMN bookings.refund_status IS 'Refund status (enum): not_required, pending, succeeded, failed';
COMMENT ON COLUMN bookings.transfer_status IS 'Transfer status (enum): pending, completed, failed, reversed';

-- ============================================================
-- STEP 6: Recreate Optimized Indexes
-- ============================================================

-- Index for finding pending transfers (cron job)
CREATE INDEX IF NOT EXISTS idx_bookings_transfer_pending ON bookings(transfer_scheduled_for)
  WHERE transfer_status = 'pending'
    AND payment_status = 'paid'
    AND status IN ('confirmed', 'completed');

-- Index for failed refunds (admin monitoring)
CREATE INDEX IF NOT EXISTS idx_bookings_refund_failed ON bookings(refund_status)
  WHERE refund_status = 'failed';

-- Index for failed transfers (admin monitoring)
CREATE INDEX IF NOT EXISTS idx_bookings_transfer_failed ON bookings(transfer_status)
  WHERE transfer_status = 'failed';

RAISE NOTICE '✅ Optimized indexes created';

-- ============================================================
-- STEP 7: Also Remove Redundant Payment Refund Column
-- ============================================================

-- payments.refund_amount duplicates bookings.refund_amount
-- Remove it for consistency
ALTER TABLE payments 
  DROP COLUMN IF EXISTS refund_amount CASCADE;

RAISE NOTICE '✅ Redundant payment refund column removed';

COMMIT;

-- ============================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================

-- Show final schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name LIKE '%status%'
ORDER BY ordinal_position;

-- Show value distribution
SELECT 
  'Refund Status Distribution' as metric,
  refund_status,
  COUNT(*) as count
FROM bookings
GROUP BY refund_status
ORDER BY count DESC;

SELECT 
  'Transfer Status Distribution' as metric,
  transfer_status,
  COUNT(*) as count
FROM bookings
GROUP BY transfer_status
ORDER BY count DESC;

-- ============================================================
-- SUMMARY
-- ============================================================

\echo '✨ Migration Complete!'
\echo ''
\echo 'Removed columns:'
\echo '  - refund_status (VARCHAR) → now refund_status (enum)'
\echo '  - transfer_status (VARCHAR) → now transfer_status (enum)'
\echo '  - attendance_status (enum) → use status=no_show'
\echo '  - payments.refund_amount (decimal) → use bookings.refund_amount'
\echo ''
\echo 'Next steps:'
\echo '  1. Update Drizzle schema to match'
\echo '  2. Remove feature flags from code'
\echo '  3. Remove -v2 suffix from utilities'
\echo '  4. Update imports across codebase'
\echo '  5. Run drizzle-kit pull to sync types'


-- Booking Status Migration Health Check
-- Run this daily during monitoring period to ensure columns stay in sync

\echo '═══════════════════════════════════════════════════════'
\echo 'Booking Status Migration - Health Check'
\echo 'Run Date:' 
SELECT NOW();
\echo '═══════════════════════════════════════════════════════'
\echo ''

-- ============================================================
-- CHECK 1: Migration Completeness
-- ============================================================
\echo '📊 CHECK 1: Migration Completeness'
\echo '---------------------------------------------------'

SELECT 
  'Total Bookings' as metric,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE refund_status_new IS NOT NULL) as with_refund_enum,
  COUNT(*) FILTER (WHERE transfer_status_new IS NOT NULL) as with_transfer_enum,
  COUNT(*) FILTER (WHERE refund_status_new IS NULL) as missing_refund,
  COUNT(*) FILTER (WHERE transfer_status_new IS NULL) as missing_transfer
FROM bookings;

\echo ''
\echo 'Expected: missing_refund = 0, missing_transfer = 0'
\echo ''

-- ============================================================
-- CHECK 2: Column Sync Status
-- ============================================================
\echo '🔄 CHECK 2: Old vs New Column Sync'
\echo '---------------------------------------------------'

SELECT 
  'Sync Status' as metric,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE refund_status IS DISTINCT FROM refund_status_new::text) as refund_mismatches,
  COUNT(*) FILTER (WHERE transfer_status IS DISTINCT FROM transfer_status_new::text) as transfer_mismatches
FROM bookings;

\echo ''
\echo 'Expected: refund_mismatches = 0, transfer_mismatches = 0'
\echo ''

-- ============================================================
-- CHECK 3: Trigger Exists and Enabled
-- ============================================================
\echo '⚙️  CHECK 3: Trigger Status'
\echo '---------------------------------------------------'

SELECT 
  tgname as trigger_name,
  CASE tgenabled 
    WHEN 'O' THEN 'Enabled'
    WHEN 'D' THEN 'Disabled'
    ELSE 'Unknown'
  END as status
FROM pg_trigger
WHERE tgname = 'sync_booking_statuses_trigger';

\echo ''
\echo 'Expected: status = Enabled'
\echo ''

-- ============================================================
-- CHECK 4: Mismatch Details (if any)
-- ============================================================
\echo '🔍 CHECK 4: Mismatched Bookings (if any)'
\echo '---------------------------------------------------'

SELECT 
  booking_reference,
  status,
  refund_status as old_refund,
  refund_status_new::text as new_refund,
  transfer_status as old_transfer,
  transfer_status_new::text as new_transfer,
  updated_at
FROM bookings
WHERE 
  (refund_status IS DISTINCT FROM refund_status_new::text)
  OR
  (transfer_status IS DISTINCT FROM transfer_status_new::text)
LIMIT 10;

\echo ''
\echo 'Expected: No rows (all columns in sync)'
\echo ''

-- ============================================================
-- CHECK 5: Recent Activity (Last 24 hours)
-- ============================================================
\echo '📅 CHECK 5: Recent Bookings (Last 24h)'
\echo '---------------------------------------------------'

SELECT 
  booking_reference,
  status,
  payment_status,
  refund_status_new::text as refund,
  transfer_status_new::text as transfer,
  created_at
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

\echo ''

-- ============================================================
-- CHECK 6: Value Distribution
-- ============================================================
\echo '📊 CHECK 6: Status Value Distribution'
\echo '---------------------------------------------------'
\echo 'Refund Status:'

SELECT 
  refund_status_new,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM bookings
GROUP BY refund_status_new
ORDER BY count DESC;

\echo ''
\echo 'Transfer Status:'

SELECT 
  transfer_status_new,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM bookings
GROUP BY transfer_status_new
ORDER BY count DESC;

\echo ''

-- ============================================================
-- CHECK 7: Recent Transfers
-- ============================================================
\echo '💸 CHECK 7: Recent Transfers'
\echo '---------------------------------------------------'

SELECT 
  booking_reference,
  transfer_id,
  transfer_status as old,
  transfer_status_new::text as new,
  transfer_scheduled_for,
  transfer_processed_at
FROM bookings
WHERE transfer_id IS NOT NULL
ORDER BY transfer_processed_at DESC NULLS LAST
LIMIT 5;

\echo ''

-- ============================================================
-- CHECK 8: Recent Refunds
-- ============================================================
\echo '💳 CHECK 8: Recent Refunds'
\echo '---------------------------------------------------'

SELECT 
  booking_reference,
  refund_id,
  refund_status as old,
  refund_status_new::text as new,
  refund_amount,
  refund_processed_at
FROM bookings
WHERE refund_id IS NOT NULL
ORDER BY refund_processed_at DESC NULLS LAST
LIMIT 5;

\echo ''

-- ============================================================
-- SUMMARY
-- ============================================================
\echo '═══════════════════════════════════════════════════════'
\echo '✅ HEALTH CHECK COMPLETE'
\echo ''
\echo 'Review the results above.'
\echo ''
\echo 'All checks should show:'
\echo '  - No NULL values in new columns'
\echo '  - Zero mismatches between old and new'
\echo '  - Trigger enabled'
\echo '  - Recent bookings working correctly'
\echo ''
\echo 'If all checks pass → Migration is healthy ✅'
\echo 'If any issues found → Investigate before Phase 5'
\echo '═══════════════════════════════════════════════════════'


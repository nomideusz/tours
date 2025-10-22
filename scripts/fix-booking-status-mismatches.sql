-- Fix Booking Status Mismatches
-- Run this if health check shows mismatches between old and new columns

BEGIN;

\echo '🔧 Fixing booking status mismatches...'

-- Show mismatches before fix
\echo ''
\echo 'Mismatches BEFORE fix:'
SELECT 
  COUNT(*) FILTER (WHERE refund_status IS DISTINCT FROM refund_status_new::text) as refund_mismatches,
  COUNT(*) FILTER (WHERE transfer_status IS DISTINCT FROM transfer_status_new::text) as transfer_mismatches
FROM bookings;

-- Fix refund_status mismatches (sync old to new)
UPDATE bookings
SET refund_status_new = CASE
  WHEN refund_status IS NULL THEN 'not_required'
  WHEN refund_status ILIKE 'succeeded' THEN 'succeeded'
  WHEN refund_status ILIKE 'success' THEN 'succeeded'
  WHEN refund_status ILIKE 'failed' THEN 'failed'
  WHEN refund_status ILIKE 'pending' THEN 'pending'
  WHEN refund_status ILIKE 'processing' THEN 'pending'
  ELSE 'not_required'
END
WHERE refund_status IS DISTINCT FROM refund_status_new::text;

-- Fix transfer_status mismatches (sync old to new)
UPDATE bookings
SET transfer_status_new = CASE
  WHEN transfer_status IS NULL THEN 'pending'
  WHEN transfer_status ILIKE 'completed' THEN 'completed'
  WHEN transfer_status ILIKE 'complete' THEN 'completed'
  WHEN transfer_status ILIKE 'succeeded' THEN 'completed'
  WHEN transfer_status ILIKE 'failed' THEN 'failed'
  WHEN transfer_status ILIKE 'reversed' THEN 'reversed'
  WHEN transfer_status ILIKE 'pending' THEN 'pending'
  ELSE 'pending'
END
WHERE transfer_status IS DISTINCT FROM transfer_status_new::text;

-- Show mismatches after fix
\echo ''
\echo 'Mismatches AFTER fix:'
SELECT 
  COUNT(*) FILTER (WHERE refund_status IS DISTINCT FROM refund_status_new::text) as refund_mismatches,
  COUNT(*) FILTER (WHERE transfer_status IS DISTINCT FROM transfer_status_new::text) as transfer_mismatches
FROM bookings;

COMMIT;

\echo ''
\echo '✅ Mismatch fix complete'
\echo ''
\echo 'If mismatches are still not zero:'
\echo '  1. Check trigger is enabled'
\echo '  2. Look for unusual VARCHAR values'
\echo '  3. Check application logs for errors'


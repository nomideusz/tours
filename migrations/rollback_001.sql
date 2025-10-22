-- Rollback Migration 001: Remove Booking Status Enums
-- Use this if Phase 1 causes any issues

BEGIN;

-- Drop trigger
DROP TRIGGER IF EXISTS sync_booking_statuses_trigger ON bookings;

-- Drop function
DROP FUNCTION IF EXISTS sync_booking_statuses();

-- Drop indexes
DROP INDEX IF EXISTS idx_bookings_refund_status_new;
DROP INDEX IF EXISTS idx_bookings_transfer_status_new;

-- Remove new columns
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS refund_status_new,
  DROP COLUMN IF EXISTS transfer_status_new;

-- Drop enum types
DROP TYPE IF EXISTS refund_status_enum;
DROP TYPE IF EXISTS transfer_status_enum;

COMMIT;

-- Verify rollback
SELECT 
  'Rollback Complete' as status,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE refund_status IS NOT NULL) as with_old_refund,
  COUNT(*) FILTER (WHERE transfer_status IS NOT NULL) as with_old_transfer
FROM bookings;

COMMENT ON TABLE bookings IS 'Rollback complete - using original VARCHAR status columns';


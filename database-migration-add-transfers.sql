-- Migration: Add Transfer Tracking for Delayed Payouts
-- Date: 2025-10-21
-- Description: Enables platform-held payments with delayed transfers to tour guides

-- Add transfer tracking fields to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS transfer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS transfer_scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS transfer_processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS transfer_notes TEXT;

COMMENT ON COLUMN bookings.transfer_id IS 'Stripe transfer ID (tr_xxx) when funds sent to guide';
COMMENT ON COLUMN bookings.transfer_status IS 'Transfer status: pending, completed, failed';
COMMENT ON COLUMN bookings.transfer_scheduled_for IS 'When funds should be transferred to guide (after cancellation window)';
COMMENT ON COLUMN bookings.transfer_processed_at IS 'When transfer was actually processed';
COMMENT ON COLUMN bookings.transfer_notes IS 'Notes about transfer processing or failures';

-- Create index for efficient transfer job queries
CREATE INDEX IF NOT EXISTS idx_bookings_transfer_pending ON bookings(transfer_scheduled_for)
  WHERE transfer_id IS NULL 
    AND payment_status = 'paid' 
    AND status IN ('confirmed', 'completed');

-- Create index for transfer status lookups
CREATE INDEX IF NOT EXISTS idx_bookings_transfer_status ON bookings(transfer_status)
  WHERE transfer_id IS NOT NULL;

-- Set transfer_scheduled_for for existing confirmed bookings
-- This gives a 7-day window for existing bookings (safe default)
UPDATE bookings
SET transfer_scheduled_for = time_slots.start_time - INTERVAL '7 days'
FROM time_slots
WHERE bookings.time_slot_id = time_slots.id
  AND bookings.payment_status = 'paid'
  AND bookings.status IN ('confirmed', 'completed')
  AND bookings.transfer_scheduled_for IS NULL
  AND bookings.transfer_id IS NULL;

COMMENT ON INDEX idx_bookings_transfer_pending IS 'Efficient queries for cron job to find bookings ready for transfer';


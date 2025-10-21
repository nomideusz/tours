-- Migration: Add Cancellation Policy and Refund Tracking
-- Date: 2025-10-21
-- Description: Adds structured cancellation policies and refund tracking for proper refund handling

-- 1. Add cancellation policy type to tours
-- Replace free-text cancellationPolicy with structured policy ID
ALTER TABLE tours 
  ADD COLUMN IF NOT EXISTS cancellation_policy_id VARCHAR(50) DEFAULT 'flexible';

COMMENT ON COLUMN tours.cancellation_policy_id IS 'Predefined cancellation policy: flexible, moderate, strict, nonRefundable, veryFlexible';

-- 2. Keep old cancellationPolicy for backward compatibility (can be removed later)
-- No changes needed - exists as: cancellation_policy TEXT

-- 3. Add refund tracking to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS refund_percentage INTEGER,
  ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20), -- 'customer' or 'guide'
  ADD COLUMN IF NOT EXISTS cancellation_reason VARCHAR(100),
  ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refund_notes TEXT;

COMMENT ON COLUMN bookings.refund_id IS 'Stripe refund ID (re_xxx)';
COMMENT ON COLUMN bookings.refund_amount IS 'Amount refunded to customer';
COMMENT ON COLUMN bookings.refund_status IS 'Refund status: pending, succeeded, failed, cancelled';
COMMENT ON COLUMN bookings.refund_percentage IS 'Percentage of total amount refunded (0-100)';
COMMENT ON COLUMN bookings.cancelled_by IS 'Who initiated the cancellation: customer or guide';
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason for cancellation: weather, illness, emergency, low_enrollment, other';
COMMENT ON COLUMN bookings.refund_processed_at IS 'When the refund was processed';
COMMENT ON COLUMN bookings.refund_notes IS 'Internal notes about the refund';

-- 4. Create index for refund queries
CREATE INDEX IF NOT EXISTS idx_bookings_refund_status ON bookings(refund_status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_by ON bookings(cancelled_by);

-- 5. Update existing tours with default policy
UPDATE tours 
SET cancellation_policy_id = 'flexible'
WHERE cancellation_policy_id IS NULL;

-- Optional: Migrate existing free-text cancellation policies to structured
-- This would require manual review of existing policies


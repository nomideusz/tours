-- Safe Migration Phase 1: Add New Booking Status Enums
-- Date: 2025-10-22
-- Author: AI Assistant
-- Safety: 100% - Only adding, not removing anything
-- Rollback: See rollback_001.sql

-- ============================================================
-- STEP 1: Create New Enum Types
-- ============================================================

-- Refund status enum (standardizes VARCHAR refund_status)
-- Using DO block for IF NOT EXISTS compatibility
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status_enum') THEN
    CREATE TYPE refund_status_enum AS ENUM (
      'not_required',   -- No refund needed (completed tour, non-refundable policy, etc)
      'pending',        -- Refund requested, not yet processed
      'succeeded',      -- Refund completed successfully
      'failed'          -- Refund processing failed
    );
  END IF;
END $$;

COMMENT ON TYPE refund_status_enum IS 'Standardized refund status values (replacing VARCHAR refund_status)';

-- Transfer status enum (standardizes VARCHAR transfer_status)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status_enum') THEN
    CREATE TYPE transfer_status_enum AS ENUM (
      'pending',        -- Waiting for transfer time to arrive
      'completed',      -- Transfer successful to guide account
      'failed',         -- Transfer processing failed
      'reversed'        -- Transfer was reversed (for refunds after transfer)
    );
  END IF;
END $$;

COMMENT ON TYPE transfer_status_enum IS 'Standardized transfer status values (replacing VARCHAR transfer_status)';

-- ============================================================
-- STEP 2: Add New Columns (Parallel to Old Ones)
-- ============================================================

-- Add new enum columns ALONGSIDE old VARCHAR columns
-- This allows gradual migration without breaking existing code
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS refund_status_new refund_status_enum DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS transfer_status_new transfer_status_enum DEFAULT 'pending';

COMMENT ON COLUMN bookings.refund_status_new IS 'New standardized refund status (will replace refund_status after migration)';
COMMENT ON COLUMN bookings.transfer_status_new IS 'New standardized transfer status (will replace transfer_status after migration)';

-- ============================================================
-- STEP 3: Create Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bookings_refund_status_new 
  ON bookings(refund_status_new);

CREATE INDEX IF NOT EXISTS idx_bookings_transfer_status_new 
  ON bookings(transfer_status_new);

COMMENT ON INDEX idx_bookings_refund_status_new IS 'Performance index for refund status queries';
COMMENT ON INDEX idx_bookings_transfer_status_new IS 'Performance index for transfer status queries';

-- ============================================================
-- STEP 4: Sync Function (Keeps Old and New in Sync)
-- ============================================================

CREATE OR REPLACE FUNCTION sync_booking_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync refund_status (VARCHAR) to refund_status_new (enum)
  -- Use simple CAST instead of complex CASE for reliability
  IF NEW.refund_status IS NULL THEN
    NEW.refund_status_new := 'not_required';
  ELSIF NEW.refund_status ILIKE 'succeeded' OR NEW.refund_status ILIKE 'success' THEN
    NEW.refund_status_new := 'succeeded';
  ELSIF NEW.refund_status ILIKE 'failed' THEN
    NEW.refund_status_new := 'failed';
  ELSIF NEW.refund_status ILIKE 'pending' OR NEW.refund_status ILIKE 'processing' THEN
    NEW.refund_status_new := 'pending';
  ELSE
    NEW.refund_status_new := 'not_required';
  END IF;
  
  -- Sync transfer_status (VARCHAR) to transfer_status_new (enum)
  IF NEW.transfer_status IS NULL THEN
    NEW.transfer_status_new := 'pending';
  ELSIF NEW.transfer_status ILIKE 'completed' OR NEW.transfer_status ILIKE 'complete' OR NEW.transfer_status ILIKE 'succeeded' THEN
    NEW.transfer_status_new := 'completed';
  ELSIF NEW.transfer_status ILIKE 'failed' THEN
    NEW.transfer_status_new := 'failed';
  ELSIF NEW.transfer_status ILIKE 'reversed' THEN
    NEW.transfer_status_new := 'reversed';
  ELSIF NEW.transfer_status ILIKE 'pending' THEN
    NEW.transfer_status_new := 'pending';
  ELSE
    NEW.transfer_status_new := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_booking_statuses() IS 'Keeps old VARCHAR status columns synced with new enum columns';

-- ============================================================
-- STEP 5: Create Trigger
-- ============================================================

DROP TRIGGER IF EXISTS sync_booking_statuses_trigger ON bookings;

CREATE TRIGGER sync_booking_statuses_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_statuses();

COMMENT ON TRIGGER sync_booking_statuses_trigger ON bookings IS 'Auto-sync old and new status columns';

-- ============================================================
-- STEP 6: Backfill Existing Data
-- ============================================================

-- Convert all existing VARCHAR values to enum values
-- This ensures consistency before we start using the new system
-- Since columns have DEFAULT values, we only update if they're still NULL or need correction

-- Update refund_status_new based on refund_status
UPDATE bookings 
SET refund_status_new = 
  CASE
    WHEN refund_status IS NULL THEN 'not_required'::refund_status_enum
    WHEN refund_status ILIKE 'succeeded' THEN 'succeeded'::refund_status_enum
    WHEN refund_status ILIKE 'success' THEN 'succeeded'::refund_status_enum
    WHEN refund_status ILIKE 'failed' THEN 'failed'::refund_status_enum
    WHEN refund_status ILIKE 'pending' THEN 'pending'::refund_status_enum
    WHEN refund_status ILIKE 'processing' THEN 'pending'::refund_status_enum
    ELSE 'not_required'::refund_status_enum
  END;

-- Update transfer_status_new based on transfer_status
UPDATE bookings 
SET transfer_status_new = 
  CASE
    WHEN transfer_status IS NULL THEN 'pending'::transfer_status_enum
    WHEN transfer_status ILIKE 'completed' THEN 'completed'::transfer_status_enum
    WHEN transfer_status ILIKE 'complete' THEN 'completed'::transfer_status_enum
    WHEN transfer_status ILIKE 'succeeded' THEN 'completed'::transfer_status_enum
    WHEN transfer_status ILIKE 'failed' THEN 'failed'::transfer_status_enum
    WHEN transfer_status ILIKE 'reversed' THEN 'reversed'::transfer_status_enum
    WHEN transfer_status ILIKE 'pending' THEN 'pending'::transfer_status_enum
    ELSE 'pending'::transfer_status_enum
  END;

-- ============================================================
-- STEP 7: Verification
-- ============================================================

-- Check backfill success
DO $$
DECLARE
  null_refund_count INTEGER;
  null_transfer_count INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE refund_status_new IS NULL),
    COUNT(*) FILTER (WHERE transfer_status_new IS NULL)
  INTO null_refund_count, null_transfer_count
  FROM bookings;
  
  IF null_refund_count > 0 THEN
    RAISE WARNING 'Found % bookings with NULL refund_status_new', null_refund_count;
  END IF;
  
  IF null_transfer_count > 0 THEN
    RAISE WARNING 'Found % bookings with NULL transfer_status_new', null_transfer_count;
  END IF;
  
  RAISE NOTICE 'Backfill verification complete. Nulls: refund=%, transfer=%', 
    null_refund_count, null_transfer_count;
END $$;

-- ============================================================
-- SUMMARY
-- ============================================================

-- Show migration summary
SELECT 
  'Migration Complete' as status,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE refund_status_new IS NOT NULL) as with_refund_enum,
  COUNT(*) FILTER (WHERE transfer_status_new IS NOT NULL) as with_transfer_enum,
  COUNT(DISTINCT refund_status_new) as refund_distinct_values,
  COUNT(DISTINCT transfer_status_new) as transfer_distinct_values
FROM bookings;

-- Show distribution of new enum values
SELECT 
  refund_status_new,
  COUNT(*) as count
FROM bookings
GROUP BY refund_status_new
ORDER BY count DESC;

SELECT 
  transfer_status_new,
  COUNT(*) as count
FROM bookings
GROUP BY transfer_status_new
ORDER BY count DESC;


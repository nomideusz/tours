# Safe Booking System Migration Plan

## 🎯 Goal: Simplify booking statuses without breaking production

**Strategy:** Incremental changes with rollback capability at every step

---

## Phase 1: Database Schema - Add New (Don't Remove Old)

### ✅ Safety: 100% - Only adding, not removing

### Step 1.1: Create New Enums

```sql
-- Migration: 001_add_booking_status_enums.sql

-- Create new enums (don't remove old ones yet)
CREATE TYPE IF NOT EXISTS refund_status_enum AS ENUM (
  'not_required',   -- No refund needed (completed tour, non-refundable, etc)
  'pending',        -- Refund requested, not processed
  'succeeded',      -- Refund completed
  'failed'          -- Refund failed
);

CREATE TYPE IF NOT EXISTS transfer_status_enum AS ENUM (
  'pending',        -- Waiting for transfer time
  'completed',      -- Transfer successful
  'failed',         -- Transfer failed
  'reversed'        -- Transfer was reversed (rare)
);

COMMENT ON TYPE refund_status_enum IS 'Standardized refund status (replacing VARCHAR)';
COMMENT ON TYPE transfer_status_enum IS 'Standardized transfer status (replacing VARCHAR)';
```

### Step 1.2: Add New Columns (Parallel to Old)

```sql
-- Add new enum columns ALONGSIDE old VARCHAR columns
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS refund_status_new refund_status_enum DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS transfer_status_new transfer_status_enum DEFAULT 'pending';

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_bookings_refund_status_new ON bookings(refund_status_new);
CREATE INDEX IF NOT EXISTS idx_bookings_transfer_status_new ON bookings(transfer_status_new);

COMMENT ON COLUMN bookings.refund_status_new IS 'New standardized refund status (will replace refund_status)';
COMMENT ON COLUMN bookings.transfer_status_new IS 'New standardized transfer status (will replace transfer_status)';
```

### Step 1.3: Sync Old to New (Trigger-based)

```sql
-- Create function to sync VARCHAR to enum
CREATE OR REPLACE FUNCTION sync_booking_statuses()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync refund_status (VARCHAR) to refund_status_new (enum)
  NEW.refund_status_new := CASE
    WHEN NEW.refund_status IS NULL THEN 'not_required'
    WHEN NEW.refund_status ILIKE 'succeeded' THEN 'succeeded'
    WHEN NEW.refund_status ILIKE 'failed' THEN 'failed'
    WHEN NEW.refund_status ILIKE 'pending' THEN 'pending'
    ELSE 'not_required'
  END;
  
  -- Sync transfer_status (VARCHAR) to transfer_status_new (enum)
  NEW.transfer_status_new := CASE
    WHEN NEW.transfer_status IS NULL THEN 'pending'
    WHEN NEW.transfer_status ILIKE 'completed' THEN 'completed'
    WHEN NEW.transfer_status ILIKE 'failed' THEN 'failed'
    WHEN NEW.transfer_status ILIKE 'reversed' THEN 'reversed'
    ELSE 'pending'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep them in sync
CREATE TRIGGER sync_booking_statuses_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_statuses();

-- Backfill existing data
UPDATE bookings SET 
  refund_status_new = CASE
    WHEN refund_status IS NULL THEN 'not_required'
    WHEN refund_status ILIKE 'succeeded' THEN 'succeeded'
    WHEN refund_status ILIKE 'failed' THEN 'failed'
    WHEN refund_status ILIKE 'pending' THEN 'pending'
    ELSE 'not_required'
  END,
  transfer_status_new = CASE
    WHEN transfer_status IS NULL THEN 'pending'
    WHEN transfer_status ILIKE 'completed' THEN 'completed'
    WHEN transfer_status ILIKE 'failed' THEN 'failed'
    WHEN transfer_status ILIKE 'reversed' THEN 'reversed'
    ELSE 'pending'
  END;
```

### Rollback Plan (Phase 1):

```sql
-- Rollback: Remove new columns and enums
DROP TRIGGER IF EXISTS sync_booking_statuses_trigger ON bookings;
DROP FUNCTION IF EXISTS sync_booking_statuses();
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS refund_status_new,
  DROP COLUMN IF EXISTS transfer_status_new;
DROP TYPE IF EXISTS refund_status_enum;
DROP TYPE IF EXISTS transfer_status_enum;
```

**Deploy & Verify:**
- ✅ Check all bookings have `refund_status_new` populated
- ✅ Verify trigger works on new bookings
- ✅ Monitor for migration errors

---

## Phase 2: Create Utilities (Use New, Fall Back to Old)

### ✅ Safety: 100% - Pure functions, no data changes

### Step 2.1: Status Display Utility

```typescript
// src/lib/utils/booking-status-v2.ts

import type { Booking } from '$lib/types';

// Feature flag for gradual rollout
const USE_NEW_STATUS_SYSTEM = import.meta.env.PUBLIC_USE_NEW_BOOKING_STATUS === 'true';

/**
 * Get booking status display (safe version - uses new enums, falls back to old)
 */
export function getBookingStatusDisplay(booking: Booking) {
  const { status, paymentStatus, transferId } = booking;
  
  // Use new enum if available, fall back to old VARCHAR
  const refundStatus = USE_NEW_STATUS_SYSTEM 
    ? booking.refundStatusNew 
    : booking.refundStatus;
    
  const transferStatus = USE_NEW_STATUS_SYSTEM
    ? booking.transferStatusNew
    : booking.transferStatus;
  
  // Cancelled bookings
  if (status === 'cancelled') {
    if (refundStatus === 'succeeded') {
      return { 
        label: 'Cancelled • Refunded', 
        color: 'status-cancelled',
        icon: 'x-circle'
      };
    }
    if (refundStatus === 'pending') {
      return { 
        label: 'Cancelled • Refund Pending', 
        color: 'status-cancelled',
        icon: 'clock'
      };
    }
    if (refundStatus === 'failed') {
      return { 
        label: 'Cancelled • Refund Failed', 
        color: 'status-cancelled',
        icon: 'alert-circle'
      };
    }
    return { 
      label: 'Cancelled', 
      color: 'status-cancelled',
      icon: 'x-circle'
    };
  }
  
  // Payment pending
  if (paymentStatus === 'pending') {
    return { 
      label: 'Awaiting Payment', 
      color: 'payment-pending',
      icon: 'alert-triangle'
    };
  }
  
  // Confirmed bookings
  if (status === 'confirmed') {
    if (transferId && transferStatus === 'completed') {
      return { 
        label: 'Confirmed • Transferred', 
        color: 'status-confirmed',
        icon: 'check-circle'
      };
    }
    return { 
      label: 'Confirmed • Paid', 
      color: 'status-confirmed',
      icon: 'check-circle'
    };
  }
  
  // Completed
  if (status === 'completed') {
    return { 
      label: 'Completed', 
      color: 'status-completed',
      icon: 'check-circle'
    };
  }
  
  // No-show
  if (status === 'no_show') {
    return { 
      label: 'No Show', 
      color: 'status-default',
      icon: 'user-x'
    };
  }
  
  // Default
  return { 
    label: status || 'Unknown', 
    color: 'status-default',
    icon: 'help-circle'
  };
}

/**
 * Get detailed booking state (for debugging/admin)
 */
export function getBookingStateDetails(booking: Booking) {
  return {
    lifecycle: booking.status,
    payment: booking.paymentStatus,
    refund: USE_NEW_STATUS_SYSTEM ? booking.refundStatusNew : booking.refundStatus,
    transfer: USE_NEW_STATUS_SYSTEM ? booking.transferStatusNew : booking.transferStatus,
    hasRefund: !!booking.refundId,
    hasTransfer: !!booking.transferId,
    isNewSystem: USE_NEW_STATUS_SYSTEM
  };
}
```

### Step 2.2: Update Drizzle Schema (Add New Fields)

```typescript
// src/lib/db/schema/drizzle.ts

export const refundStatusEnum = pgEnum('refund_status_enum', [
  'not_required', 'pending', 'succeeded', 'failed'
]);

export const transferStatusEnum = pgEnum('transfer_status_enum', [
  'pending', 'completed', 'failed', 'reversed'
]);

export const bookings = pgTable('bookings', {
  // ... existing fields ...
  
  // OLD (keep for now)
  refundStatus: varchar('refund_status', { length: 50 }),
  transferStatus: varchar('transfer_status', { length: 50 }),
  
  // NEW (parallel system)
  refundStatusNew: refundStatusEnum('refund_status_new').default('not_required'),
  transferStatusNew: transferStatusEnum('transfer_status_new').default('pending'),
});
```

### Rollback Plan (Phase 2):

```bash
# Just delete the new files, old code continues working
rm src/lib/utils/booking-status-v2.ts
# Remove imports from components (they'll fall back to inline logic)
```

**Deploy & Verify:**
- ✅ Import new utility in ONE component as test
- ✅ Verify status displays correctly
- ✅ Check feature flag works
- ✅ No production impact (not used yet)

---

## Phase 3: Update UI Components (Feature-Flagged)

### ✅ Safety: 95% - Behind feature flag

### Step 3.1: Create Unified Cancellation Component

```svelte
<!-- src/lib/components/booking/BookingCancellation.svelte -->
<script lang="ts">
  import RefundPreviewCard from './RefundPreviewCard.svelte';
  
  let { booking, onSuccess } = $props<{
    booking: any;
    onSuccess?: () => void;
  }>();
  
  // Feature flag
  const useUnifiedCancellation = import.meta.env.PUBLIC_USE_UNIFIED_CANCELLATION === 'true';
</script>

{#if useUnifiedCancellation}
  <!-- NEW: Unified system -->
  <RefundPreviewCard 
    bookingId={booking.id} 
    onSuccess={onSuccess}
  />
{:else}
  <!-- OLD: Keep existing behavior -->
  <slot name="legacy" />
{/if}
```

### Step 3.2: Update Booking Details Page (Gradual)

```svelte
<!-- src/routes/(app)/bookings/[id]/+page.svelte -->

<script lang="ts">
  import { getBookingStatusDisplay } from '$lib/utils/booking-status-v2.js';
  import BookingCancellation from '$lib/components/booking/BookingCancellation.svelte';
  
  // Feature flag from env
  const useNewStatusSystem = import.meta.env.PUBLIC_USE_NEW_BOOKING_STATUS === 'true';
  
  // Use new utility if enabled, fall back to old logic
  let statusDisplay = $derived(
    useNewStatusSystem 
      ? getBookingStatusDisplay(booking)
      : getCombinedStatusBadge() // Old function
  );
</script>

<!-- Status badge - works with both systems -->
<span class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border {statusDisplay.color}">
  <BookingIcon class="h-3.5 w-3.5" />
  <span class="font-medium">{statusDisplay.label}</span>
</span>

<!-- Cancellation - gradual migration -->
{#if booking.status !== 'cancelled' && booking.status !== 'completed'}
  <BookingCancellation {booking} onSuccess={() => $bookingQuery.refetch()}>
    {#snippet legacy()}
      <!-- OLD system (fallback) -->
      <RefundPreviewCard bookingId={booking.id} onSuccess={() => $bookingQuery.refetch()} />
    {/snippet}
  </BookingCancellation>
{/if}

<!-- Status modal - conditionally remove cancellation option -->
{#if !useNewStatusSystem}
  <!-- OLD: Keep cancellation in modal -->
  <select bind:value={newStatus}>
    <option value="cancelled">Cancelled</option>
  </select>
{:else}
  <!-- NEW: Remove cancellation from modal (use RefundPreviewCard instead) -->
  <select bind:value={newStatus}>
    <!-- No cancelled option - use separate cancellation flow -->
    <option value="pending">Pending</option>
    <option value="confirmed">Confirmed</option>
    <option value="completed">Completed</option>
    <option value="no_show">No Show</option>
  </select>
{/if}
```

### Rollback Plan (Phase 3):

```bash
# Set feature flag to false
PUBLIC_USE_NEW_BOOKING_STATUS=false
PUBLIC_USE_UNIFIED_CANCELLATION=false

# System reverts to old behavior immediately
# No code changes needed
```

**Deploy & Verify:**
- ✅ Deploy with feature flags OFF
- ✅ Enable for 10% of users (A/B test)
- ✅ Monitor for errors
- ✅ Compare old vs new behavior
- ✅ Increase to 50%, then 100%

---

## Phase 4: Update Backend APIs (Write to Both)

### ✅ Safety: 95% - Writes to both old and new columns

### Step 4.1: Update Booking Cancellation Endpoint

```typescript
// src/routes/api/bookings/[id]/cancel/+server.ts

export const POST: RequestHandler = async ({ params, request, locals }) => {
  // ... existing validation ...
  
  try {
    // Process refund
    const refundResult = await processSmartRefund({...});
    
    // Update booking - WRITE TO BOTH old and new columns
    await db.update(bookings).set({
      status: 'cancelled',
      
      // OLD system (keep for now)
      refundStatus: refundResult.success ? 'succeeded' : 'failed',
      
      // NEW system (parallel write)
      refundStatusNew: refundResult.success ? 'succeeded' : 'failed',
      
      refundId: refundResult.refundId,
      refundAmount: amount.toFixed(2),
      cancelledBy,
      cancellationReason: reason,
      // ... other fields
    }).where(eq(bookings.id, bookingId));
    
    // Database trigger will also sync, but explicit write is safer
    
    return json({ success: true });
  } catch (error) {
    // IMPORTANT: Write failures to both columns too
    await db.update(bookings).set({
      refundStatus: 'failed',       // OLD
      refundStatusNew: 'failed',    // NEW
      refundNotes: error.message
    }).where(eq(bookings.id, bookingId));
    
    throw error;
  }
};
```

### Step 4.2: Update Transfer Processing

```typescript
// src/routes/api/cron/process-transfers/+server.ts

// After successful transfer
await db.update(bookings).set({
  transferId: transfer.id,
  
  // Write to BOTH columns
  transferStatus: 'completed',      // OLD
  transferStatusNew: 'completed',   // NEW
  
  transferProcessedAt: new Date(),
  // ...
}).where(eq(bookings.id, booking.id));

// On failure
await db.update(bookings).set({
  transferStatus: 'failed',         // OLD
  transferStatusNew: 'failed',      // NEW
  transferNotes: error.message
}).where(eq(bookings.id, booking.id));
```

### Rollback Plan (Phase 4):

```typescript
// If issues arise, just stop writing to new columns
// Old system continues working from old columns

// Quick patch:
await db.update(bookings).set({
  refundStatus: refundResult.success ? 'succeeded' : 'failed',
  // refundStatusNew: ... // Comment out new column writes
});
```

**Deploy & Verify:**
- ✅ Monitor both columns stay in sync
- ✅ Check trigger is working
- ✅ Verify no null/invalid states
- ✅ Run for 1 week minimum

---

## Phase 5: Switch to New System (Keep Old as Backup)

### ✅ Safety: 90% - Gradual switch with monitoring

### Step 5.1: Enable Feature Flags

```bash
# .env.production
PUBLIC_USE_NEW_BOOKING_STATUS=true
PUBLIC_USE_UNIFIED_CANCELLATION=true
```

### Step 5.2: Update Queries to Use New Columns

```typescript
// src/lib/queries/bookings.ts

// Read from new columns
const bookingData = await db
  .select({
    // ... other fields
    refundStatus: USE_NEW ? bookings.refundStatusNew : bookings.refundStatus,
    transferStatus: USE_NEW ? bookings.transferStatusNew : bookings.transferStatus,
  })
  .from(bookings);
```

### Step 5.3: Monitor Dashboard

```typescript
// Create admin monitoring page
// src/routes/(app)/admin/booking-migration-status/+page.svelte

<script lang="ts">
  // Query to check sync status
  const mismatchedBookings = await db
    .select()
    .from(bookings)
    .where(sql`
      (refund_status IS DISTINCT FROM refund_status_new::text)
      OR
      (transfer_status IS DISTINCT FROM transfer_status_new::text)
    `);
</script>

{#if mismatchedBookings.length > 0}
  <div class="alert-warning">
    ⚠️ {mismatchedBookings.length} bookings have mismatched statuses!
    <button onclick={syncNow}>Sync Now</button>
  </div>
{/if}
```

### Rollback Plan (Phase 5):

```bash
# Instant rollback - just flip feature flags
PUBLIC_USE_NEW_BOOKING_STATUS=false
PUBLIC_USE_UNIFIED_CANCELLATION=false

# System reverts immediately
# Data is still in both columns, nothing lost
```

**Deploy & Verify:**
- ✅ Enable for all users
- ✅ Monitor for 2 weeks
- ✅ Check mismatch dashboard daily
- ✅ Verify no issues reported

---

## Phase 6: Clean Up (After Monitoring Period)

### ✅ Safety: 80% - Only after 2+ weeks successful

### Step 6.1: Remove Old Code

```typescript
// Remove old utility functions
// Remove feature flag checks
// Use new columns directly
```

### Step 6.2: Database Final Migration

```sql
-- Migration: 002_finalize_booking_status_migration.sql

-- ONLY RUN AFTER 2+ WEEKS OF SUCCESSFUL OPERATION

BEGIN;

-- Verify no mismatches
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM bookings
  WHERE (refund_status IS DISTINCT FROM refund_status_new::text)
     OR (transfer_status IS DISTINCT FROM transfer_status_new::text);
  
  IF mismatch_count > 0 THEN
    RAISE EXCEPTION 'Found % mismatched bookings. Migration aborted.', mismatch_count;
  END IF;
END $$;

-- Drop trigger (no longer needed)
DROP TRIGGER IF EXISTS sync_booking_statuses_trigger ON bookings;
DROP FUNCTION IF EXISTS sync_booking_statuses();

-- Remove old columns
ALTER TABLE bookings 
  DROP COLUMN IF EXISTS refund_status,
  DROP COLUMN IF EXISTS transfer_status,
  DROP COLUMN IF EXISTS attendance_status;

-- Rename new columns to final names
ALTER TABLE bookings 
  RENAME COLUMN refund_status_new TO refund_status;
ALTER TABLE bookings 
  RENAME COLUMN transfer_status_new TO transfer_status;

-- Update Drizzle schema
COMMENT ON COLUMN bookings.refund_status IS 'Standardized refund status (enum)';
COMMENT ON COLUMN bookings.transfer_status IS 'Standardized transfer status (enum)';

COMMIT;
```

### Rollback Plan (Phase 6):

**⚠️ CANNOT ROLLBACK EASILY AFTER THIS POINT**

Must restore from backup if needed:
```sql
-- Restore from backup before column drop
pg_restore --clean --if-exists backups/before_cleanup.dump
```

**Deploy & Verify:**
- ✅ Take FULL database backup first
- ✅ Test migration on staging
- ✅ Run during low-traffic period
- ✅ Verify schema changes successful
- ✅ Check all queries still work

---

## 📊 Monitoring Checklist

### During Migration (Phases 1-5):

```sql
-- Daily health check queries

-- 1. Check sync status
SELECT 
  COUNT(*) FILTER (WHERE refund_status != refund_status_new::text) as refund_mismatches,
  COUNT(*) FILTER (WHERE transfer_status != transfer_status_new::text) as transfer_mismatches
FROM bookings
WHERE refund_status_new IS NOT NULL;

-- 2. Check for NULL values
SELECT 
  COUNT(*) FILTER (WHERE refund_status_new IS NULL) as null_refund,
  COUNT(*) FILTER (WHERE transfer_status_new IS NULL) as null_transfer
FROM bookings;

-- 3. Check recent bookings
SELECT id, status, payment_status, refund_status, refund_status_new
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;
```

### Application Monitoring:

```typescript
// Log when using new vs old system
console.log('[Status System]', {
  useNew: USE_NEW_STATUS_SYSTEM,
  bookingId: booking.id,
  oldRefund: booking.refundStatus,
  newRefund: booking.refundStatusNew,
  match: booking.refundStatus === booking.refundStatusNew
});
```

---

## 🎯 Timeline

| Phase | Duration | Risk | Rollback Time |
|-------|----------|------|---------------|
| Phase 1: DB Schema | 1 day | Low | Instant |
| Phase 2: Utilities | 1 day | Low | Instant |
| Phase 3: UI (10%) | 3 days | Medium | Instant |
| Phase 3: UI (100%) | 4 days | Medium | Instant |
| Phase 4: Backend | 3 days | Medium | 2 hours |
| Phase 5: Switch | 14 days | Medium | Instant |
| Phase 6: Cleanup | 1 day | High | Days (restore) |

**Total Timeline: ~30 days**

---

## 🚨 Emergency Rollback Procedure

### If Something Goes Wrong:

```bash
# 1. IMMEDIATE: Disable feature flags
export PUBLIC_USE_NEW_BOOKING_STATUS=false
export PUBLIC_USE_UNIFIED_CANCELLATION=false

# 2. Redeploy app (< 5 minutes)
git revert HEAD  # If needed
npm run build
pm2 restart all

# 3. Verify old system working
curl https://zaur.app/api/bookings/[test-id]

# 4. Check database sync
psql -c "SELECT COUNT(*) FROM bookings WHERE refund_status != refund_status_new::text"

# 5. If needed, drop new columns
psql -c "
  ALTER TABLE bookings 
    DROP COLUMN IF EXISTS refund_status_new,
    DROP COLUMN IF EXISTS transfer_status_new;
"
```

---

## ✅ Success Criteria

**Phase 1-4:** Can proceed when:
- ✅ No errors in logs
- ✅ All bookings have new columns populated
- ✅ Trigger keeps columns in sync
- ✅ Mismatch count = 0

**Phase 5:** Can proceed when:
- ✅ 2+ weeks with no issues
- ✅ No user complaints
- ✅ Mismatch dashboard clean
- ✅ Performance unchanged

**Phase 6:** Can proceed when:
- ✅ 2+ weeks on new system
- ✅ Full backup completed
- ✅ Staging migration successful
- ✅ Low traffic period scheduled

---

## 📝 Deployment Commands

```bash
# Phase 1: Database
psql $DATABASE_URL -f migrations/001_add_booking_status_enums.sql

# Phase 2-3: Code
git checkout feat/booking-status-v2
npm run build
pm2 restart zaur-app

# Phase 4: Enable gradually
echo "PUBLIC_USE_NEW_BOOKING_STATUS=true" >> .env.production

# Phase 5: Monitor
pm2 logs zaur-app | grep "Status System"

# Phase 6: Final cleanup
psql $DATABASE_URL -f migrations/002_finalize_booking_status_migration.sql
```

---

Ready to start with Phase 1? 🚀


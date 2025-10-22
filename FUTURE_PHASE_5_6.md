# Future Phases 5 & 6 - After Monitoring Period

## ⏰ Timeline

**Phase 5:** After 2 weeks of successful Phase 1-4 operation
**Phase 6:** After 2 weeks of successful Phase 5 operation

**Total:** ~4-6 weeks from initial deployment

---

## Phase 5: Switch to New System (Reversible)

### When to Proceed:
- ✅ 2+ weeks with zero mismatches
- ✅ All transfers and refunds working correctly
- ✅ No user-reported issues
- ✅ Monitoring dashboard clean

### Step 1: Enable Feature Flags

```bash
# .env.production
PUBLIC_USE_NEW_BOOKING_STATUS=true
```

### Step 2: Update Code to Prefer New Columns

```typescript
// src/lib/utils/booking-status-v2.ts

// Change from:
const USE_NEW_STATUS_SYSTEM = process.env.PUBLIC_USE_NEW_BOOKING_STATUS === 'true';

// To:
const USE_NEW_STATUS_SYSTEM = true; // Always use new system
```

### Step 3: Update UI Components

```svelte
<!-- src/routes/(app)/bookings/[id]/+page.svelte -->

<script>
  import { getBookingStatusDisplay } from '$lib/utils/booking-status-v2.js';
  
  // Use new utility directly
  let statusDisplay = $derived(getBookingStatusDisplay(booking));
</script>

<!-- Remove old getCombinedStatusBadge() function -->
```

### Step 4: Deploy & Monitor

```bash
pnpm run build
pm2 restart zaur-app

# Monitor for 2 weeks
# Check mismatch dashboard daily
```

### Rollback (if needed):

```bash
# Instant rollback - just change env var
PUBLIC_USE_NEW_BOOKING_STATUS=false

# Restart app
pm2 restart zaur-app

# System reverts immediately, no data loss
```

---

## Phase 6: Final Cleanup (Irreversible)

### ⚠️ ONLY After 1+ Month Stable

### Prerequisites:
- ✅ Phase 5 running for 2+ weeks
- ✅ Zero issues reported
- ✅ Mismatch count always zero
- ✅ Full database backup completed
- ✅ Tested on staging

### Step 1: Backup Database

```bash
# Create final backup
pg_dump $DATABASE_URL > backups/before_status_cleanup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backups/before_status_cleanup_*.sql | head -20
```

### Step 2: Run Final Migration

```bash
# Run on staging first!
psql $STAGING_DATABASE_URL -f migrations/002_finalize_booking_status_migration.sql

# Test staging thoroughly for 24 hours

# Then production (during low traffic)
psql $DATABASE_URL -f migrations/002_finalize_booking_status_migration.sql
```

### Step 3: Update Drizzle Schema

```typescript
// src/lib/db/schema/drizzle.ts

// Remove OLD columns from schema
export const bookings = pgTable('bookings', {
  // ... other fields ...
  
  // REMOVE THESE:
  ❌ refundStatus: varchar('refund_status', { length: 50 }),
  ❌ transferStatus: varchar('transfer_status', { length: 50 }),
  ❌ refundStatusNew: refundStatusEnumNew('refund_status_new'),
  ❌ transferStatusNew: transferStatusEnumNew('transfer_status_new'),
  
  // KEEP ONLY THESE (renamed from _new):
  ✅ refundStatus: refundStatusEnumNew('refund_status'),
  ✅ transferStatus: transferStatusEnumNew('transfer_status'),
});
```

### Step 4: Remove Feature Flags

```typescript
// Delete all references to USE_NEW_STATUS_SYSTEM
// Rename booking-status-v2.ts to booking-status.ts
// Update all imports

// Before:
import { getBookingStatusDisplay } from '$lib/utils/booking-status-v2.js';

// After:
import { getBookingStatusDisplay } from '$lib/utils/booking-status.js';
```

### Step 5: Regenerate Types

```bash
pnpm run db:pull  # Sync Drizzle with new schema
pnpm run build
```

### Step 6: Deploy Final Version

```bash
git commit -m "Phase 6: Complete booking status migration"
pnpm run build
pm2 restart zaur-app
```

### Step 7: Verify & Monitor

```bash
# Check schema
psql $DATABASE_URL -c "\d bookings" | grep status

# Should show:
# refund_status | refund_status_enum | 
# transfer_status | transfer_status_enum |
# (No VARCHAR, no _new suffix)

# Monitor for 1 week
# Document completion
```

---

## 🚨 If Something Goes Wrong in Phase 6

**Rollback is HARD** - requires database restore:

```bash
# 1. Stop application
pm2 stop zaur-app

# 2. Restore from backup
psql $DATABASE_URL < backups/before_status_cleanup_*.sql

# 3. Revert code
git revert HEAD
pnpm run build
pm2 start zaur-app

# 4. Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bookings WHERE refund_status_new IS NOT NULL"
```

---

## Summary Timeline

```
Week 0: Deploy Phase 1-4 (SAFE)
  ↓
Week 2: Enable Phase 5 (REVERSIBLE)
  ↓  
Week 4: Monitor, verify stability
  ↓
Week 6+: Consider Phase 6 (FINAL - requires backup)
```

**Current Status:** Phase 1-4 ready for deployment! ✅

Phases 5-6 are **documented for future** - don't rush them!

---

## Recommendation

**Deploy NOW:** Phase 1-4
- Completely safe
- Zero breaking changes
- Easy rollback
- Starts migration process

**Wait to Deploy:** Phase 5-6
- Until proven stable
- No rush
- Better to be cautious
- Can wait months if needed

The beauty of this approach: **You can run Phase 1-4 forever** if needed. The new columns will stay in sync with old columns, giving you time to migrate frontend gradually!


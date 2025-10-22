# Test Booking Migration Locally

Before deploying to production, test the migration on your local development database.

---

## 🧪 Local Testing Steps

### 1. Backup Your Local Database

```bash
# Create backup of current state
pg_dump your_local_db > backups/local_before_migration_$(date +%Y%m%d).sql
```

### 2. Run Migration

```bash
# Connect to local database
psql your_local_db

# Run Phase 1 migration
\i migrations/001_add_booking_status_enums.sql

# Check output - should show no errors
```

### 3. Verify Migration Success

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'bookings' 
  AND column_name LIKE '%status%'
ORDER BY column_name;

-- Should show:
-- refund_status     | character varying
-- refund_status_new | refund_status_enum
-- transfer_status   | character varying  
-- transfer_status_new | transfer_status_enum

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'sync_booking_statuses_trigger';

-- Should show: sync_booking_statuses_trigger

-- Check all bookings have new values
SELECT 
  COUNT(*) as total,
  COUNT(refund_status_new) as with_refund_enum,
  COUNT(transfer_status_new) as with_transfer_enum
FROM bookings;

-- All three should match
```

### 4. Test New Bookings

```bash
# Start your dev server
pnpm run dev

# Create a test booking via UI
# Pay with test Stripe card: 4242 4242 4242 4242

# Check database - both columns should be written
psql your_local_db -c "
SELECT 
  booking_reference,
  status,
  transfer_status,
  transfer_status_new,
  transfer_scheduled_for
FROM bookings
ORDER BY created_at DESC
LIMIT 1;
"
```

**Expected Output:**
```
booking_reference | status    | transfer_status | transfer_status_new | transfer_scheduled_for
BK-TEST123       | confirmed | pending         | pending             | 2025-10-23 15:00:00
```

Both columns match ✅

### 5. Test Transfer Processing

```bash
# Manually trigger transfer cron
curl -X GET "http://localhost:5173/api/cron/process-transfers" \
  -H "Authorization: Bearer your-local-cron-secret"

# Check database after transfer
psql your_local_db -c "
SELECT 
  booking_reference,
  transfer_id,
  transfer_status,
  transfer_status_new,
  transfer_processed_at
FROM bookings
WHERE transfer_id IS NOT NULL
ORDER BY transfer_processed_at DESC
LIMIT 1;
"
```

**Expected Output:**
```
booking_reference | transfer_id  | transfer_status | transfer_status_new | transfer_processed_at
BK-TEST123       | tr_abc123... | completed       | completed           | 2025-10-22 21:00:00
```

Both columns match ✅

### 6. Test Cancellation

```bash
# Cancel a booking via UI
# (Use the RefundPreviewCard)

# Check database
psql your_local_db -c "
SELECT 
  booking_reference,
  status,
  refund_id,
  refund_status,
  refund_status_new,
  refund_amount
FROM bookings
WHERE status = 'cancelled'
ORDER BY updated_at DESC
LIMIT 1;
"
```

**Expected Output:**
```
booking_reference | status    | refund_id   | refund_status | refund_status_new | refund_amount
BK-TEST456       | cancelled | re_xyz789   | succeeded     | succeeded         | 25.00
```

Both columns match ✅

### 7. Test Mismatch Detection

```bash
# Manually create a mismatch to test detection
psql your_local_db -c "
UPDATE bookings 
SET refund_status_new = 'failed'
WHERE id = (SELECT id FROM bookings LIMIT 1);
"

# Run mismatch check
psql your_local_db -c "
SELECT 
  booking_reference,
  refund_status,
  refund_status_new::text
FROM bookings
WHERE refund_status IS DISTINCT FROM refund_status_new::text;
"

# Should show 1 mismatched booking

# Fix it (trigger should have prevented this, but testing manually)
psql your_local_db -c "
UPDATE bookings 
SET refund_status = refund_status_new::text
WHERE refund_status IS DISTINCT FROM refund_status_new::text;
"

# Verify fixed
psql your_local_db -c "
SELECT COUNT(*) as mismatches
FROM bookings
WHERE refund_status IS DISTINCT FROM refund_status_new::text;
"

# Should show: 0
```

### 8. Test Rollback

```bash
# Run rollback script
psql your_local_db -f migrations/rollback_001.sql

# Verify old system still works
psql your_local_db -c "
SELECT 
  booking_reference,
  refund_status,
  transfer_status
FROM bookings
LIMIT 3;
"

# Should show old VARCHAR columns working

# Re-run migration to restore
psql your_local_db -f migrations/001_add_booking_status_enums.sql
```

### 9. Load Testing (Optional)

```bash
# Create 100 test bookings
node scripts/create-test-bookings.js 100

# Trigger transfers for all
curl "http://localhost:5173/api/cron/process-transfers" \
  -H "Authorization: Bearer local-secret"

# Verify all synced
psql your_local_db -c "
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE refund_status = refund_status_new::text) as synced,
  COUNT(*) FILTER (WHERE transfer_status = transfer_status_new::text) as synced_transfers
FROM bookings;
"

# total = synced = synced_transfers ✅
```

### 10. Clean Up Test Data

```bash
# Delete test bookings
psql your_local_db -c "
DELETE FROM bookings WHERE booking_reference LIKE 'TEST-%';
"

# Or restore from backup
psql your_local_db < backups/local_before_migration_*.sql
```

---

## ✅ Local Testing Checklist

Before deploying to production:

- [ ] Migration runs without errors
- [ ] All bookings have new enum columns populated
- [ ] Trigger keeps columns in sync
- [ ] New bookings write to both columns
- [ ] Transfers write to both columns
- [ ] Cancellations write to both columns
- [ ] No mismatches detected
- [ ] Rollback script works
- [ ] Application runs normally
- [ ] No console errors
- [ ] Status displays correctly in UI

Once all checkboxes are ✅, you're ready for production!

---

## 🎯 If All Tests Pass

```bash
# Commit changes
git add .
git commit -m "feat: Safe booking status migration (Phase 1-4)

- Add refund_status_enum and transfer_status_enum
- Create parallel columns (old VARCHAR + new enum)
- Trigger keeps them in sync
- Backend writes to both columns
- Fully backward compatible
- Easy rollback if needed

Migration ready for production deployment."

# Push to production
git push origin master

# Deploy (your method)
# Then follow BOOKING_MIGRATION_DEPLOYMENT.md
```

Happy testing! 🧪✨


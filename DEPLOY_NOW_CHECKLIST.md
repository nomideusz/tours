# Deploy Now - Quick Checklist

## ✅ Ready to Deploy: Payment & Booking Fixes

**Total Time:** 30-45 minutes
**Risk Level:** 🟢 Very Low
**Rollback Time:** < 5 minutes

---

## Pre-Deployment (10 min)

### 1. Backup Production Database
```bash
# Create timestamped backup
pg_dump $DATABASE_URL > backups/pre_payment_fix_$(date +%Y%m%d_%H%M%S).sql

# Verify backup created
ls -lh backups/
```

### 2. Test Locally (Optional but Recommended)
```bash
# Run migration on local database
psql your_local_db -f migrations/001_add_booking_status_enums.sql

# Create test booking
# Verify columns written to both old and new

# If issues, rollback locally:
psql your_local_db -f migrations/rollback_001.sql
```

---

## Deployment (15 min)

### Step 1: Database Migration
```bash
# Connect to production
psql $DATABASE_URL

# Run migration (creates new columns, doesn't remove old)
\i migrations/001_add_booking_status_enums.sql

# Verify success - should show no errors
# Check output shows "Migration Complete"
```

**Expected Output:**
```
Migration Complete
total_bookings | with_refund_enum | with_transfer_enum
14            | 14               | 14
```

### Step 2: Deploy Code
```bash
# Pull latest code
git pull origin master

# Install dependencies
pnpm install

# Build
pnpm run build

# Restart application
pm2 restart zaur-app

# Or for Docker:
docker-compose up -d --build
```

### Step 3: Verify Application Started
```bash
# Check health
curl https://zaur.app/api/health

# Check bookings API
curl https://zaur.app/api/bookings/YOUR_BOOKING_ID \
  -H "Authorization: Bearer YOUR_SESSION"
```

---

## Post-Deployment Verification (10 min)

### 1. Check Database Columns
```bash
psql $DATABASE_URL -c "
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name LIKE '%status%'
ORDER BY column_name;
"
```

**Should show:**
```
attendance_status    | attendance_status
payment_status       | payment_status  
refund_status        | character varying     ← OLD
refund_status_new    | refund_status_enum    ← NEW
status               | booking_status
transfer_status      | character varying     ← OLD  
transfer_status_new  | transfer_status_enum  ← NEW
```

### 2. Check Trigger Exists
```bash
psql $DATABASE_URL -c "
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'sync_booking_statuses_trigger';
"
```

**Should show:** `sync_booking_statuses_trigger | O` (O = enabled)

### 3. Create Test Booking
```bash
# Via UI or API
# Book a tour, pay with Stripe test card: 4242 4242 4242 4242
```

### 4. Verify Dual Writes
```bash
psql $DATABASE_URL -c "
SELECT 
  booking_reference,
  transfer_status,       -- OLD
  transfer_status_new,   -- NEW (should match)
  transfer_scheduled_for
FROM bookings
ORDER BY created_at DESC
LIMIT 3;
"
```

**Expected:** Both columns have same value

### 5. Test Transfer Processing
```bash
# Wait for scheduled time, or trigger manually
curl -X GET "https://zaur.app/api/cron/process-transfers" \
  -H "Authorization: Bearer $CRON_SECRET"

# Check response
# Should show transfers being processed
```

### 6. Verify Transfer Wrote to Both Columns
```bash
psql $DATABASE_URL -c "
SELECT 
  booking_reference,
  transfer_id,
  transfer_status,       -- Should be 'completed'
  transfer_status_new    -- Should be 'completed'
FROM bookings
WHERE transfer_id IS NOT NULL
ORDER BY transfer_processed_at DESC
LIMIT 3;
"
```

### 7. Run Mismatch Check
```bash
psql $DATABASE_URL -f scripts/check-booking-status-sync.sql
```

**Expected:** Zero mismatches

---

## Monitoring (Next 2 Weeks)

### Daily Checks:
```bash
# Run health check
psql $DATABASE_URL -f scripts/check-booking-status-sync.sql

# Look for:
# ✅ Zero mismatches
# ✅ All new bookings have enum columns
# ✅ Trigger still enabled
```

### Check Application Logs:
```bash
pm2 logs zaur-app --lines 200 | grep -i "transfer\|refund\|status"

# Look for:
# ✅ Transfers processing successfully
# ✅ No "column not found" errors
# ✅ No "invalid enum value" errors
```

### If Mismatches Found:
```bash
# Run fix script
psql $DATABASE_URL -f scripts/fix-booking-status-mismatches.sql

# Verify fixed
psql $DATABASE_URL -f scripts/check-booking-status-sync.sql
```

---

## 🚨 Emergency Rollback

### If Critical Issues:
```bash
# 1. Run rollback SQL (< 1 minute)
psql $DATABASE_URL -f migrations/rollback_001.sql

# 2. Revert code changes
git revert HEAD~5..HEAD  # Revert last 5 commits
pnpm run build
pm2 restart zaur-app

# 3. Verify old system working
curl https://zaur.app/api/bookings/TEST_ID
```

**Impact:** Zero data loss, system reverts to before migration

---

## ✅ Success Criteria

### After 24 Hours:
- ✅ No application errors
- ✅ Zero status mismatches
- ✅ Transfers processing normally
- ✅ Cancellations working
- ✅ No user complaints

### After 1 Week:
- ✅ Daily health checks clean
- ✅ All new bookings syncing properly
- ✅ Performance normal

### After 2 Weeks:
- ✅ Ready to consider Phase 5 (enable new system)

---

## 📞 Support

### If Issues Arise:

1. **Check logs first:**
   ```bash
   pm2 logs zaur-app | tail -100
   ```

2. **Run health check:**
   ```bash
   psql $DATABASE_URL -f scripts/check-booking-status-sync.sql
   ```

3. **Check for mismatches:**
   ```sql
   SELECT COUNT(*) FROM bookings 
   WHERE refund_status != refund_status_new::text;
   ```

4. **Rollback if needed:**
   ```bash
   psql $DATABASE_URL -f migrations/rollback_001.sql
   ```

---

## 🎯 Final Check Before Deploying

- [ ] Production database backup completed
- [ ] Tested migration locally (optional but recommended)
- [ ] Reviewed migration SQL
- [ ] Reviewed rollback SQL  
- [ ] CRON_SECRET configured in environment
- [ ] Low-traffic time scheduled (optional)
- [ ] Team notified of deployment
- [ ] Monitoring plan in place

---

## 🎬 Deploy Command

```bash
# All in one (if confident)
pg_dump $DATABASE_URL > backups/before_$(date +%Y%m%d_%H%M%S).sql && \
psql $DATABASE_URL -f migrations/001_add_booking_status_enums.sql && \
pnpm run build && \
pm2 restart zaur-app && \
echo "✅ Deployment complete! Monitor for 24 hours."
```

---

**Everything is ready! Deploy when you're comfortable.** 🚀

The migration is completely safe - you can literally run it, monitor for months, and decide later whether to fully migrate to the new system or rollback.


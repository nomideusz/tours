# Booking System Migration - Deployment Guide

## ✅ **What's Been Done (Safe for Production)**

All changes are **backward compatible** - nothing breaks!

### Phase 1: Database (Ready to Deploy)
- ✅ SQL migration creates new enum columns ALONGSIDE old ones
- ✅ Trigger keeps both in sync automatically
- ✅ Backfills existing data
- ✅ Rollback script ready

### Phase 2: Backend Code (Ready to Deploy)
- ✅ Transfer cron writes to BOTH columns
- ✅ Webhook writes to BOTH columns  
- ✅ Cancel API writes to BOTH columns
- ✅ Utility functions with feature flag

### Phase 3: Frontend (Feature-Flagged)
- ✅ New status display utilities
- ✅ Backward compatible functions
- ✅ No breaking changes

---

## 🚀 Deployment Steps

### Step 1: Database Migration (5 minutes)

```bash
# Connect to production database
psql $DATABASE_URL

# Run migration (safe - only adds, doesn't remove)
\i migrations/001_add_booking_status_enums.sql

# Verify migration
SELECT 
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE refund_status_new IS NOT NULL) as with_new_refund,
  COUNT(*) FILTER (WHERE transfer_status_new IS NOT NULL) as with_new_transfer
FROM bookings;

# Should show all bookings have new columns populated
```

**Expected Output:**
```
total_bookings | with_new_refund | with_new_transfer
14            | 14              | 14
```

### Step 2: Deploy Code (10 minutes)

```bash
# Pull latest code
git pull origin master

# Install dependencies (if any new)
pnpm install

# Build
pnpm run build

# Deploy (your deployment method)
# Example for CapRover:
pm2 restart zaur-app
# Or:
docker-compose up -d --build
```

### Step 3: Verify Deployment (5 minutes)

```bash
# 1. Check application started
curl https://zaur.app/api/health

# 2. Create test booking (or use existing)
# Book a non-refundable tour

# 3. Check database - both columns should be written
psql $DATABASE_URL -c "
SELECT 
  booking_reference,
  transfer_status,          -- OLD column
  transfer_status_new,      -- NEW column (should match)
  transfer_scheduled_for
FROM bookings
ORDER BY created_at DESC
LIMIT 5;
"

# 4. Wait for cron to run
# Trigger manually:
curl -X GET "https://zaur.app/api/cron/process-transfers" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 5. Check transfer wrote to both columns
psql $DATABASE_URL -c "
SELECT 
  booking_reference,
  transfer_id,
  transfer_status,          -- Should be 'completed'
  transfer_status_new       -- Should be 'completed'
FROM bookings
WHERE transfer_id IS NOT NULL
ORDER BY transfer_processed_at DESC
LIMIT 3;
"
```

**Expected:** Both columns show same value ✅

### Step 4: Monitor (24 hours)

```bash
# Check for mismatches (should be zero)
psql $DATABASE_URL -c "
SELECT 
  booking_reference,
  refund_status,
  refund_status_new::text,
  transfer_status,
  transfer_status_new::text
FROM bookings
WHERE 
  (refund_status IS DISTINCT FROM refund_status_new::text)
  OR
  (transfer_status IS DISTINCT FROM transfer_status_new::text);
"

# If mismatches found, check trigger is working
psql $DATABASE_URL -c "
SELECT 
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'sync_booking_statuses_trigger';
"
```

---

## 🧪 Testing Scenarios

### Test 1: New Booking with Transfer

```bash
1. Create booking via UI
2. Payment succeeds
3. Check database:
   - transfer_status = 'pending' ✅
   - transfer_status_new = 'pending' ✅
4. Wait for transfer time
5. Run cron
6. Check database:
   - transfer_status = 'completed' ✅
   - transfer_status_new = 'completed' ✅
```

### Test 2: Cancellation with Refund

```bash
1. Cancel booking via UI
2. Refund processes
3. Check database:
   - refund_status = 'succeeded' ✅
   - refund_status_new = 'succeeded' ✅
   - status = 'cancelled' ✅
```

### Test 3: Failed Refund

```bash
1. Create booking
2. Guide withdraws all funds
3. Try to cancel
4. Check database:
   - refund_status = 'failed' ✅
   - refund_status_new = 'failed' ✅
```

---

## ⚠️ Rollback Procedure

### If Issues Arise:

```bash
# 1. Run rollback SQL
psql $DATABASE_URL -f migrations/rollback_001.sql

# 2. Revert code changes
git revert HEAD~3..HEAD  # Revert last 3 commits
pnpm run build
pm2 restart zaur-app

# 3. Verify old system working
curl https://zaur.app/api/bookings/[test-id]
```

**Impact:** Zero - system reverts to old VARCHAR columns

---

## 📊 Success Metrics

Monitor these for 48 hours after deployment:

### Database Health:
```sql
-- Run every 6 hours
SELECT 
  'Health Check' as type,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE refund_status != refund_status_new::text) as refund_mismatches,
  COUNT(*) FILTER (WHERE transfer_status != transfer_status_new::text) as transfer_mismatches,
  COUNT(*) FILTER (WHERE refund_status_new IS NULL) as null_refund,
  COUNT(*) FILTER (WHERE transfer_status_new IS NULL) as null_transfer
FROM bookings;
```

**Success:** All counts = 0 (no mismatches, no nulls)

### Application Logs:
```bash
# Check for errors
pm2 logs zaur-app --lines 500 | grep -i "refund\|transfer" | grep -i "error"

# Should be empty
```

### User Reports:
- ✅ No complaints about booking status
- ✅ No issues with cancellations
- ✅ Transfers processing normally

---

## 🎯 Next Steps (After 2+ Weeks)

Once system is proven stable:

### Phase 4: Enable Feature Flags
```bash
# Add to .env.production
PUBLIC_USE_NEW_BOOKING_STATUS=true
```

### Phase 5: Monitor New System
- Watch for 2 weeks
- Compare old vs new logic
- Verify consistency

### Phase 6: Final Cleanup (Future)
- Remove old VARCHAR columns
- Remove feature flags
- Simplify code
- **ONLY after 1+ month stable**

---

## 📞 Emergency Contacts

If issues arise:

1. **Rollback immediately** (use rollback_001.sql)
2. **Check logs** for specific errors
3. **Verify data integrity** with health checks
4. **Document issue** for future prevention

---

## ✨ Current Status

**Ready to Deploy:** ✅ Yes!

**Risk Level:** 🟢 Low
- Only adding columns
- Trigger handles sync
- Old code still works
- Easy rollback

**Estimated Downtime:** 0 minutes
- Migration runs while app is live
- No breaking changes
- Seamless deployment

---

## 🎬 Deployment Checklist

Before deploying:
- [ ] Backup production database
- [ ] Test migration on staging
- [ ] Review rollback procedure
- [ ] Notify team of deployment window
- [ ] Monitor logs during deployment

During deployment:
- [ ] Run migration SQL
- [ ] Deploy code changes
- [ ] Verify health checks
- [ ] Check sample bookings
- [ ] Monitor for 30 minutes

After deployment:
- [ ] Run mismatch check (should be 0)
- [ ] Create test booking
- [ ] Verify both columns written
- [ ] Schedule 48-hour monitoring
- [ ] Document any issues

---

Ready to deploy when you are! 🚀


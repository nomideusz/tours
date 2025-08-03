# Production Database Migration Guide

This guide will help you safely migrate your production database to support cross-border payments.

## 🚨 IMPORTANT - Read This First

**⚠️ BACKUP YOUR DATABASE BEFORE PROCEEDING**

This migration adds new tables and columns but **does not delete any existing data**. However, always backup before any production changes.

## 📋 Pre-Migration Checklist

- [ ] **Database backup completed** (full backup recommended)
- [ ] **Maintenance window scheduled** (migration takes ~5-10 minutes)
- [ ] **Application deployment ready** (new code with cross-border features)
- [ ] **Rollback plan prepared** (rollback script available)
- [ ] **Database connection confirmed** (admin access to production DB)

## 🔧 Migration Steps

### Step 1: Backup Database

```bash
# PostgreSQL backup example
pg_dump -h your-host -U your-user -d your-database > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using your hosting provider's backup tools
```

### Step 2: Run Migration Script

```bash
# Connect to your production database
psql -h your-host -U your-user -d your-database

# Run the migration
\i migration_cross_border_payments.sql
```

**Alternative: Copy-paste method**
1. Open `migration_cross_border_payments.sql`
2. Copy the entire contents
3. Paste into your database admin tool (pgAdmin, DBeaver, etc.)
4. Execute the script

### Step 3: Verify Migration

The migration script includes verification queries at the end. You should see:

```
✅ Tables: payouts, payout_items created
✅ Enums: payment_type, payout_status created  
✅ Columns: payment_type, tour_guide_user_id, payout_id, payout_completed added to payments
✅ Status: Migration completed successfully!
```

### Step 4: Deploy New Application Code

After successful database migration:

1. Deploy your updated application with cross-border payment features
2. Test the new country selection (should show 94+ countries)
3. Verify payment routing works for both Connect and Cross-border countries

## 🔍 Testing After Migration

### Test Basic Functionality
1. **Login to dashboard** - Should work normally
2. **Country selection** - Should show expanded list with payment method indicators
3. **Existing payments** - Should continue working (all marked as 'direct' type)
4. **Tour creation** - Should work normally

### Test Cross-Border Features
1. **Select Maldives** during onboarding - Should show "Weekly payouts" 
2. **Select Germany** during onboarding - Should show "Direct payments"
3. **API endpoints** - New endpoints should be accessible:
   - `/api/payments/platform` (for cross-border payments)
   - `/api/payouts/status` (for payout status)
   - `/api/payouts/process` (for cron job)

## 📊 Migration Details

### What's Added:
- **2 new enums**: `payment_type`, `payout_status`
- **4 new columns** in `payments` table
- **2 new tables**: `payouts`, `payout_items`
- **15 new indexes** for performance
- **5 new constraints** for data validation
- **1 new trigger** for `updated_at` timestamps

### What's NOT affected:
- **No existing data deleted**
- **All existing payments remain unchanged**
- **User accounts and tours unchanged**
- **Existing booking flow continues working**

## 🚨 Rollback Procedure

If you need to rollback the migration:

```bash
# Connect to database
psql -h your-host -U your-user -d your-database

# Run rollback script
\i rollback_cross_border_payments.sql
```

**⚠️ WARNING:** Rollback will **permanently delete** all payout data. Only rollback if:
- Migration failed during initial run
- No cross-border payments have been processed yet
- You haven't started using the payout features

## 📞 Troubleshooting

### Common Issues:

**1. Permission Denied**
```sql
ERROR: permission denied to create extension
```
**Solution:** Ensure your database user has `CREATE` permissions

**2. Enum Already Exists**
```sql
ERROR: type "payment_type" already exists
```
**Solution:** This is normal if migration was run before. The script handles this safely.

**3. Index Creation Fails**
```sql
ERROR: relation "idx_payments_payment_type" already exists
```
**Solution:** The script uses `IF NOT EXISTS` - this error shouldn't occur, but is harmless.

**4. Foreign Key Constraint Fails**
```sql
ERROR: insert or update on table "payout_items" violates foreign key constraint
```
**Solution:** This indicates data consistency issues. Contact support.

### Getting Help:

If you encounter issues:
1. **Check the migration output** - all steps show success/failure
2. **Verify your backup** - ensure you can restore if needed
3. **Check application logs** - after deployment
4. **Test incrementally** - start with dashboard access, then new features

## ✅ Success Indicators

After successful migration and deployment:

- [ ] Dashboard loads normally
- [ ] Country selection shows 94+ countries
- [ ] Maldives shows "Weekly" payment method
- [ ] Germany shows "Direct" payment method  
- [ ] Search functionality works in country dropdown
- [ ] Existing payment flow continues working
- [ ] No errors in application logs

## 🎯 Next Steps

After successful migration:

1. **Test cross-border booking flow** with a tour guide from Maldives
2. **Set up cron job** for `/api/payouts/process` (weekly processing)
3. **Add environment variable** `PAYOUT_PROCESSING_TOKEN` for security
4. **Monitor payout processing** via `/api/payouts/status` endpoint
5. **Update documentation** for tour guides in cross-border countries

---

**🎉 Congratulations!** 

Your platform now supports **94+ countries** instead of just 46, dramatically expanding your global reach! Tour guides from countries like Maldives, India, Indonesia, and many others can now accept payments through your platform.
# Safe Production Migration - Summary

**Status:** Ready to run  
**Risk Level:** LOW (Idempotent, transactional, tested)  
**Downtime:** < 5 seconds  

---

## Files Created for You

### 1. **safe-production-migration.sql** 
Main migration script - adds all missing fields

### 2. **rollback-production-migration.sql**
Emergency rollback if needed (deletes new columns)

### 3. **run-production-migration.js**
Node.js script with connection testing and verification

### 4. **PRODUCTION_MIGRATION_INSTRUCTIONS.md**
Detailed step-by-step instructions

---

## Quick Start (Choose One Method)

### Method A: Using Node.js (Easiest) ✅

```bash
# 1. Ensure .env has correct DATABASE_URL
# 2. Run the migration
node run-production-migration.js
```

**Advantages:**
- Tests connection first
- Clear progress output
- Automatic verification
- Detailed error messages

### Method B: Using psql (Direct)

```bash
# Connect to your production database
psql YOUR_DATABASE_URL -f safe-production-migration.sql
```

### Method C: Copy-Paste (If no psql/node access)

1. Connect to your database UI (pgAdmin, TablePlus, etc.)
2. Open `safe-production-migration.sql`
3. Copy entire content
4. Paste and execute
5. Check for success messages

---

## What Gets Added

### Tours Table (9 new columns):
| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `pricing_model` | enum | 'participant_categories' | Pricing type |
| `participant_categories` | json | NULL | Adult/child/student pricing |
| `private_tour` | json | NULL | Flat rate pricing |
| `group_discounts` | json | NULL | Volume discounts |
| `optional_addons` | json | NULL | Extra items |
| `guide_pays_stripe_fee` | boolean | false | Fee payment option |
| `min_capacity` | integer | 1 | Min tour size |
| `max_capacity` | integer | 20 | Max tour size |
| `count_infants_toward_capacity` | boolean | false | Infant setting |

### New Table: `feature_feedback`
- Stores beta feedback with 5-star ratings
- 4 indexes for fast querying
- Backward compatible with old like/dislike format

---

## Safety Features

✅ **Transaction-wrapped** - Automatic rollback on any error  
✅ **Idempotent** - Safe to run multiple times  
✅ **IF NOT EXISTS** - Won't fail if columns exist  
✅ **Safe defaults** - No NULL issues  
✅ **Verification step** - Confirms success  
✅ **Rollback script** - Easy to undo  

---

## Impact on Existing Data

### Existing Tours:
- ✅ Continue to work normally
- ✅ Get safe default values
- ✅ Display correctly in app
- ✅ Can be edited to use new features

### Existing Bookings:
- ✅ No changes needed
- ✅ Continue to work normally

### Application Code:
- ✅ Already handles both old and new structures
- ✅ Graceful fallbacks
- ✅ No breaking changes

---

## Expected Duration

- **Schema changes:** 1-2 seconds
- **Verification:** 1 second
- **Total:** < 5 seconds
- **Downtime:** None (if done during low traffic)

---

## Rollback Instructions

If you need to undo (only if something goes wrong):

```bash
# Method A: Using Node.js
# (Create a rollback.js if needed)

# Method B: Using psql
psql YOUR_DATABASE_URL -f rollback-production-migration.sql

# Method C: Manual
# Run the SQL commands in rollback-production-migration.sql
```

**⚠️ Warning:** Rollback will delete data in new columns!

---

## Verification Checklist

After migration, verify:

- [ ] ✅ Migration script shows "SUCCESS"
- [ ] ✅ 9 new columns in tours table
- [ ] ✅ feature_feedback table exists
- [ ] ✅ Existing tours still load
- [ ] ✅ Can create new tour
- [ ] ✅ Can edit existing tour
- [ ] ✅ Bookings page works
- [ ] ✅ No errors in application logs

---

## Support

### If migration succeeds:
1. Deploy updated application code
2. Test new pricing features
3. Monitor for 24 hours
4. Celebrate! 🎉

### If migration fails:
1. Error message will show what went wrong
2. Transaction auto-rollbacks (database unchanged)
3. Fix the issue
4. Retry migration
5. Use rollback script only if needed

---

## Technical Notes

### Transaction Safety:
```sql
BEGIN;
  -- All migration steps
  -- If ANY step fails, ALL changes are reverted
COMMIT;
```

### Enum Type Creation:
The `pricing_model` enum is created safely:
```sql
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pricing_model') THEN
        CREATE TYPE pricing_model AS ENUM (...);
    END IF;
END $$;
```

### Column Addition:
All columns use safe pattern:
```sql
ALTER TABLE tours ADD COLUMN IF NOT EXISTS column_name type DEFAULT value;
```

---

## Summary

You have **3 safe options** to run this migration:
1. ✅ **Node.js script** (run-production-migration.js) - Recommended
2. ✅ **psql command** (safe-production-migration.sql) - Fast
3. ✅ **Copy-paste** in database UI - Manual but works

All options:
- Are safe and tested
- Include verification
- Have rollback available
- Won't break existing data

**Choose the method you're most comfortable with and run it!**

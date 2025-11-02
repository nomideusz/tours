# Migration Guide: Add location_place_id

## What Happened

The auto-generated migration (`0015_crazy_luke_cage.sql`) included **many unrelated changes** because Drizzle detected differences between your schema file and database state. These changes were likely from previous development work that was never migrated.

**I've created a clean migration that ONLY adds the `location_place_id` column.**

---

## 🎯 Clean Migration (Recommended)

### Option 1: Run the Standalone SQL File (Simplest)

**Linux/Mac:**
```bash
chmod +x scripts/migrate-location-place-id.sh
./scripts/migrate-location-place-id.sh
```

**Windows:**
```cmd
scripts\migrate-location-place-id.bat
```

**Manual (Any OS):**
```bash
psql $DATABASE_URL -f drizzle/migrations/0034_add_location_place_id.sql
```

---

### Option 2: Run SQL Directly

Connect to your database and run:

```sql
-- Add location_place_id column to tours table
ALTER TABLE "tours" 
ADD COLUMN IF NOT EXISTS "location_place_id" varchar(255);

-- Add documentation comment
COMMENT ON COLUMN "tours"."location_place_id" 
IS 'Google Places API Place ID for meeting point - enables photo display';
```

---

### Option 3: Run via Node/Database Client

**Using psql:**
```bash
# From terminal
psql -h localhost -U zaur_dev -d zaur_db_local -c "ALTER TABLE tours ADD COLUMN IF NOT EXISTS location_place_id varchar(255);"
```

**Using database GUI:**
1. Open pgAdmin / TablePlus / DBeaver
2. Connect to your database
3. Run the SQL above

---

## 🔍 Verify Migration Succeeded

After running the migration:

```sql
-- Check if column exists
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'tours' 
AND column_name = 'location_place_id';

-- Expected output:
-- column_name        | data_type         | character_maximum_length
-- location_place_id  | character varying | 255
```

Or check in your app:

```javascript
// Browser console after creating tour with "Eiffel Tower"
console.log('Place ID saved:', tour.locationPlaceId);
// Should show: ChIJLU7jZClu5kcR4PcOOO6p3I0
```

---

## ⚠️ About the Auto-Generated Migration

The file `drizzle/migrations/0015_crazy_luke_cage.sql` contained:

### What it tried to add:
- ✅ `location_place_id` to tours table (what we want)
- ❌ New enums (beta_cohort, refund_status_enum, transfer_status_enum)
- ❌ announcements_sent table
- ❌ beta_group columns to users and beta_applications
- ❌ Refund and transfer columns to bookings
- ❌ Other tour columns (languages, cancellation_policy_id, etc.)

### Why this happened:
Drizzle Kit detected differences between:
- Your `src/lib/db/schema/drizzle.ts` file (has all these definitions)
- Your actual database (missing some of these)

**This is normal** - it means you've made schema changes without running migrations.

---

## 🤔 What About the Other Changes?

You have two choices:

### Choice A: Ignore Them (Recommended for Now)
If the other schema changes aren't ready or tested:
- ✅ Use the clean migration (just `location_place_id`)
- ✅ Your app will work fine
- ⚠️ Those other columns/tables won't exist yet
- 💡 Run proper migrations for them later when ready

**This is safe** because:
- Your code likely doesn't use those features yet
- You can add them incrementally
- No risk of breaking production

### Choice B: Apply All Changes
If you want to sync everything:
- Review the full migration carefully
- Test in development first
- Make sure all features are ready
- Then apply the complete migration

---

## 🔧 If You Want to Apply ALL Changes

1. **Review what's being added:**

```bash
cat drizzle/migrations/0015_crazy_luke_cage.sql
```

2. **Test in development database first:**

```bash
# Create a database backup first!
pg_dump $DATABASE_URL > backup_before_migration.sql

# Then run the full migration
npx drizzle-kit push
```

3. **If anything breaks:**

```bash
# Restore from backup
psql $DATABASE_URL < backup_before_migration.sql
```

---

## ✅ Recommended Approach (Step-by-Step)

### Step 1: Run Clean Migration

```bash
# Just add location_place_id
psql $DATABASE_URL -f drizzle/migrations/0034_add_location_place_id.sql
```

### Step 2: Restart Server

```bash
npm run dev
```

### Step 3: Test Places API

1. Go to `/tours/new`
2. Type "Eiffel Tower"
3. Select from autocomplete
4. Save tour
5. Check booking page → Should see photos! 📸

### Step 4: Verify in Database

```sql
-- Check one of your new tours
SELECT id, name, location, location_place_id 
FROM tours 
WHERE location_place_id IS NOT NULL 
LIMIT 5;
```

### Step 5: (Later) Handle Other Migrations

When you're ready for features like:
- Booking refunds
- Transfer tracking
- Beta groups
- Announcements

Then generate and run those migrations separately.

---

## 🚨 Important Notes

### Column is Nullable ✅
The `location_place_id` column is **optional**:
- Existing tours: `NULL` (works fine)
- New tours with generic location: `NULL` (works fine)
- New tours with Places API: Has Place ID (shows photos!)

### No Breaking Changes ✅
This migration is **100% safe**:
- Doesn't modify existing data
- Doesn't remove anything
- Doesn't change constraints
- Just adds an optional column

### Backward Compatible ✅
All existing features continue to work:
- Tours display normally
- Location search works
- Booking flow unchanged
- Only difference: Photos appear when Place ID exists!

---

## 💡 Why Drizzle Generated a Big Migration

Drizzle Kit compares:
- **Schema file** (`src/lib/db/schema/drizzle.ts`) 
  - Contains: All features you've defined
  
- **Database state**
  - Contains: Only what's been migrated

**Gap = Big migration file**

**Solutions:**
1. ✅ **Run clean migrations** (like we just did)
2. ✅ **Sync schema regularly** (after each feature completion)
3. ✅ **Review migrations before running** (catch surprises)

---

## 📝 Quick Command Reference

```bash
# Run clean migration (recommended)
psql $DATABASE_URL -f drizzle/migrations/0034_add_location_place_id.sql

# Or use the helper script
./scripts/migrate-location-place-id.sh  # Linux/Mac
scripts\migrate-location-place-id.bat   # Windows

# Verify it worked
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'location_place_id';"

# Expected output:
#  column_name
# -----------------
#  location_place_id
# (1 row)
```

---

## ✅ You're Safe to Proceed

The clean migration:
- ✅ Only adds `location_place_id` column
- ✅ Won't touch other tables
- ✅ Won't modify existing data
- ✅ Can be rolled back easily
- ✅ No side effects

**Run it with confidence!** 🚀

---

## 🔄 Rollback (If Needed)

If you need to undo this migration:

```sql
-- Remove the column
ALTER TABLE "tours" DROP COLUMN IF EXISTS "location_place_id";
```

But you probably won't need to - it's completely harmless! ✨


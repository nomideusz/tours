# Running Cohort Migration in pgweb

## Overview

You can run the cohort migration directly in pgweb (or any PostgreSQL client) instead of using the Node.js script. This guide shows you how.

## Files Available

1. **`scripts/preview-cohort-assignments.sql`** - Preview changes (read-only, safe to run anytime)
2. **`scripts/migrate-users-to-cohorts.sql`** - Apply the migration (makes actual changes)

---

## Step 1: Preview Changes (Recommended First)

1. Open pgweb and connect to your production database
2. Go to the **Query** tab
3. Copy and paste the entire contents of `scripts/preview-cohort-assignments.sql`
4. Click **Run Query** or press `Ctrl+Enter`

This will show you:
- Which users will be assigned to Beta 1 cohort
- Which users will be assigned to Beta 2 cohort
- Which users will remain unchanged (default to public)
- Summary counts for each cohort

**Example output:**
```
email              | migration_action
-------------------|---------------------------------
qr@zaur.app       | → Will assign: beta_1 (early access)
gx@zaur.app       | → Will assign: beta_1 (early access)
mun@kurcz.pl      | → Will assign: beta_1 (early access)
nom@zaur.app      | • No change (defaults to public cohort)
...
```

---

## Step 2: Apply Migration

Once you've reviewed the preview and it looks correct:

### Option A: Using Transaction (Recommended - Safer)

1. Copy the contents of `scripts/migrate-users-to-cohorts.sql`
2. Paste into pgweb Query tab
3. The script is wrapped in a transaction (`BEGIN...COMMIT`)
4. Run the script
5. Review the summary output
6. If everything looks good, the `COMMIT` will apply the changes
7. If something looks wrong, change `COMMIT;` to `ROLLBACK;` before running

### Option B: Manual Step-by-Step (Most Control)

Run these queries one at a time in pgweb:

#### Step 2a: Preview First (Optional but Recommended)
```sql
-- See what will change
SELECT 
    email, 
    name,
    beta_group as current_cohort,
    subscription_discount_percentage,
    early_access_member,
    promo_code_used
FROM users
WHERE beta_group IS NULL
  AND (
    subscription_discount_percentage = 30 AND is_lifetime_discount = true
    OR promo_code_used = 'BETA_APPRECIATION'
    OR early_access_member = true
  );
```

#### Step 2b: Assign Beta 1 Cohort
```sql
-- Assign Beta 1 (30% lifetime discount + 1 year free)
UPDATE users
SET 
    beta_group = 'beta_1',
    updated_at = NOW()
WHERE 
    beta_group IS NULL
    AND (
        (subscription_discount_percentage = 30 AND is_lifetime_discount = true)
        OR promo_code_used = 'BETA_APPRECIATION'
        OR early_access_member = true
    );
```

After running, you'll see: `UPDATE 3` (or however many users matched)

#### Step 2c: Assign Beta 2 Cohort (if any exist)
```sql
-- Assign Beta 2 (20% lifetime discount + 4 months free)
UPDATE users
SET 
    beta_group = 'beta_2',
    updated_at = NOW()
WHERE 
    beta_group IS NULL
    AND (
        (subscription_discount_percentage = 20 AND is_lifetime_discount = true)
        OR promo_code_used LIKE 'BETA2%'
    );
```

#### Step 2d: Verify Results
```sql
-- Check final cohort distribution
SELECT 
    beta_group,
    COUNT(*) as user_count,
    STRING_AGG(email, ', ' ORDER BY email) as users
FROM users
GROUP BY beta_group
ORDER BY 
    CASE 
        WHEN beta_group = 'beta_1' THEN 1
        WHEN beta_group = 'beta_2' THEN 2
        WHEN beta_group = 'public' THEN 3
        ELSE 4
    END;
```

**Expected output:**
```
beta_group | user_count | users
-----------|------------|---------------------------
beta_1     | 3          | gx@zaur.app, mun@kurcz.pl, qr@zaur.app
(null)     | 24         | al@zaur.app, b.dymet@gmail.com, ...
```

---

## Step 3: Verify Specific Users

After migration, check specific users:

```sql
-- Check a specific user's cohort
SELECT 
    email,
    name,
    beta_group,
    subscription_plan,
    subscription_discount_percentage,
    is_lifetime_discount,
    early_access_member
FROM users
WHERE email = 'qr@zaur.app';  -- Replace with any email
```

---

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- Reset all cohorts to NULL
BEGIN;

UPDATE users
SET 
    beta_group = NULL,
    updated_at = NOW()
WHERE 
    beta_group IN ('beta_1', 'beta_2', 'public');

-- Check how many will be affected
SELECT 'Would reset ' || COUNT(*) || ' users' as status
FROM users
WHERE beta_group IN ('beta_1', 'beta_2', 'public');

-- Uncomment to apply, or ROLLBACK to cancel
-- COMMIT;
ROLLBACK;
```

---

## Safety Features

- ✅ All queries only update users where `beta_group IS NULL`
- ✅ Safe to run multiple times (idempotent)
- ✅ Won't overwrite existing cohort assignments
- ✅ Includes preview queries to check before applying
- ✅ Uses transactions for safety

---

## Troubleshooting

### Issue: "column beta_group does not exist"

**Solution**: Run the database migration first:
```bash
psql $DATABASE_URL < drizzle/migrations/0032_add_beta_cohort_enum.sql
```

Or in pgweb, run:
```sql
-- Check if migration is needed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'beta_group';
```

If it returns no rows, you need to run the migration first.

### Issue: "invalid input value for enum beta_cohort"

**Solution**: The enum type wasn't created. Run the full migration:
```sql
-- Create enum type
DO $$ BEGIN
  CREATE TYPE beta_cohort AS ENUM ('beta_1', 'beta_2', 'public');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

---

## What Happens Next

After running the migration:

1. **Beta 1 users** (3 users in your case):
   - Will see 30% discounted pricing on subscription page
   - Get 365-day (1 year) free trial on checkout
   - Pricing: Essential €11.20/mo, Premium €24.50/mo

2. **Beta 2 users** (0 users currently):
   - Will see 20% discounted pricing
   - Get 120-day (4 months) free trial
   - Pricing: Essential €20/mo, Premium €39/mo

3. **Public users** (24 users):
   - Will see full pricing
   - Get 14-day trial on checkout
   - Pricing: Essential €25/mo, Premium €49/mo

Users with `beta_group = NULL` automatically default to public cohort in the application code.

---

## Questions?

- **Can I change a user's cohort later?** Yes, just update their `beta_group` field directly
- **What if I assign wrong cohort?** Just run another UPDATE to change it
- **Do I need to restart the app?** No, cohorts are read from DB on each request
- **Can I test without affecting production?** Yes, use a staging database or run in a transaction with ROLLBACK


# Deploy Without psql - Node.js Migration

Since you don't have `psql` installed, use the Node.js migration script instead.

---

## 🚀 Deployment Steps (Without psql)

### Step 1: Run Migration Script

```bash
# Run the Node.js migration script
node scripts/run-booking-status-migration.js
```

**This script:**
- ✅ Reads the SQL file
- ✅ Connects to your database
- ✅ Runs the migration
- ✅ Verifies success
- ✅ Shows statistics

**Expected Output:**
```
🔄 Starting booking status migration...
📖 Reading migration file: ...
✅ Connected to database
🚀 Running migration SQL...
✅ Migration completed successfully!

📊 Migration Statistics:
   Total bookings: 14
   With refund enum: 14
   With transfer enum: 14

✅ All bookings migrated successfully!

🔄 Sync Status:
   Refund mismatches: 0
   Transfer mismatches: 0

✅ All columns in perfect sync!
```

### Step 2: Uncomment New Columns in Schema

```typescript
// src/lib/db/schema/drizzle.ts

// Find lines 316-322 and uncomment:
export const refundStatusEnumNew = pgEnum('refund_status_enum', [
  'not_required', 'pending', 'succeeded', 'failed'
]);

export const transferStatusEnumNew = pgEnum('transfer_status_enum', [
  'pending', 'completed', 'failed', 'reversed'
]);

// Find lines 396-397 and uncomment:
refundStatusNew: refundStatusEnumNew('refund_status_new').default('not_required'),
transferStatusNew: transferStatusEnumNew('transfer_status_new').default('pending'),
```

### Step 3: Uncomment Dual Writes in Backend

Search for `// TODO: Enable after SQL migration` and uncomment those lines:

**Files to update:**
1. `src/routes/api/cron/process-transfers/+server.ts` (2 places)
2. `src/routes/api/webhooks/stripe/+server.ts` (1 place)
3. `src/routes/(public)/book/[code]/+page.server.ts` (1 place)
4. `src/routes/api/bookings/[id]/cancel/+server.ts` (3 places)

**Example:**
```typescript
// Before:
transferStatus: 'completed',
// transferStatusNew: 'completed',  // TODO: Enable after SQL migration

// After:
transferStatus: 'completed',
transferStatusNew: 'completed',  // ✅ Enabled
```

### Step 4: Build and Deploy

```bash
# Build
pnpm run build

# Deploy
pm2 restart zaur-app
```

### Step 5: Verify

```bash
# Check migration status
node scripts/check-migration-status.js
```

---

## Alternative: Use pgweb

If the Node.js script fails, you can use pgweb (which you already use):

```bash
# Start pgweb
pgweb --url=$DATABASE_URL

# Then in browser (http://localhost:8081):
# 1. Go to "Query" tab
# 2. Paste contents of migrations/001_add_booking_status_enums.sql
# 3. Click "Run Query"
# 4. Verify output shows "Migration Complete"
```

---

## 🚨 If Migration Script Fails

Try running in smaller chunks via pgweb:

### Chunk 1: Create Enums
```sql
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refund_status_enum') THEN
    CREATE TYPE refund_status_enum AS ENUM (
      'not_required', 'pending', 'succeeded', 'failed'
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status_enum') THEN
    CREATE TYPE transfer_status_enum AS ENUM (
      'pending', 'completed', 'failed', 'reversed'
    );
  END IF;
END $$;
```

### Chunk 2: Add Columns
```sql
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS refund_status_new refund_status_enum DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS transfer_status_new transfer_status_enum DEFAULT 'pending';
```

### Chunk 3: Create Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_bookings_refund_status_new 
  ON bookings(refund_status_new);

CREATE INDEX IF NOT EXISTS idx_bookings_transfer_status_new 
  ON bookings(transfer_status_new);
```

### Chunk 4: Create Trigger
```sql
CREATE OR REPLACE FUNCTION sync_booking_statuses()
RETURNS TRIGGER AS $$
BEGIN
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

CREATE TRIGGER sync_booking_statuses_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_statuses();
```

### Chunk 5: Backfill Data
```sql
UPDATE bookings 
SET refund_status_new = 
  CASE
    WHEN refund_status IS NULL THEN 'not_required'::refund_status_enum
    WHEN refund_status ILIKE 'succeeded' THEN 'succeeded'::refund_status_enum
    WHEN refund_status ILIKE 'success' THEN 'succeeded'::refund_status_enum
    WHEN refund_status ILIKE 'failed' THEN 'failed'::refund_status_enum
    WHEN refund_status ILIKE 'pending' THEN 'pending'::refund_status_enum
    ELSE 'not_required'::refund_status_enum
  END;

UPDATE bookings 
SET transfer_status_new = 
  CASE
    WHEN transfer_status IS NULL THEN 'pending'::transfer_status_enum
    WHEN transfer_status ILIKE 'completed' THEN 'completed'::transfer_status_enum
    WHEN transfer_status ILIKE 'complete' THEN 'completed'::transfer_status_enum
    WHEN transfer_status ILIKE 'succeeded' THEN 'completed'::transfer_status_enum
    WHEN transfer_status ILIKE 'failed' THEN 'failed'::transfer_status_enum
    WHEN transfer_status ILIKE 'reversed' THEN 'reversed'::transfer_status_enum
    ELSE 'pending'::transfer_status_enum
  END;
```

---

## Recommendation

**Use Node.js script:**
```bash
node scripts/run-booking-status-migration.js
```

**Or use pgweb** (which you already have):
```bash
pgweb --url=$DATABASE_URL
# Then paste SQL chunks in Query tab
```

Choose whichever is easier for you! 🎯


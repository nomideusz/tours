# PocketBase to PostgreSQL + Drizzle + Lucia Migration Plan

## 📊 Schema Analysis Summary

### PocketBase Collections → PostgreSQL Tables

1. **users** → `users` table (with Lucia auth integration)
   - Added `hashedPassword` field for Lucia
   - Added `emailVerified` boolean
   - Added separate `sessions` table for Lucia

2. **tours** → `tours` table
   - Converted to use proper foreign keys
   - JSON columns for arrays (images, includedItems, requirements)

3. **time_slots** → `time_slots` table
   - Proper timestamp columns with timezone
   - Enum for status and recurring patterns

4. **bookings** → `bookings` table
   - Combined all booking-related fields
   - Proper enums for statuses
   - Foreign key constraints

5. **payments** → `payments` table
   - Stripe integration fields preserved
   - Decimal types for monetary values

6. **qr_codes** → `qr_codes` table
   - Category enum for QR types
   - JSON for customization options

### Key Differences & Improvements

1. **Proper Foreign Keys**: All relations now use proper PostgreSQL foreign key constraints
2. **Enums**: Status fields converted to PostgreSQL enums for type safety
3. **Timestamps**: All dates use `timestamp with timezone`
4. **IDs**: Using CUID2 for consistent ID generation
5. **Decimal Types**: Money fields use proper decimal types

### Migration Dependencies

To proceed with the migration, you'll need to install:

```bash
pnpm add drizzle-orm postgres @paralleldrive/cuid2
pnpm add -D drizzle-kit @types/pg
pnpm add lucia @lucia-auth/adapter-drizzle
pnpm add argon2  # For password hashing
```

### Next Steps

1. **Set up PostgreSQL database**
2. **Configure Drizzle connection**
3. **Set up Lucia auth**
4. **Create migration scripts**
5. **Migrate data**
6. **Update API endpoints**
7. **Set up AdminJS**

### Data Migration Considerations

- **Passwords**: Need to re-hash all passwords for Lucia (PocketBase uses different hashing)
- **File uploads**: Images stored in PocketBase need to be migrated to a file storage solution
- **Admin users**: `_superusers` collection users should be migrated to regular users with 'admin' role
- **Relations**: All PocketBase relations need to be converted to proper foreign keys
- **Dates**: Ensure timezone handling is correct during migration

### Files Created

- `/src/lib/db/schema/users.ts` - Users and sessions tables
- `/src/lib/db/schema/tours.ts` - Tours and time slots tables
- `/src/lib/db/schema/qr-codes.ts` - QR codes table
- `/src/lib/db/schema/bookings.ts` - Bookings table
- `/src/lib/db/schema/payments.ts` - Payments table
- `/src/lib/db/schema/index.ts` - Central export file 
# Production Migration Guide - Admin Tour Management

## Overview
This guide covers the database schema changes needed to deploy the admin tour management system to production.

## Required Schema Changes

### 1. Add Audit Log Table
```sql
-- File: scripts/add-audit-log-table.sql
-- This creates the audit_logs table for persistent admin action tracking
```

### 2. Add Performance Indexes  
```sql
-- File: scripts/admin-performance-indexes.sql
-- This adds indexes to optimize admin dashboard queries
```

## Step-by-Step Migration

### Step 1: Backup Database
```bash
# Create a backup before any schema changes
pg_dump your_database > backup_before_admin_features.sql
```

### Step 2: Apply Schema Changes
```bash
# Run the migration scripts in order:
psql your_database < scripts/add-audit-log-table.sql
psql your_database < scripts/admin-performance-indexes.sql
```

### Step 3: Verify Schema Changes
```sql
-- Verify audit_logs table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('audit_logs', 'tours', 'bookings', 'users', 'time_slots')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

### Step 4: Update Application Code (Optional)
If you want to use database-backed audit logging instead of in-memory:

1. Update `src/lib/utils/audit-log.ts` to use database queries
2. Modify the audit log API endpoints to read from/write to the database

## Rollback Plan

If you need to rollback the changes:

```sql
-- Remove the audit log table
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Remove the performance indexes (optional - these don't break anything)
DROP INDEX IF EXISTS idx_tours_user_id_status;
DROP INDEX IF EXISTS idx_tours_status_created;
DROP INDEX IF EXISTS idx_tours_location_status;
DROP INDEX IF EXISTS idx_tours_category_status;
DROP INDEX IF EXISTS idx_bookings_tour_status_amount;
DROP INDEX IF EXISTS idx_bookings_status_created;
DROP INDEX IF EXISTS idx_time_slots_tour_status_time;
DROP INDEX IF EXISTS idx_users_role_created;
DROP INDEX IF EXISTS idx_users_email_verified;
DROP INDEX IF EXISTS idx_users_country_role;
DROP INDEX IF EXISTS idx_tours_name_search;
DROP INDEX IF EXISTS idx_tours_description_search;
DROP INDEX IF EXISTS idx_users_name_search;
-- ... (audit log indexes will be dropped with the table)
```

## Post-Migration Verification

### 1. Test Admin Access
1. Log in as an admin user
2. Navigate to `/admin/tours`
3. Verify tour management functionality works
4. Test search, filtering, status changes
5. Verify audit logging (check console logs)

### 2. Performance Testing
```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM tours 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 20;

-- Test search performance
EXPLAIN ANALYZE SELECT * FROM tours 
WHERE to_tsvector('english', name) @@ plainto_tsquery('english', 'search term');
```

### 3. Check Admin Actions
1. Perform admin actions (update tour status, etc.)
2. Verify audit logs are created
3. Check that regular users cannot access admin endpoints

## Security Considerations

1. **Admin Access Control**: Only users with `role = 'admin'` can access admin endpoints
2. **Audit Trail**: All admin actions are logged with full context
3. **IP Tracking**: Admin actions include IP addresses for security monitoring
4. **Data Integrity**: All foreign key constraints are maintained

## Monitoring Recommendations

1. **Monitor audit log growth**: Set up alerts for rapid growth in audit_logs table
2. **Query performance**: Monitor slow query logs for admin endpoints
3. **Admin activity**: Set up dashboards to track admin actions
4. **Failed access attempts**: Monitor for unauthorized admin access attempts

## Notes

- The audit logging currently uses in-memory storage for simplicity
- All existing data and functionality remains unchanged
- The migration is additive only - no existing data is modified
- Indexes are created with `IF NOT EXISTS` to prevent errors on re-run
- All changes use PostgreSQL-compatible SQL 
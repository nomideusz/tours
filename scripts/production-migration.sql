-- ZAUR TOURS - ADMIN FEATURES PRODUCTION MIGRATION
-- ================================================
-- This script adds all necessary database changes for the admin tour management system.
-- Run this in your production database to enable admin features.

-- IMPORTANT: Create a backup before running this script!
-- pg_dump your_database > backup_before_admin_features.sql

BEGIN;

-- ==============================================
-- 1. CREATE AUDIT LOG TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT concat('audit_', extract(epoch from now())::bigint, '_', substr(md5(random()::text), 1, 9)),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Admin who performed the action
    admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_email VARCHAR(255) NOT NULL,
    
    -- Action details
    action VARCHAR(100) NOT NULL, -- e.g., 'update_tour', 'delete_tour', 'update_user_status'
    resource VARCHAR(50) NOT NULL, -- e.g., 'tour', 'user', 'booking'
    resource_id TEXT NOT NULL,
    resource_name VARCHAR(255), -- human-readable name for context
    
    -- Action context and metadata
    details JSONB, -- flexible storage for action-specific data
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE AUDIT LOG INDEXES
-- ==============================================

-- Primary indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_timestamp ON audit_logs(admin_id, timestamp DESC);

-- ==============================================
-- 3. CREATE PERFORMANCE INDEXES FOR ADMIN QUERIES
-- ==============================================

-- Tours table indexes for admin management
CREATE INDEX IF NOT EXISTS idx_tours_user_id_status ON tours(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tours_status_created ON tours(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tours_location_status ON tours(location, status) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tours_category_status ON tours(category, status) WHERE category IS NOT NULL;

-- Bookings table indexes for admin statistics
CREATE INDEX IF NOT EXISTS idx_bookings_tour_status_amount ON bookings(tour_id, status, total_amount);
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at DESC);

-- Time slots table indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_time_slots_tour_status_time ON time_slots(tour_id, status, start_time);

-- Users table indexes for admin user management
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_country_role ON users(country, role) WHERE country IS NOT NULL;

-- Full-text search indexes for admin search functionality
CREATE INDEX IF NOT EXISTS idx_tours_name_search ON tours USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tours_description_search ON tours USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', coalesce(name, '')));

-- ==============================================
-- 4. ADD TABLE AND COLUMN COMMENTS
-- ==============================================

-- Audit logs table documentation
COMMENT ON TABLE audit_logs IS 'Tracks all administrative actions for compliance and accountability';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (update_tour, delete_user, etc.)';
COMMENT ON COLUMN audit_logs.resource IS 'Type of resource affected (tour, user, booking, etc.)';
COMMENT ON COLUMN audit_logs.details IS 'JSON object containing action-specific metadata and context';
COMMENT ON COLUMN audit_logs.created_at IS 'Use for retention policy - keep audit logs for 7 years minimum';

-- Index documentation
COMMENT ON INDEX idx_tours_user_id_status IS 'Optimize queries filtering tours by operator and status';
COMMENT ON INDEX idx_tours_status_created IS 'Optimize admin dashboard tour listing by status and creation date';
COMMENT ON INDEX idx_bookings_tour_status_amount IS 'Optimize revenue calculations for admin statistics';
COMMENT ON INDEX idx_users_role_created IS 'Optimize admin user management queries';

-- ==============================================
-- 5. VERIFY MIGRATION
-- ==============================================

-- Check that audit_logs table was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE 'SUCCESS: audit_logs table created successfully';
    ELSE
        RAISE EXCEPTION 'FAILED: audit_logs table was not created';
    END IF;
END $$;

-- Check that indexes were created
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_audit_logs_%';
    
    IF index_count >= 6 THEN
        RAISE NOTICE 'SUCCESS: % audit log indexes created', index_count;
    ELSE
        RAISE WARNING 'WARNING: Only % audit log indexes found, expected at least 6', index_count;
    END IF;
END $$;

COMMIT;

-- ==============================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ==============================================

-- Run these queries after the migration to verify everything worked:

-- 1. Verify audit_logs table structure
-- SELECT table_name, column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'audit_logs' 
-- ORDER BY ordinal_position;

-- 2. Verify all indexes were created
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE tablename IN ('audit_logs', 'tours', 'bookings', 'users', 'time_slots')
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- 3. Test a sample audit log entry (replace with actual admin user ID)
-- INSERT INTO audit_logs (admin_id, admin_email, action, resource, resource_id, resource_name, details)
-- VALUES ('your_admin_user_id', 'admin@example.com', 'test_migration', 'system', 'migration', 'Migration Test', '{"status": "completed"}');

-- ==============================================
-- MIGRATION COMPLETE
-- ==============================================

SELECT 'MIGRATION COMPLETED SUCCESSFULLY - Admin tour management system is now ready!' as status; 
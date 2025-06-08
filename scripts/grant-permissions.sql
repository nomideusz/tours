-- Grant permissions to zaur_dev user for Drizzle Studio access
-- This script should be run by a database superuser (postgres)

-- Grant USAGE on schema
GRANT USAGE ON SCHEMA public TO zaur_dev;

-- Grant SELECT permissions on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO zaur_dev;

-- Grant permissions on all sequences (for auto-incrementing fields)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO zaur_dev;

-- Grant permissions for future tables (if any are created)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO zaur_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO zaur_dev;

-- Grant specific permissions for the tables mentioned in the error
GRANT ALL PRIVILEGES ON sessions TO zaur_dev;
GRANT ALL PRIVILEGES ON time_slots TO zaur_dev;
GRANT ALL PRIVILEGES ON users TO zaur_dev;
GRANT ALL PRIVILEGES ON tours TO zaur_dev;
GRANT ALL PRIVILEGES ON bookings TO zaur_dev;
GRANT ALL PRIVILEGES ON payments TO zaur_dev;

-- Grant permissions on all other tables that might exist
GRANT ALL PRIVILEGES ON password_reset_tokens TO zaur_dev;
GRANT ALL PRIVILEGES ON email_verification_tokens TO zaur_dev;
GRANT ALL PRIVILEGES ON oauth_accounts TO zaur_dev;

-- Show current permissions (for verification)
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'; 
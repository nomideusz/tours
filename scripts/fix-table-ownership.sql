-- Transfer table ownership to zaur_dev user
-- This allows zaur_dev to modify table structure with drizzle push

-- Transfer ownership of all tables to zaur_dev
ALTER TABLE IF EXISTS users OWNER TO zaur_dev;
ALTER TABLE IF EXISTS sessions OWNER TO zaur_dev;
ALTER TABLE IF EXISTS password_reset_tokens OWNER TO zaur_dev;
ALTER TABLE IF EXISTS email_verification_tokens OWNER TO zaur_dev;
ALTER TABLE IF EXISTS oauth_accounts OWNER TO zaur_dev;
ALTER TABLE IF EXISTS tours OWNER TO zaur_dev;
ALTER TABLE IF EXISTS time_slots OWNER TO zaur_dev;
ALTER TABLE IF EXISTS bookings OWNER TO zaur_dev;
ALTER TABLE IF EXISTS payments OWNER TO zaur_dev;

-- Transfer ownership of sequences (for auto-incrementing fields)
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(seq_record.schemaname) || '.' || quote_ident(seq_record.sequencename) || ' OWNER TO zaur_dev';
    END LOOP;
END $$;

-- Grant CREATE privilege on schema for future objects
GRANT CREATE ON SCHEMA public TO zaur_dev;

-- Make zaur_dev owner of the schema itself (if possible)
-- ALTER SCHEMA public OWNER TO zaur_dev;

-- Show current table ownership
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 
-- Production-safe script to add public_listing column to tours table
-- This script is idempotent and can be run multiple times safely

-- Start transaction
BEGIN;

-- Add public_listing column if it doesn't exist
DO $$ 
BEGIN 
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'public_listing'
        AND table_schema = 'public'
    ) THEN
        -- Add the column with default value
        ALTER TABLE tours 
        ADD COLUMN public_listing BOOLEAN DEFAULT true NOT NULL;
        
        RAISE NOTICE 'Added public_listing column to tours table';
    ELSE
        RAISE NOTICE 'Column public_listing already exists, skipping';
    END IF;
END $$;

-- Add index for efficient queries if it doesn't exist
DO $$
BEGIN
    -- Check if index exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_tours_public_listing'
        AND schemaname = 'public'
    ) THEN
        -- Create partial index for performance
        CREATE INDEX idx_tours_public_listing 
        ON tours(public_listing, status) 
        WHERE public_listing = true AND status = 'active';
        
        RAISE NOTICE 'Created index idx_tours_public_listing';
    ELSE
        RAISE NOTICE 'Index idx_tours_public_listing already exists, skipping';
    END IF;
END $$;

-- Update any NULL values to true (safety measure)
UPDATE tours 
SET public_listing = true 
WHERE public_listing IS NULL;

-- Verify the changes
SELECT 
    COUNT(*) as total_tours,
    COUNT(*) FILTER (WHERE public_listing = true) as public_tours,
    COUNT(*) FILTER (WHERE public_listing = false) as private_tours
FROM tours;

COMMIT;

-- Show success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated tours table with public_listing column';
    RAISE NOTICE 'All existing tours are now set to public by default';
END $$; 
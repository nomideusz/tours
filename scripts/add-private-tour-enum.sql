-- Add 'private_tour' to the pricing_model enum
-- This allows tours to use private_tour pricing model

-- Step 1: Show current enum values
SELECT 'Current pricing_model enum values:' as info;
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pricing_model')
ORDER BY enumsortorder;

-- Step 2: Add private_tour if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'private_tour' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pricing_model')
    ) THEN
        ALTER TYPE pricing_model ADD VALUE 'private_tour';
        RAISE NOTICE '✓ Added private_tour to pricing_model enum';
    ELSE
        RAISE NOTICE '✓ private_tour already exists in pricing_model enum';
    END IF;
END
$$;

-- Step 3: Verify the enum values after changes
SELECT 'Updated pricing_model enum values:' as info;
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'pricing_model')
ORDER BY enumsortorder;

-- Note: We cannot remove 'adult_child' and 'hybrid' enum values because:
-- 1. PostgreSQL doesn't support removing enum values
-- 2. They don't cause any issues (just unused)
-- 3. Our migration scripts already converted all tours using these to 'participant_categories'


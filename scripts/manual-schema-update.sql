-- Add participant_categories enum value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'participant_categories' 
        AND enumtypid = 'pricing_model'::regtype
    ) THEN
        ALTER TYPE pricing_model ADD VALUE 'participant_categories';
    END IF;
END $$;

-- Add participant_categories column to tours if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'participant_categories'
    ) THEN
        ALTER TABLE tours ADD COLUMN participant_categories json;
    END IF;
END $$;

-- Add participants_by_category column to bookings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'participants_by_category'
    ) THEN
        ALTER TABLE bookings ADD COLUMN participants_by_category json;
    END IF;
END $$;

SELECT 'Schema updated successfully!' as result;


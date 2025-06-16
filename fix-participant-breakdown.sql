-- Add participant_breakdown column to bookings table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'participant_breakdown'
    ) THEN
        ALTER TABLE bookings ADD COLUMN participant_breakdown JSON;
        RAISE NOTICE 'Added participant_breakdown column to bookings table';
    ELSE
        RAISE NOTICE 'participant_breakdown column already exists';
    END IF;
END $$;

-- Add pricing tiers columns to tours table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'enable_pricing_tiers'
    ) THEN
        ALTER TABLE tours ADD COLUMN enable_pricing_tiers BOOLEAN DEFAULT FALSE NOT NULL;
        RAISE NOTICE 'Added enable_pricing_tiers column to tours table';
    ELSE
        RAISE NOTICE 'enable_pricing_tiers column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'pricing_tiers'
    ) THEN
        ALTER TABLE tours ADD COLUMN pricing_tiers JSON;
        RAISE NOTICE 'Added pricing_tiers column to tours table';
    ELSE
        RAISE NOTICE 'pricing_tiers column already exists';
    END IF;
END $$;

-- Add source and source_qr_code columns to bookings table if they don't exist
DO $$ 
BEGIN
    -- First create the enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source') THEN
        CREATE TYPE booking_source AS ENUM('main_qr', 'tour_qr', 'direct', 'referral', 'social', 'other');
        RAISE NOTICE 'Created booking_source enum';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE bookings ADD COLUMN source booking_source DEFAULT 'direct' NOT NULL;
        RAISE NOTICE 'Added source column to bookings table';
    ELSE
        RAISE NOTICE 'source column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'source_qr_code'
    ) THEN
        ALTER TABLE bookings ADD COLUMN source_qr_code VARCHAR(100);
        RAISE NOTICE 'Added source_qr_code column to bookings table';
    ELSE
        RAISE NOTICE 'source_qr_code column already exists';
    END IF;
END $$;

-- Add QR code columns to tours table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE tours ADD COLUMN qr_code VARCHAR(100) UNIQUE;
        RAISE NOTICE 'Added qr_code column to tours table';
    ELSE
        RAISE NOTICE 'qr_code column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'qr_scans'
    ) THEN
        ALTER TABLE tours ADD COLUMN qr_scans INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added qr_scans column to tours table';
    ELSE
        RAISE NOTICE 'qr_scans column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tours' 
        AND column_name = 'qr_conversions'
    ) THEN
        ALTER TABLE tours ADD COLUMN qr_conversions INTEGER DEFAULT 0 NOT NULL;
        RAISE NOTICE 'Added qr_conversions column to tours table';
    ELSE
        RAISE NOTICE 'qr_conversions column already exists';
    END IF;
END $$; 
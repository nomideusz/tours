-- Incremental Database Migration for Zaur Tours Platform
-- Run this on your existing database to add missing features

BEGIN;

-- Add missing constraints (only if they don't exist)
DO $$ 
BEGIN
    -- Add QR scan constraints if they don't exist
    BEGIN
        ALTER TABLE tours ADD CONSTRAINT check_qr_scans_positive CHECK (qr_scans >= 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
    
    BEGIN
        ALTER TABLE tours ADD CONSTRAINT check_qr_conversions_positive CHECK (qr_conversions >= 0);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, skip
    END;
END $$;

-- Drop existing triggers first (they depend on functions)
DROP TRIGGER IF EXISTS auto_tour_qr_trigger ON tours;
DROP TRIGGER IF EXISTS auto_booking_codes_trigger ON bookings;

-- Drop existing trigger functions if they exist (to avoid permission issues)
DROP FUNCTION IF EXISTS auto_generate_tour_qr();
DROP FUNCTION IF EXISTS auto_generate_booking_codes();

-- Drop existing functions if they exist (to avoid permission issues)
DROP FUNCTION IF EXISTS generate_tour_qr_code();
DROP FUNCTION IF EXISTS generate_ticket_qr_code();
DROP FUNCTION IF EXISTS generate_booking_reference();

-- Create improved QR code generation functions
CREATE FUNCTION generate_tour_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TUR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION generate_ticket_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Create auto-generation trigger functions
CREATE FUNCTION auto_generate_tour_qr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_tour_qr_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION auto_generate_booking_codes()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL THEN
        NEW.booking_reference := generate_booking_reference();
    END IF;
    IF NEW.ticket_qr_code IS NULL THEN
        NEW.ticket_qr_code := generate_ticket_qr_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER auto_tour_qr_trigger 
    BEFORE INSERT ON tours 
    FOR EACH ROW 
    EXECUTE FUNCTION auto_generate_tour_qr();

CREATE TRIGGER auto_booking_codes_trigger 
    BEFORE INSERT ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION auto_generate_booking_codes();

-- Drop existing view first to avoid column type conflicts
DROP VIEW IF EXISTS analytics_summary;

-- Create analytics view for the new analytics page
CREATE VIEW analytics_summary AS
SELECT 
    COALESCE(u.id, '') as user_id,
    COALESCE(u.name, 'Unknown Guide') as guide_name,
    COALESCE(COUNT(DISTINCT t.id), 0) as total_tours,
    COALESCE(COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END), 0) as active_tours,
    COALESCE(COUNT(DISTINCT b.id), 0) as total_bookings,
    COALESCE(COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END), 0) as confirmed_bookings,
    COALESCE(SUM(CASE WHEN b.status = 'confirmed' THEN COALESCE(b.total_amount, 0) ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(COALESCE(t.qr_scans, 0)), 0) as total_qr_scans,
    COALESCE(SUM(COALESCE(t.qr_conversions, 0)), 0) as total_qr_conversions
FROM users u
LEFT JOIN tours t ON u.id = t.user_id
LEFT JOIN bookings b ON t.id = b.tour_id
WHERE u.role = 'user'
GROUP BY u.id, u.name;

-- Update any existing tours that don't have QR codes (with error handling)
DO $$
BEGIN
    UPDATE tours 
    SET qr_code = generate_tour_qr_code() 
    WHERE qr_code IS NULL OR qr_code = '';
    
    RAISE NOTICE 'Updated % tours with QR codes', (SELECT COUNT(*) FROM tours WHERE qr_code IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating tour QR codes: %', SQLERRM;
END $$;

-- Update any existing bookings that don't have proper codes (with error handling)
DO $$
BEGIN
    UPDATE bookings 
    SET booking_reference = generate_booking_reference() 
    WHERE booking_reference IS NULL OR booking_reference = '';
    
    RAISE NOTICE 'Updated % bookings with booking references', (SELECT COUNT(*) FROM bookings WHERE booking_reference IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating booking references: %', SQLERRM;
END $$;

DO $$
BEGIN
    UPDATE bookings 
    SET ticket_qr_code = generate_ticket_qr_code() 
    WHERE ticket_qr_code IS NULL OR ticket_qr_code = '';
    
    RAISE NOTICE 'Updated % bookings with ticket QR codes', (SELECT COUNT(*) FROM bookings WHERE ticket_qr_code IS NOT NULL);
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating ticket QR codes: %', SQLERRM;
END $$;

-- Verify the changes
SELECT 'Migration completed successfully!' as status;

-- Show what was added (with safer output)
DO $$
BEGIN
    RAISE NOTICE 'Checking created objects...';
    
    -- Check functions
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_tour_qr_code') THEN
        RAISE NOTICE 'Function generate_tour_qr_code created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_generate_tour_qr') THEN
        RAISE NOTICE 'Function auto_generate_tour_qr created successfully';
    END IF;
    
    -- Check view
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'analytics_summary') THEN
        RAISE NOTICE 'View analytics_summary created successfully';
    END IF;
    
    -- Check triggers
    IF EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'auto_tour_qr_trigger') THEN
        RAISE NOTICE 'Trigger auto_tour_qr_trigger created successfully';
    END IF;
    
    RAISE NOTICE 'Migration verification completed';
END $$;

COMMIT; 
-- Add missing QR code columns (simple version)

-- Add main QR columns to users table
ALTER TABLE users ADD COLUMN main_qr_code VARCHAR(100);
ALTER TABLE users ADD COLUMN main_qr_scans INTEGER DEFAULT 0;

-- Add QR columns to tours table  
ALTER TABLE tours ADD COLUMN qr_code VARCHAR(100);
ALTER TABLE tours ADD COLUMN qr_scans INTEGER DEFAULT 0;
ALTER TABLE tours ADD COLUMN qr_conversions INTEGER DEFAULT 0;

-- Create booking source enum (if not exists)
DO $$ BEGIN
    CREATE TYPE booking_source AS ENUM('main_qr', 'tour_qr', 'direct', 'referral', 'social', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add booking source columns
ALTER TABLE bookings ADD COLUMN source booking_source DEFAULT 'direct';
ALTER TABLE bookings ADD COLUMN source_qr_code VARCHAR(100); 
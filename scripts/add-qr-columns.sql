-- Add missing QR code columns to existing zaur_local database

-- Add main QR columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS main_qr_code VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS main_qr_scans INTEGER NOT NULL DEFAULT 0;

-- Add QR columns to tours table  
ALTER TABLE tours ADD COLUMN IF NOT EXISTS qr_code VARCHAR(100);
ALTER TABLE tours ADD COLUMN IF NOT EXISTS qr_scans INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS qr_conversions INTEGER NOT NULL DEFAULT 0;

-- Add booking source enum and columns
CREATE TYPE IF NOT EXISTS booking_source AS ENUM('main_qr', 'tour_qr', 'direct', 'referral', 'social', 'other');
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source booking_source NOT NULL DEFAULT 'direct';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source_qr_code VARCHAR(100);

-- Show results
SELECT 'Users table columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%qr%';

SELECT 'Tours table columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'tours' AND column_name LIKE '%qr%';

SELECT 'Bookings table columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'bookings' AND column_name LIKE '%source%'; 
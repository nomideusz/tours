-- Zaur Tours Platform - Complete Schema Migration
-- This script creates the complete database schema for the current application state

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS oauth_accounts CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS booking_source CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS time_slot_status CASCADE;
DROP TYPE IF EXISTS recurring_pattern CASCADE;
DROP TYPE IF EXISTS tour_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create enums
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE tour_status AS ENUM ('active', 'draft');
CREATE TYPE recurring_pattern AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE time_slot_status AS ENUM ('available', 'full', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE attendance_status AS ENUM ('not_arrived', 'checked_in', 'no_show');
CREATE TYPE booking_source AS ENUM ('main_qr', 'tour_qr', 'direct', 'referral', 'social', 'other');

-- Create subscription enums
CREATE TYPE subscription_plan AS ENUM ('free', 'starter_pro', 'professional', 'agency');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing');

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password TEXT,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    business_name VARCHAR(255),
    stripe_account_id VARCHAR(255),
    avatar TEXT,
    role user_role NOT NULL DEFAULT 'user',
    phone VARCHAR(50),
    website VARCHAR(255),
    country TEXT,
    description TEXT,
    location VARCHAR(255),
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Main QR code for simplified approach
    main_qr_code VARCHAR(100) UNIQUE,
    main_qr_scans INTEGER NOT NULL DEFAULT 0,
    
    -- Subscription fields
    stripe_customer_id VARCHAR(255),
    subscription_plan subscription_plan NOT NULL DEFAULT 'free',
    subscription_status subscription_status,
    subscription_id VARCHAR(255),
    subscription_current_period_start TIMESTAMP WITH TIME ZONE,
    subscription_current_period_end TIMESTAMP WITH TIME ZONE,
    subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_bookings_used INTEGER NOT NULL DEFAULT 0,
    monthly_bookings_reset_at TIMESTAMP WITH TIME ZONE,
    
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sessions table for Lucia auth
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Email verification tokens table
CREATE TABLE email_verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- OAuth2 accounts table
CREATE TABLE oauth_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tours table
CREATE TABLE tours (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    images JSON DEFAULT '[]',
    status tour_status NOT NULL DEFAULT 'draft',
    category VARCHAR(100),
    location VARCHAR(255),
    included_items JSON DEFAULT '[]',
    requirements JSON DEFAULT '[]',
    cancellation_policy TEXT,
    
    -- Pricing tiers for adult/child pricing
    enable_pricing_tiers BOOLEAN NOT NULL DEFAULT FALSE,
    pricing_tiers JSON, -- { "adult": 25.00, "child": 15.00 }
    
    -- Simplified QR code approach - one QR per tour
    qr_code VARCHAR(100) UNIQUE,
    qr_scans INTEGER NOT NULL DEFAULT 0,
    qr_conversions INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Time slots table
CREATE TABLE time_slots (
    id TEXT PRIMARY KEY,
    tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    available_spots INTEGER NOT NULL,
    booked_spots INTEGER NOT NULL DEFAULT 0,
    status time_slot_status NOT NULL DEFAULT 'available',
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_pattern recurring_pattern,
    recurring_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    tour_id TEXT NOT NULL REFERENCES tours(id),
    time_slot_id TEXT NOT NULL REFERENCES time_slots(id),
    
    -- Track booking source for analytics
    source booking_source NOT NULL DEFAULT 'direct',
    source_qr_code VARCHAR(100),
    
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    participants INTEGER NOT NULL,
    participant_breakdown JSON, -- { "adults": 2, "children": 1 } for pricing tiers
    total_amount DECIMAL(10, 2) NOT NULL,
    status booking_status NOT NULL DEFAULT 'pending',
    payment_id VARCHAR(255),
    payment_status payment_status NOT NULL DEFAULT 'pending',
    booking_reference VARCHAR(100) NOT NULL UNIQUE,
    special_requests TEXT,
    
    -- Ticket QR fields
    ticket_qr_code VARCHAR(100) UNIQUE,
    attendance_status attendance_status DEFAULT 'not_arrived',
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_in_by TEXT REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    status payment_status NOT NULL DEFAULT 'pending',
    refund_amount DECIMAL(10, 2),
    processing_fee DECIMAL(10, 2) NOT NULL DEFAULT '0',
    net_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Notifications table (for hybrid SSE + polling notification system)
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'new_booking', 'booking_cancelled', 'payment_received', 'system', 'info'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON string for additional data
    actions TEXT, -- JSON string for action buttons
    read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_main_qr_code ON users(main_qr_code);
CREATE INDEX idx_users_subscription_plan ON users(subscription_plan);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_id ON users(subscription_id);
CREATE INDEX idx_users_monthly_bookings_reset_at ON users(monthly_bookings_reset_at);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Sessions indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Password reset tokens indexes
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Email verification tokens indexes
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);

-- OAuth accounts indexes
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider);
CREATE UNIQUE INDEX idx_oauth_accounts_provider_user ON oauth_accounts(provider, provider_user_id);

-- Tours indexes
CREATE INDEX idx_tours_user_id ON tours(user_id);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_category ON tours(category);
CREATE INDEX idx_tours_qr_code ON tours(qr_code);
CREATE INDEX idx_tours_enable_pricing_tiers ON tours(enable_pricing_tiers);
CREATE INDEX idx_tours_created_at ON tours(created_at);
CREATE INDEX idx_tours_updated_at ON tours(updated_at);

-- Time slots indexes
CREATE INDEX idx_time_slots_tour_id ON time_slots(tour_id);
CREATE INDEX idx_time_slots_start_time ON time_slots(start_time);
CREATE INDEX idx_time_slots_status ON time_slots(status);
CREATE INDEX idx_time_slots_is_recurring ON time_slots(is_recurring);

-- Bookings indexes
CREATE INDEX idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX idx_bookings_time_slot_id ON bookings(time_slot_id);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_source ON bookings(source);
CREATE INDEX idx_bookings_source_qr_code ON bookings(source_qr_code);
CREATE INDEX idx_bookings_booking_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_ticket_qr_code ON bookings(ticket_qr_code);
CREATE INDEX idx_bookings_attendance_status ON bookings(attendance_status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Payments indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON tours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data validation
ALTER TABLE users ADD CONSTRAINT check_monthly_bookings_used_positive CHECK (monthly_bookings_used >= 0);
ALTER TABLE tours ADD CONSTRAINT check_price_positive CHECK (price >= 0);
ALTER TABLE tours ADD CONSTRAINT check_duration_positive CHECK (duration > 0);
ALTER TABLE tours ADD CONSTRAINT check_capacity_positive CHECK (capacity > 0);
ALTER TABLE tours ADD CONSTRAINT check_qr_scans_positive CHECK (qr_scans >= 0);
ALTER TABLE tours ADD CONSTRAINT check_qr_conversions_positive CHECK (qr_conversions >= 0);
ALTER TABLE time_slots ADD CONSTRAINT check_available_spots_positive CHECK (available_spots >= 0);
ALTER TABLE time_slots ADD CONSTRAINT check_booked_spots_positive CHECK (booked_spots >= 0);
ALTER TABLE time_slots ADD CONSTRAINT check_end_after_start CHECK (end_time > start_time);
ALTER TABLE bookings ADD CONSTRAINT check_participants_positive CHECK (participants > 0);
ALTER TABLE bookings ADD CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0);
ALTER TABLE payments ADD CONSTRAINT check_amount_positive CHECK (amount >= 0);
ALTER TABLE payments ADD CONSTRAINT check_processing_fee_positive CHECK (processing_fee >= 0);
ALTER TABLE payments ADD CONSTRAINT check_net_amount_positive CHECK (net_amount >= 0);

-- Create helper functions for generating unique codes
CREATE OR REPLACE FUNCTION generate_tour_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TUR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_ticket_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Create auto-generation triggers for QR codes
CREATE OR REPLACE FUNCTION auto_generate_tour_qr()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code := generate_tour_qr_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_booking_codes()
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

-- Apply auto-generation triggers
CREATE TRIGGER auto_tour_qr_trigger BEFORE INSERT ON tours FOR EACH ROW EXECUTE FUNCTION auto_generate_tour_qr();
CREATE TRIGGER auto_booking_codes_trigger BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION auto_generate_booking_codes();

-- Create views for analytics (optional but helpful)
CREATE OR REPLACE VIEW analytics_summary AS
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

-- Verify the schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'tours', 'bookings', 'payments', 'time_slots', 'sessions', 'notifications', 'oauth_accounts', 'email_verification_tokens', 'password_reset_tokens')
ORDER BY tablename;

-- Show enum types
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'tour_status', 'booking_status', 'payment_status', 'subscription_plan', 'subscription_status')
ORDER BY t.typname, e.enumsortorder;

COMMIT; 
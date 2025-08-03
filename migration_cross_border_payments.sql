-- Migration: Add Cross-Border Payment Support
-- Run this on your production database to add cross-border payment functionality
-- This migration is safe and will not affect existing data

BEGIN;

-- =====================================================
-- STEP 1: Create new enums (if they don't exist)
-- =====================================================

-- Create payment_type enum
DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('direct', 'platform_collected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create payout_status enum  
DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 2: Add new columns to existing payments table
-- =====================================================

-- Add payment_type column (defaults to 'direct' for existing payments)
DO $$ BEGIN
    ALTER TABLE payments ADD COLUMN payment_type payment_type NOT NULL DEFAULT 'direct';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column payment_type already exists in payments table';
END $$;

-- Add tour_guide_user_id column for platform_collected payments
DO $$ BEGIN
    ALTER TABLE payments ADD COLUMN tour_guide_user_id TEXT REFERENCES users(id);
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column tour_guide_user_id already exists in payments table';
END $$;

-- Add payout_id column
DO $$ BEGIN
    ALTER TABLE payments ADD COLUMN payout_id TEXT;
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column payout_id already exists in payments table';
END $$;

-- Add payout_completed column
DO $$ BEGIN
    ALTER TABLE payments ADD COLUMN payout_completed BOOLEAN NOT NULL DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Column payout_completed already exists in payments table';
END $$;

-- =====================================================
-- STEP 3: Create new tables
-- =====================================================

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
    id TEXT PRIMARY KEY,
    tour_guide_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payout details
    total_amount DECIMAL(10, 2) NOT NULL,
    payout_currency VARCHAR(3) NOT NULL,
    exchange_rate DECIMAL(10, 6),
    payout_amount_local DECIMAL(10, 2),
    
    -- Stripe payout tracking
    stripe_payout_id VARCHAR(255) UNIQUE,
    status payout_status NOT NULL DEFAULT 'pending',
    
    -- Period covered by this payout
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Bank details used for payout
    bank_account_info JSONB,
    
    -- Processing details
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create payout_items table
CREATE TABLE IF NOT EXISTS payout_items (
    id TEXT PRIMARY KEY,
    payout_id TEXT NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
    payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 4: Create indexes for performance
-- =====================================================

-- New payment indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tour_guide_user_id ON payments(tour_guide_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payout_id ON payments(payout_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payout_completed ON payments(payout_completed);

-- Payout indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_tour_guide_user_id ON payouts(tour_guide_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_stripe_payout_id ON payouts(stripe_payout_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_period_start ON payouts(period_start);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_period_end ON payouts(period_end);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_created_at ON payouts(created_at);

-- Payout items indexes  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payout_items_payout_id ON payout_items(payout_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payout_items_payment_id ON payout_items(payment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payout_items_created_at ON payout_items(created_at);

-- =====================================================
-- STEP 5: Add constraints
-- =====================================================

-- Payout constraints
DO $$ BEGIN
    ALTER TABLE payouts ADD CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0);
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint check_total_amount_positive already exists';
END $$;

DO $$ BEGIN
    ALTER TABLE payouts ADD CONSTRAINT check_exchange_rate_positive CHECK (exchange_rate IS NULL OR exchange_rate > 0);
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint check_exchange_rate_positive already exists';
END $$;

DO $$ BEGIN
    ALTER TABLE payouts ADD CONSTRAINT check_payout_amount_local_positive CHECK (payout_amount_local IS NULL OR payout_amount_local >= 0);
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint check_payout_amount_local_positive already exists';
END $$;

DO $$ BEGIN
    ALTER TABLE payouts ADD CONSTRAINT check_period_end_after_start CHECK (period_end > period_start);
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint check_period_end_after_start already exists';
END $$;

-- Payout items constraints
DO $$ BEGIN
    ALTER TABLE payout_items ADD CONSTRAINT check_payout_item_amount_positive CHECK (amount >= 0);
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Constraint check_payout_item_amount_positive already exists';
END $$;

-- =====================================================
-- STEP 6: Add triggers for updated_at
-- =====================================================

-- Create or replace updated_at function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for payouts table
DO $$ BEGIN
    CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Trigger update_payouts_updated_at already exists';
END $$;

-- =====================================================
-- STEP 7: Verify migration
-- =====================================================

-- Show newly created tables
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('payouts', 'payout_items')
ORDER BY tablename;

-- Show new enum values
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('payment_type', 'payout_status')
ORDER BY t.typname, e.enumsortorder;

-- Show new columns in payments table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
    AND column_name IN ('payment_type', 'tour_guide_user_id', 'payout_id', 'payout_completed')
ORDER BY column_name;

-- Show summary
SELECT 
    'Migration completed successfully!' as status,
    NOW() as completed_at;

COMMIT;
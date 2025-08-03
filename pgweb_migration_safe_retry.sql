-- Safe retry migration for pgweb - handles existing objects gracefully
-- Run this after doing ROLLBACK; to clear the failed transaction

BEGIN;

-- =====================================================
-- STEP 1: Create new enums (if they don't exist)
-- =====================================================

-- Create payment_type enum (safe version)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_type') THEN
        CREATE TYPE payment_type AS ENUM ('direct', 'platform_collected');
        RAISE NOTICE 'Created payment_type enum';
    ELSE
        RAISE NOTICE 'payment_type enum already exists';
    END IF;
END $$;

-- Create payout_status enum (safe version)  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
        RAISE NOTICE 'Created payout_status enum';
    ELSE
        RAISE NOTICE 'payout_status enum already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 2: Add new columns to existing payments table
-- =====================================================

-- Add payment_type column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_type') THEN
        ALTER TABLE payments ADD COLUMN payment_type payment_type NOT NULL DEFAULT 'direct';
        RAISE NOTICE 'Added payment_type column to payments table';
    ELSE
        RAISE NOTICE 'payment_type column already exists in payments table';
    END IF;
END $$;

-- Add tour_guide_user_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'tour_guide_user_id') THEN
        ALTER TABLE payments ADD COLUMN tour_guide_user_id TEXT REFERENCES users(id);
        RAISE NOTICE 'Added tour_guide_user_id column to payments table';
    ELSE
        RAISE NOTICE 'tour_guide_user_id column already exists in payments table';
    END IF;
END $$;

-- Add payout_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payout_id') THEN
        ALTER TABLE payments ADD COLUMN payout_id TEXT;
        RAISE NOTICE 'Added payout_id column to payments table';
    ELSE
        RAISE NOTICE 'payout_id column already exists in payments table';
    END IF;
END $$;

-- Add payout_completed column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payout_completed') THEN
        ALTER TABLE payments ADD COLUMN payout_completed BOOLEAN NOT NULL DEFAULT FALSE;
        RAISE NOTICE 'Added payout_completed column to payments table';
    ELSE
        RAISE NOTICE 'payout_completed column already exists in payments table';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Create new tables
-- =====================================================

-- Create payouts table (safe version)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payouts') THEN
        CREATE TABLE payouts (
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
        RAISE NOTICE 'Created payouts table';
    ELSE
        RAISE NOTICE 'payouts table already exists';
    END IF;
END $$;

-- Create payout_items table (safe version)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payout_items') THEN
        CREATE TABLE payout_items (
            id TEXT PRIMARY KEY,
            payout_id TEXT NOT NULL REFERENCES payouts(id) ON DELETE CASCADE,
            payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
            
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE 'Created payout_items table';
    ELSE
        RAISE NOTICE 'payout_items table already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 4: Create indexes for performance (safe version)
-- =====================================================

-- Function to safely create indexes
DO $$ 
BEGIN
    -- New payment indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_payment_type') THEN
        CREATE INDEX idx_payments_payment_type ON payments(payment_type);
        RAISE NOTICE 'Created index idx_payments_payment_type';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_tour_guide_user_id') THEN
        CREATE INDEX idx_payments_tour_guide_user_id ON payments(tour_guide_user_id);
        RAISE NOTICE 'Created index idx_payments_tour_guide_user_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_payout_id') THEN
        CREATE INDEX idx_payments_payout_id ON payments(payout_id);
        RAISE NOTICE 'Created index idx_payments_payout_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_payout_completed') THEN
        CREATE INDEX idx_payments_payout_completed ON payments(payout_completed);
        RAISE NOTICE 'Created index idx_payments_payout_completed';
    END IF;
    
    -- Payout indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_tour_guide_user_id') THEN
        CREATE INDEX idx_payouts_tour_guide_user_id ON payouts(tour_guide_user_id);
        RAISE NOTICE 'Created index idx_payouts_tour_guide_user_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_status') THEN
        CREATE INDEX idx_payouts_status ON payouts(status);
        RAISE NOTICE 'Created index idx_payouts_status';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payouts_created_at') THEN
        CREATE INDEX idx_payouts_created_at ON payouts(created_at);
        RAISE NOTICE 'Created index idx_payouts_created_at';
    END IF;
    
    -- Payout items indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payout_items_payout_id') THEN
        CREATE INDEX idx_payout_items_payout_id ON payout_items(payout_id);
        RAISE NOTICE 'Created index idx_payout_items_payout_id';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payout_items_payment_id') THEN
        CREATE INDEX idx_payout_items_payment_id ON payout_items(payment_id);
        RAISE NOTICE 'Created index idx_payout_items_payment_id';
    END IF;
END $$;

-- =====================================================
-- STEP 5: Add constraints (safe version)
-- =====================================================

-- Function to safely add constraints
DO $$ 
BEGIN
    -- Check and add constraints for payouts table
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_total_amount_positive') THEN
        ALTER TABLE payouts ADD CONSTRAINT check_total_amount_positive CHECK (total_amount >= 0);
        RAISE NOTICE 'Added constraint check_total_amount_positive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_exchange_rate_positive') THEN
        ALTER TABLE payouts ADD CONSTRAINT check_exchange_rate_positive CHECK (exchange_rate IS NULL OR exchange_rate > 0);
        RAISE NOTICE 'Added constraint check_exchange_rate_positive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payout_amount_local_positive') THEN
        ALTER TABLE payouts ADD CONSTRAINT check_payout_amount_local_positive CHECK (payout_amount_local IS NULL OR payout_amount_local >= 0);
        RAISE NOTICE 'Added constraint check_payout_amount_local_positive';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_period_end_after_start') THEN
        ALTER TABLE payouts ADD CONSTRAINT check_period_end_after_start CHECK (period_end > period_start);
        RAISE NOTICE 'Added constraint check_period_end_after_start';
    END IF;
    
    -- Payout items constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_payout_item_amount_positive') THEN
        ALTER TABLE payout_items ADD CONSTRAINT check_payout_item_amount_positive CHECK (amount >= 0);
        RAISE NOTICE 'Added constraint check_payout_item_amount_positive';
    END IF;
END $$;

-- =====================================================
-- STEP 6: Add triggers for updated_at (safe version)
-- =====================================================

-- Check if function exists and create trigger only if it does
DO $$ 
BEGIN
    -- Check if the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        -- Check if trigger already exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_payouts_updated_at') THEN
            CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            RAISE NOTICE 'Created trigger update_payouts_updated_at';
        ELSE
            RAISE NOTICE 'Trigger update_payouts_updated_at already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Function update_updated_at_column does not exist - skipping trigger creation';
    END IF;
END $$;

-- =====================================================
-- STEP 7: Verify migration
-- =====================================================

-- Show final status
SELECT 
    'Migration completed successfully!' as status,
    'Cross-border payments now supported!' as message,
    NOW() as completed_at;

-- Show newly created tables
SELECT 'New tables:' as info, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('payouts', 'payout_items')
ORDER BY tablename;

-- Show new columns in payments table
SELECT 'New payment columns:' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND column_name IN ('payment_type', 'tour_guide_user_id', 'payout_id', 'payout_completed')
ORDER BY column_name;

COMMIT;
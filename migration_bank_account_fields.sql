-- Migration to add bank account fields for cross-border payments
-- Safe for production use with transaction wrapper

BEGIN;

-- Add new fields to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS bank_account_info TEXT,
  ADD COLUMN IF NOT EXISTS payment_setup BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for payment_setup to quickly find users with bank accounts
CREATE INDEX IF NOT EXISTS idx_users_payment_setup ON users(payment_setup);

-- Create index for country + payment_setup to find cross-border users with bank accounts
CREATE INDEX IF NOT EXISTS idx_users_country_payment ON users(country, payment_setup);

-- Verify changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('bank_account_info', 'payment_setup')
ORDER BY column_name;

COMMIT;

-- OAuth Tables Addition
-- Make hashedPassword nullable for OAuth users
ALTER TABLE users 
ALTER COLUMN hashed_password DROP NOT NULL;

-- Create OAuth accounts table
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider_user 
ON oauth_accounts(provider, provider_user_id);

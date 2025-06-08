-- Add username field to users table
-- This is a simple migration to add the username field

-- Add the username column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE users ADD COLUMN username VARCHAR(50);
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE(username);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        
        RAISE NOTICE 'Username field added successfully';
    ELSE
        RAISE NOTICE 'Username field already exists';
    END IF;
END $$; 
-- Add country field to users table if it doesn't exist
DO $$ 
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'country'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE "users" ADD COLUMN "country" text;
  END IF;
END $$; 
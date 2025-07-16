-- Add public_listing column to tours table
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS public_listing BOOLEAN DEFAULT true NOT NULL;

-- Add index for efficient public listing queries
CREATE INDEX IF NOT EXISTS idx_tours_public_listing 
ON tours(public_listing, status) 
WHERE public_listing = true AND status = 'active'; 
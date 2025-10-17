-- Add group discounts to tours table
ALTER TABLE tours
ADD COLUMN IF NOT EXISTS group_discounts JSONB DEFAULT '{"tiers": [], "enabled": false}'::jsonb;

-- Update the column comment
COMMENT ON COLUMN tours.group_discounts IS 'Group discount tiers for participant categories pricing model';

-- Example of group discounts structure:
-- {
--   "enabled": true,
--   "tiers": [
--     {
--       "id": "tier_1234567890_abcdef",
--       "minParticipants": 5,
--       "maxParticipants": 10,
--       "discountType": "percentage",
--       "discountValue": 10,
--       "label": "Small Group"
--     },
--     {
--       "id": "tier_1234567891_ghijkl",
--       "minParticipants": 11,
--       "maxParticipants": 20,
--       "discountType": "percentage",
--       "discountValue": 20,
--       "label": "Large Group"
--     }
--   ]
-- }

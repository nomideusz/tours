-- Migration: Add location_place_id to tours table
-- Purpose: Store Google Places API Place IDs for meeting point photos
-- Date: 2025-11-02

ALTER TABLE "tours" ADD COLUMN IF NOT EXISTS "location_place_id" varchar(255);

-- Add comment for documentation
COMMENT ON COLUMN "tours"."location_place_id" IS 'Google Places API Place ID for meeting point - enables photo display and enhanced location features';


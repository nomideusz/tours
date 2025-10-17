DO $$ BEGIN
 CREATE TYPE "public"."pricing_model" AS ENUM('per_person', 'adult_child', 'group_tiers', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "selected_addons" json;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "price_breakdown" json;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "pricing_model" "pricing_model" DEFAULT 'per_person';--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "group_pricing_tiers" json;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "optional_addons" json;--> statement-breakpoint

-- Data migration: Set pricing model for existing tours
UPDATE tours
SET pricing_model = CASE
  WHEN enable_pricing_tiers = true THEN 'adult_child'::pricing_model
  ELSE 'per_person'::pricing_model
END
WHERE pricing_model IS NULL;
--> statement-breakpoint

-- Data migration: Add price breakdown to existing bookings
UPDATE bookings
SET price_breakdown = json_build_object(
  'basePrice', total_amount::numeric,
  'addonsTotal', 0,
  'totalAmount', total_amount::numeric
)
WHERE price_breakdown IS NULL;
--> statement-breakpoint

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_tours_pricing_model" ON "tours" ("pricing_model");
--> statement-breakpoint

-- Add column comments for documentation
COMMENT ON COLUMN tours.pricing_model IS 'Pricing model: per_person (default), adult_child (existing), group_tiers (new), or hybrid (new with add-ons)';
COMMENT ON COLUMN tours.group_pricing_tiers IS 'Group-based pricing tiers JSON: { tiers: [{ minParticipants, maxParticipants, price, label }] }';
COMMENT ON COLUMN tours.optional_addons IS 'Optional add-ons JSON: { addons: [{ id, name, description, price, required, icon }] }';
COMMENT ON COLUMN bookings.selected_addons IS 'Add-ons selected for this booking: [{ addonId, name, price }]';
COMMENT ON COLUMN bookings.price_breakdown IS 'Price breakdown: { basePrice, addonsTotal, totalAmount }';
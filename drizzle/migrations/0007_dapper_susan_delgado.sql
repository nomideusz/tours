ALTER TABLE "bookings" ADD COLUMN "participant_breakdown" json;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "enable_pricing_tiers" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "pricing_tiers" json;
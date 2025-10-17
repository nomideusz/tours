ALTER TYPE "pricing_model" ADD VALUE 'participant_categories';--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "participants_by_category" json;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "participant_categories" json;
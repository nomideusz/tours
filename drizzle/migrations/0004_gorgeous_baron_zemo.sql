ALTER TABLE "users" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "currency" varchar(3) DEFAULT 'EUR' NOT NULL;
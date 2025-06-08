DO $$ BEGIN
 CREATE TYPE "public"."booking_source" AS ENUM('main_qr', 'tour_qr', 'direct', 'referral', 'social', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
DROP TABLE "qr_codes";--> statement-breakpoint
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_qr_code_id_qr_codes_id_fk";
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source" "booking_source" DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "source_qr_code" varchar(100);--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "qr_code" varchar(100);--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "qr_scans" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "qr_conversions" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "main_qr_code" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "main_qr_scans" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN IF EXISTS "qr_code_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "intended_role";--> statement-breakpoint
ALTER TABLE "tours" ADD CONSTRAINT "tours_qr_code_unique" UNIQUE("qr_code");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_main_qr_code_unique" UNIQUE("main_qr_code");
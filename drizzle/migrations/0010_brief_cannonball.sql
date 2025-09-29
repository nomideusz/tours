DO $$ BEGIN
 CREATE TYPE "public"."beta_application_status" AS ENUM('pending', 'accepted', 'rejected', 'waitlisted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_type" AS ENUM('direct', 'platform_collected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payout_status" AS ENUM('pending', 'processing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "beta_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(255),
	"business_name" varchar(255),
	"location" varchar(255) NOT NULL,
	"country" varchar(2) NOT NULL,
	"tour_types" text NOT NULL,
	"tour_frequency" text NOT NULL,
	"current_booking_method" text NOT NULL,
	"biggest_challenge" text NOT NULL,
	"beta_contribution" text NOT NULL,
	"years_experience" integer NOT NULL,
	"team_size" integer DEFAULT 1 NOT NULL,
	"interested_features" text[] DEFAULT '{}',
	"availability_for_feedback" boolean DEFAULT true NOT NULL,
	"status" "beta_application_status" DEFAULT 'pending' NOT NULL,
	"reviewer_notes" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"referral_source" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "beta_applications_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_items" (
	"id" text PRIMARY KEY NOT NULL,
	"payout_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" text PRIMARY KEY NOT NULL,
	"tour_guide_user_id" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payout_currency" varchar(3) NOT NULL,
	"exchange_rate" numeric(10, 6),
	"payout_amount_local" numeric(10, 2),
	"stripe_payout_id" varchar(255),
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"bank_account_info" json,
	"processing_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_stripe_payout_id_unique" UNIQUE("stripe_payout_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_type" "payment_type" DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "tour_guide_user_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payout_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payout_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tours" ADD COLUMN "categories" json DEFAULT '[]'::json;--> statement-breakpoint
-- Migrate existing category data to categories array
UPDATE tours 
SET categories = 
    CASE 
        WHEN category IS NOT NULL AND category != '' THEN 
            JSON_ARRAY(category)
        ELSE 
            JSON_ARRAY()
    END;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bank_account_info" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_setup" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_items" ADD CONSTRAINT "payout_items_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_tour_guide_user_id_users_id_fk" FOREIGN KEY ("tour_guide_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_tour_guide_user_id_users_id_fk" FOREIGN KEY ("tour_guide_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "tours" DROP COLUMN IF EXISTS "category";
-- Add deletedAt field to users table for soft deletion
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;

-- Create index for filtering active users
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users" ("deleted_at"); 
-- Migration: Add admin panel tables (activity_log + invitations)
-- Date: 2026-04-24
-- Purpose: Backfill schema drift from PR #6 "Main" — admin queries reference these tables
--          but the schema.ts definitions were missing.
--
-- Run against prod DB BEFORE or immediately after deploying PR #6 to avoid runtime
-- errors when admin routes query activity_log or invitations.
--
-- How to run:
--   psql $DATABASE_URL -f migrations/2026-04-24-add-admin-tables.sql
--   OR paste into Neon/Vercel Postgres SQL editor
--
-- Safe: purely additive (CREATE TABLE IF NOT EXISTS + CREATE INDEX IF NOT EXISTS).
-- Idempotent: can be run multiple times.

CREATE TABLE IF NOT EXISTS "activity_log" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid,
    "action" varchar(64) NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar(255),
    "code" varchar(64) NOT NULL,
    "type" varchar(16) NOT NULL,
    "status" varchar(16) DEFAULT 'pending' NOT NULL,
    "invited_by" uuid,
    "accepted_by" uuid,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "invitations_code_unique" UNIQUE("code")
);

-- Foreign keys (added separately so CREATE TABLE IF NOT EXISTS stays clean)
DO $$ BEGIN
    ALTER TABLE "activity_log"
        ADD CONSTRAINT "activity_log_user_id_users_id_fk"
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "invitations"
        ADD CONSTRAINT "invitations_invited_by_users_id_fk"
        FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "invitations"
        ADD CONSTRAINT "invitations_accepted_by_users_id_fk"
        FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id")
        ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "activity_log_action_idx" ON "activity_log" USING btree ("action");
CREATE INDEX IF NOT EXISTS "activity_log_created_at_idx" ON "activity_log" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "activity_log_user_id_idx" ON "activity_log" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "invitations_code_idx" ON "invitations" USING btree ("code");
CREATE INDEX IF NOT EXISTS "invitations_status_idx" ON "invitations" USING btree ("status");
CREATE INDEX IF NOT EXISTS "invitations_email_idx" ON "invitations" USING btree ("email");

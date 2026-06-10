-- Migration: Drop widgetConfigs table and widgets.licenseId; enforce NOT NULL on userId/widgetKey
--
-- PRECONDITION: run scripts/migrate-v2-backfill.ts first (pnpm db:backfill-v2).
-- The pre-flight guard below aborts the whole migration BEFORE any destructive
-- DDL if the backfill was skipped (widgets with NULL user_id/widget_key exist).
--
-- Schema v2.0 changes applied here:
--   0. PRE-FLIGHT: abort if backfill incomplete (NULL user_id/widget_key)
--   1. DROP TABLE widget_configs (superseded by widgets.config JSONB column)
--   2. widgets.user_id  → SET NOT NULL
--   3. widgets.widget_key → SET NOT NULL
--   4. widgets.license_id → DROP COLUMN + DROP INDEX
--   5. analytics_events.license_id → DROP COLUMN (data loss acceptable; analytics only)
--   6. analytics_events.user_id → ADD COLUMN (nullable FK to users)
--   7. analytics_events.widget_id → ADD COLUMN (nullable FK to widgets)

--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM widgets WHERE user_id IS NULL OR widget_key IS NULL) THEN
    RAISE EXCEPTION 'Backfill not complete: widgets with NULL user_id/widget_key exist. Run: pnpm db:backfill-v2';
  END IF;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "widget_configs";
--> statement-breakpoint
ALTER TABLE "widgets" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "widgets" ALTER COLUMN "widget_key" SET NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "widgets_license_id_idx";
--> statement-breakpoint
ALTER TABLE "widgets" DROP CONSTRAINT IF EXISTS "widgets_license_id_licenses_id_fk";
--> statement-breakpoint
ALTER TABLE "widgets" DROP COLUMN IF EXISTS "license_id";
--> statement-breakpoint
ALTER TABLE "analytics_events" DROP CONSTRAINT IF EXISTS "analytics_events_license_id_licenses_id_fk";
--> statement-breakpoint
ALTER TABLE "analytics_events" DROP COLUMN IF EXISTS "license_id";
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "widget_id" uuid;
--> statement-breakpoint
-- ADD CONSTRAINT IF NOT EXISTS is unavailable on PG<17 / Neon; guard manually.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_user_id_users_id_fk') THEN
    ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'analytics_events_widget_id_widgets_id_fk') THEN
    ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_widget_id_widgets_id_fk" FOREIGN KEY ("widget_id") REFERENCES "public"."widgets"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

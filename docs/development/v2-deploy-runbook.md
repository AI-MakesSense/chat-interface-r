# v2 Schema Migration — Deployment Runbook

Applies to: `drizzle/0001_drop_widget_configs_and_license_id.sql` (irreversible — drops `widget_configs`, `widgets.license_id`, `analytics_events.license_id`).

## Pre-deploy

1. **Snapshot:** create a Neon branch of production (`neonctl branches create --name pre-v2-migration`). This migration has NO down migration — the branch is the only rollback path.
2. **Record analytics baseline** (historical rows lose attribution — `license_id` is dropped and the new `user_id` column is NULL for old rows):
   ```sql
   SELECT count(*) AS pre_migration_analytics_rows FROM analytics_events;
   SELECT count(*) AS rows_with_license FROM analytics_events WHERE license_id IS NOT NULL;
   ```
   Save both numbers in the deploy notes. If any dashboard/metric feeds on these rows, expect attribution gaps for the historical window.
3. **Run backfill:** `pnpm db:backfill-v2 -- --dry-run`, review the printed counts, then `pnpm db:backfill-v2`.
   Exit codes (the script's contract): `0` complete and verified; `2` dangling widgets need manual review (see below); `1` failure — stop and investigate.

   (`pnpm db:deploy-v2` chains backfill + migrate in one step; prefer the separate
   steps above for production so you can review backfill output before any DDL runs.)

## Dangling widgets (exit code 2)

Widgets whose `license_id` points at a deleted license cannot be backfilled automatically. Preview (same condition the script uses):

```sql
SELECT w.id, w.name, w.license_id, w.created_at
FROM widgets w
LEFT JOIN licenses l ON l.id = w.license_id
WHERE w.user_id IS NULL AND w.license_id IS NOT NULL AND l.id IS NULL;
```

Per widget, either assign an owner (`UPDATE widgets SET user_id = '<uuid>' WHERE id = '<id>';`)
or delete it (`DELETE FROM widgets WHERE id = '<id>';`). Re-run the backfill until exit 0.

Note: a widget with NULL `user_id` AND NULL `license_id` is not "dangling" (there was
never a license to backfill from) — the script exits `1` for those. Fix them the same
way: assign an owner or delete, then re-run.

## Deploy

4. Run `pnpm db:migrate` during a low-traffic window. The migration sets `lock_timeout = '3s'` before its first DDL statement; the drizzle migrator (neon-serverless driver, single connection) runs the whole file inside one transaction, so the setting covers every statement. If it fails with a lock timeout (`canceling statement due to lock timeout`), the entire transaction rolls back — nothing is partially applied — and the migration is NOT recorded as run. Simply re-run `pnpm db:migrate`; the pre-flight guard re-checks the backfill and every DDL statement is guarded (`IF EXISTS` / `IF NOT EXISTS` / `pg_constraint` checks) or safely re-appliable (`SET NOT NULL` on an already-NOT-NULL column is a no-op).

## Post-deploy verification

```sql
-- Must return 0:
SELECT count(*) FROM widgets WHERE user_id IS NULL OR widget_key IS NULL;
-- Must return NULL (table gone):
SELECT to_regclass('public.widget_configs');
-- Both must return zero rows (columns gone):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'widgets' AND column_name = 'license_id';
SELECT column_name FROM information_schema.columns
WHERE table_name = 'analytics_events' AND column_name = 'license_id';
```

5. Smoke-test: load an embedded widget on a customer domain, send one chat message through the relay, open the dashboard widget list.

## Rollback

There is no down migration. Restore = promote the `pre-v2-migration` Neon branch and redeploy the previous app release. Any writes after the migration are lost — decide within the incident window.

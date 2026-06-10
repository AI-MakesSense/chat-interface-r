/**
 * One-time v1→v2 backfill. Idempotent — safe to re-run.
 *
 * Run with:
 *   pnpm db:backfill-v2                 # live run
 *   pnpm db:backfill-v2 -- --dry-run    # preview only, no writes
 *
 * MUST run BEFORE the Task-8 migration that adds NOT NULL constraints.
 *
 * 1. widgets.userId    ← licenses.userId  (single JOIN UPDATE, where userId IS NULL)
 * 2. widgets.widgetKey ← generated unique 16-char key (per-row, where widgetKey IS NULL)
 * 3. widgets.allowedDomains ← licenses.domains (single JOIN UPDATE, where
 *    allowedDomains NULL/empty and license has domains)
 *
 * Prints a per-step count summary; exits non-zero if any widget still lacks
 * userId or widgetKey after a live run (covers orphaned widgets with no license).
 *
 * Exit codes (scriptable contract for deploy automation):
 *   0 — backfill complete and verified (or dry run finished)
 *   2 — backfill ran, but dangling widgets (license row missing) need manual
 *       review; every unresolved widget is accounted for by the dangling set
 *   1 — unexpected failure, or unresolved widgets NOT explained by dangling
 *       license links (mixed/unknown failure)
 *
 * Atomicity: runs without a transaction (neon-http limitation). Crash mid-run
 * is safe — each step filters on the null columns it populates; re-run resumes
 * where it left off. No rollback needed or possible.
 */

// IMPORTANT: Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

// Now import db client (which needs env vars to be set)
import { db } from '../lib/db/client';
import { widgets } from '../lib/db/schema';
import { eq, isNull, sql } from 'drizzle-orm';
import { generateWidgetKey } from '../lib/license/widget-key';
import { withUniqueRetry } from '../lib/db/unique-retry';

const isDryRun = process.argv.includes('--dry-run');

interface DanglingWidget {
  id: string;
  licenseId: string | null;
}

/** Extract a scalar count from a raw `SELECT count(*)::int AS count` result. */
function readCount(result: unknown): number {
  const rows = (result as { rows?: Array<{ count?: number | string }> }).rows ?? [];
  return Number(rows[0]?.count ?? 0);
}

/** Extract affected-row count from a raw UPDATE result (neon-http). */
function readRowCount(result: unknown): number {
  return Number((result as { rowCount?: number }).rowCount ?? 0);
}

/**
 * Widgets whose licenseId points to a license row that no longer exists.
 * These cannot be resolved by this script.
 */
async function findDanglingWidgets(): Promise<DanglingWidget[]> {
  const r = await db.execute(sql`
    SELECT w.id, w.license_id
    FROM widgets w
    LEFT JOIN licenses l ON w.license_id = l.id
    WHERE w.user_id IS NULL AND w.license_id IS NOT NULL AND l.id IS NULL
  `);
  const rows = (r as { rows?: Array<{ id: string; license_id: string | null }> }).rows ?? [];
  return rows.map((row) => ({ id: row.id, licenseId: row.license_id }));
}

async function main() {
  console.log('=== v1→v2 Backfill ===');
  if (isDryRun) {
    console.log('DRY RUN — no changes will be written');
  }
  console.log('');

  // ------------------------------------------------------------------
  // Step 1: Backfill userId from the linked license record (JOIN UPDATE)
  // ------------------------------------------------------------------
  let userIdBackfilled: number;

  if (isDryRun) {
    const r = await db.execute(sql`
      SELECT count(*)::int AS count
      FROM widgets w
      JOIN licenses l ON w.license_id = l.id
      WHERE w.user_id IS NULL
    `);
    userIdBackfilled = readCount(r);
    console.log(`DRY: would set userId from license on ${userIdBackfilled} widget(s)`);
  } else {
    const r = await db.execute(sql`
      UPDATE widgets w
      SET user_id = l.user_id, updated_at = NOW()
      FROM licenses l
      WHERE w.license_id = l.id AND w.user_id IS NULL
    `);
    userIdBackfilled = readRowCount(r);
  }

  console.log(`Step 1 — userId backfill: ${userIdBackfilled} ${isDryRun ? 'would be ' : ''}updated`);

  // Dangling detection (post-UPDATE in live mode; same query works in dry-run
  // since dangling widgets are exactly those with no matching license row).
  const dangling = await findDanglingWidgets();

  // ------------------------------------------------------------------
  // Step 2: Assign widgetKey to every widget that lacks one.
  // Stays per-row: each row needs its own unique key, so this cannot be a
  // single UPDATE. Retries on the unique constraint via withUniqueRetry.
  // ------------------------------------------------------------------
  const keyless = await db
    .select({ id: widgets.id })
    .from(widgets)
    .where(isNull(widgets.widgetKey));

  let keyBackfilled = 0;

  if (isDryRun) {
    for (const w of keyless) {
      console.log(`DRY: would generate widgetKey for widget ${w.id}`);
    }
    keyBackfilled = keyless.length;
  } else {
    for (const w of keyless) {
      await withUniqueRetry(() =>
        db
          .update(widgets)
          .set({ widgetKey: generateWidgetKey(), updatedAt: new Date() })
          .where(eq(widgets.id, w.id))
      );
      keyBackfilled++;
      if (keyBackfilled % 100 === 0) {
        console.log(`  ...widgetKey progress: ${keyBackfilled}/${keyless.length}`);
      }
    }
  }

  console.log(`Step 2 — widgetKey backfill: ${keyBackfilled} ${isDryRun ? 'would be ' : ''}generated`);

  // ------------------------------------------------------------------
  // Step 3: Copy license.domains → allowedDomains where empty/null (JOIN UPDATE)
  // ------------------------------------------------------------------
  let domainCount: number;

  if (isDryRun) {
    const r = await db.execute(sql`
      SELECT count(*)::int AS count
      FROM widgets w
      JOIN licenses l ON w.license_id = l.id
      WHERE l.domains != '{}'
        AND (w.allowed_domains IS NULL OR w.allowed_domains = '{}')
    `);
    domainCount = readCount(r);
    console.log(`DRY: would copy license domains to allowedDomains on ${domainCount} widget(s)`);
  } else {
    const r = await db.execute(sql`
      UPDATE widgets w
      SET allowed_domains = l.domains, updated_at = NOW()
      FROM licenses l
      WHERE w.license_id = l.id
        AND l.domains != '{}'
        AND (w.allowed_domains IS NULL OR w.allowed_domains = '{}')
    `);
    domainCount = readRowCount(r);
  }

  console.log(`Step 3 — allowedDomains backfill: ${domainCount} ${isDryRun ? 'would be ' : ''}updated`);
  console.log('');

  // ------------------------------------------------------------------
  // Dangling-widget report (unresolvable by this script)
  // ------------------------------------------------------------------
  if (dangling.length > 0) {
    console.error('--- Dangling widgets (license row missing) ---');
    console.error(`Count: ${dangling.length}`);
    console.error(`IDs: ${dangling.map((d) => d.id).join(', ')}`);
    for (const d of dangling) {
      console.error(`  widget ${d.id} → missing license ${d.licenseId}`);
    }
    console.error(
      'Action required: review these widgets — delete or manually assign userId. ' +
      'They are unresolvable by this script.'
    );
    console.error('');
  }

  // ------------------------------------------------------------------
  // Verification: no widget should be missing userId or widgetKey
  // ------------------------------------------------------------------
  const noUser = await db
    .select({ id: widgets.id })
    .from(widgets)
    .where(isNull(widgets.userId));

  const noKey = await db
    .select({ id: widgets.id })
    .from(widgets)
    .where(isNull(widgets.widgetKey));

  if (isDryRun) {
    console.log(
      `Verification (reflects CURRENT state — no writes were made): ` +
      `${noUser.length} widget(s) missing userId, ${noKey.length} missing widgetKey`
    );
    console.log('Dry run complete. Re-run without --dry-run to apply.');
    return;
  }

  if (noUser.length > 0 || noKey.length > 0) {
    console.error(
      `INCOMPLETE: ${noUser.length} widget(s) still missing userId, ` +
      `${noKey.length} widget(s) still missing widgetKey`
    );
    if (noUser.length > 0) {
      console.error('  Widgets missing userId:', noUser.map((r) => r.id).join(', '));
      console.error(
        '  These widgets have no license link or a dangling one — review them: ' +
        'delete or manually assign userId. They are unresolvable by this script.'
      );
    }
    if (noKey.length > 0) {
      console.error('  Widgets missing widgetKey:', noKey.map((r) => r.id).join(', '));
    }
    const noUserIds = new Set(noUser.map((w) => w.id));
    if (
      dangling.length > 0 &&
      dangling.every((d) => noUserIds.has(d.id)) &&
      noUser.length === dangling.length &&
      noKey.length === 0
    ) {
      // Everything unresolved is accounted for by dangling widgets — this is
      // the "manual review required" outcome, not a script failure.
      // Exit codes: 0 = complete, 2 = dangling widgets need manual action,
      // 1 = unexpected failure. Lets deploy scripts branch on the outcome.
      process.exit(2);
    }
    process.exit(1);
  }

  console.log('Backfill complete and verified. All widgets have userId and widgetKey.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  });

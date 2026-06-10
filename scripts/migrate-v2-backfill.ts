/**
 * One-time v1→v2 backfill. Idempotent — safe to re-run.
 * Run with: pnpm db:backfill-v2
 * MUST run BEFORE the Task-8 migration that adds NOT NULL constraints.
 *
 * 1. widgets.userId    ← licenses.userId  (where userId IS NULL and licenseId IS NOT NULL)
 * 2. widgets.widgetKey ← generated unique 16-char key (where widgetKey IS NULL)
 * 3. widgets.allowedDomains ← licenses.domains (where allowedDomains NULL/empty and license has domains)
 *
 * Prints a per-step count summary; exits non-zero if any widget still lacks
 * userId or widgetKey after the run (covers orphaned widgets with no license).
 */

// IMPORTANT: Load environment variables FIRST, before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

// Now import db client (which needs env vars to be set)
import { db } from '../lib/db/client';
import { widgets, licenses } from '../lib/db/schema';
import { eq, isNull, isNotNull, and } from 'drizzle-orm';
import { generateWidgetKey } from '../lib/license/widget-key';

async function main() {
  console.log('=== v1→v2 Backfill ===');
  console.log('');

  // ------------------------------------------------------------------
  // Step 1: Backfill userId from the linked license record
  // ------------------------------------------------------------------
  const orphans = await db
    .select({ id: widgets.id, licenseId: widgets.licenseId })
    .from(widgets)
    .where(and(isNull(widgets.userId), isNotNull(widgets.licenseId)));

  let userIdBackfilled = 0;
  let danglingLicense = 0;

  for (const w of orphans) {
    const [lic] = await db
      .select()
      .from(licenses)
      .where(eq(licenses.id, w.licenseId!));

    if (!lic) {
      console.error(
        `Widget ${w.id} has dangling licenseId ${w.licenseId} (no matching license row) — skipped`
      );
      danglingLicense++;
      continue;
    }

    await db
      .update(widgets)
      .set({ userId: lic.userId, updatedAt: new Date() })
      .where(eq(widgets.id, w.id));

    userIdBackfilled++;
  }

  console.log(`Step 1 — userId backfill: ${userIdBackfilled} updated (${danglingLicense} dangling, skipped)`);

  // ------------------------------------------------------------------
  // Step 2: Assign widgetKey to every widget that lacks one
  // ------------------------------------------------------------------
  const keyless = await db
    .select({ id: widgets.id })
    .from(widgets)
    .where(isNull(widgets.widgetKey));

  let keyBackfilled = 0;

  for (const w of keyless) {
    // Retry loop guards against the (extremely unlikely) unique-constraint collision
    for (let attempt = 0; ; attempt++) {
      try {
        await db
          .update(widgets)
          .set({ widgetKey: generateWidgetKey(), updatedAt: new Date() })
          .where(eq(widgets.id, w.id));
        keyBackfilled++;
        break;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        const isUnique =
          msg.includes('unique') ||
          msg.includes('duplicate') ||
          msg.includes('23505'); // Postgres unique violation code
        if (attempt >= 3 || !isUnique) throw e;
        // collision — try again with a new key
      }
    }
  }

  console.log(`Step 2 — widgetKey backfill: ${keyBackfilled} generated`);

  // ------------------------------------------------------------------
  // Step 3: Copy license.domains → allowedDomains where empty/null
  // ------------------------------------------------------------------
  const withLicense = await db
    .select()
    .from(widgets)
    .where(isNotNull(widgets.licenseId));

  let domainCount = 0;

  for (const w of withLicense) {
    if (Array.isArray(w.allowedDomains) && w.allowedDomains.length > 0) continue;

    const [lic] = await db
      .select()
      .from(licenses)
      .where(eq(licenses.id, w.licenseId!));

    if (lic && lic.domains.length > 0) {
      await db
        .update(widgets)
        .set({ allowedDomains: lic.domains, updatedAt: new Date() })
        .where(eq(widgets.id, w.id));
      domainCount++;
    }
  }

  console.log(`Step 3 — allowedDomains backfill: ${domainCount} updated`);
  console.log('');

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

  if (noUser.length > 0 || noKey.length > 0) {
    console.error(
      `INCOMPLETE: ${noUser.length} widget(s) still missing userId, ` +
      `${noKey.length} widget(s) still missing widgetKey`
    );
    if (noUser.length > 0) {
      console.error('  Widgets missing userId:', noUser.map((r) => r.id).join(', '));
    }
    if (noKey.length > 0) {
      console.error('  Widgets missing widgetKey:', noKey.map((r) => r.id).join(', '));
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

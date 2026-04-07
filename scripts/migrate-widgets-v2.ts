/**
 * Widget Migration Script (Schema v2.0)
 *
 * Purpose: Migrate existing widgets to Schema v2.0 format
 * - Generates widgetKey for widgets that don't have one
 * - Sets userId directly on widgets (from license.userId)
 * - Sets default embedType to 'popup'
 * - Copies license domains to allowedDomains
 *
 * Usage:
 *   npx tsx scripts/migrate-widgets-v2.ts
 *   # or
 *   pnpm tsx scripts/migrate-widgets-v2.ts
 *
 * Options:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show detailed output
 */

import { db } from '../lib/db/client';
import { widgets, licenses, users } from '../lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

/**
 * Generate a 16-character alphanumeric widget key
 */
function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(16);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 16; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
}

async function migrateWidgets(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log('🔄 Starting Widget Migration to Schema v2.0');
  console.log(`   Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  try {
    // Find all widgets that need migration (no widgetKey or no userId)
    const widgetsToMigrate = await db
      .select({
        widget: widgets,
        license: licenses,
      })
      .from(widgets)
      .leftJoin(licenses, eq(widgets.licenseId, licenses.id))
      .where(
        // Widgets without widgetKey need migration
        isNull(widgets.widgetKey)
      );

    stats.total = widgetsToMigrate.length;
    console.log(`📊 Found ${stats.total} widgets to migrate`);
    console.log('');

    for (const { widget, license } of widgetsToMigrate) {
      try {
        // Skip if no license (orphaned widget)
        if (!license) {
          console.log(`⚠️  Widget ${widget.id}: No license found, skipping`);
          stats.skipped++;
          continue;
        }

        // Generate new widgetKey
        const newWidgetKey = generateWidgetKey();

        // Get userId from license
        const userId = license.userId;

        // Get domains from license
        const allowedDomains = license.domains || [];

        // Prepare update data
        const updateData = {
          widgetKey: newWidgetKey,
          userId: userId,
          embedType: 'popup', // Default embed type
          allowedDomains: allowedDomains.length > 0 ? allowedDomains : null,
          updatedAt: new Date(),
        };

        if (isVerbose) {
          console.log(`📝 Widget ${widget.id}:`);
          console.log(`   Name: ${widget.name}`);
          console.log(`   License: ${license.licenseKey}`);
          console.log(`   New widgetKey: ${newWidgetKey}`);
          console.log(`   UserId: ${userId}`);
          console.log(`   Domains: ${allowedDomains.join(', ') || 'none'}`);
        }

        if (!isDryRun) {
          // Apply the migration
          await db
            .update(widgets)
            .set(updateData)
            .where(eq(widgets.id, widget.id));

          console.log(`✅ Migrated widget: ${widget.name} (${widget.id})`);
        } else {
          console.log(`🔍 Would migrate widget: ${widget.name} (${widget.id})`);
        }

        stats.migrated++;

      } catch (error) {
        console.error(`❌ Error migrating widget ${widget.id}:`, error);
        stats.errors++;
      }
    }

    // Also check for widgets with userId but no widgetKey
    const widgetsWithUserButNoKey = await db
      .select()
      .from(widgets)
      .where(
        and(
          isNull(widgets.widgetKey),
          // userId is not null - need to use a different approach
        )
      );

    console.log('');
    console.log('📊 Migration Summary:');
    console.log(`   Total widgets found: ${stats.total}`);
    console.log(`   Successfully migrated: ${stats.migrated}`);
    console.log(`   Skipped: ${stats.skipped}`);
    console.log(`   Errors: ${stats.errors}`);

    if (isDryRun) {
      console.log('');
      console.log('ℹ️  This was a dry run. No changes were made.');
      console.log('   Run without --dry-run to apply migrations.');
    }

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateUserTiers(): Promise<void> {
  console.log('');
  console.log('🔄 Migrating User Tiers from Licenses');
  console.log('');

  try {
    // Get all users with their highest tier license
    const usersWithLicenses = await db
      .select({
        user: users,
        license: licenses,
      })
      .from(users)
      .leftJoin(licenses, eq(users.id, licenses.userId));

    // Group licenses by user and find highest tier
    const userTiers = new Map<string, string>();
    const tierRank = { free: 0, basic: 1, pro: 2, agency: 3 };

    for (const { user, license } of usersWithLicenses) {
      const currentTier = userTiers.get(user.id) || 'free';
      const licenseTier = license?.tier || 'free';

      // Use highest tier
      if ((tierRank[licenseTier as keyof typeof tierRank] || 0) > (tierRank[currentTier as keyof typeof tierRank] || 0)) {
        userTiers.set(user.id, licenseTier);
      }
    }

    let migratedCount = 0;
    for (const [userId, tier] of userTiers) {
      const currentUser = (await db.select().from(users).where(eq(users.id, userId)))[0];

      // Skip if user already has a tier set (not default)
      if ((currentUser as any).tier && (currentUser as any).tier !== 'free') {
        if (isVerbose) {
          console.log(`⏭️  User ${userId} already has tier: ${(currentUser as any).tier}`);
        }
        continue;
      }

      if (tier !== 'free') {
        if (!isDryRun) {
          await db
            .update(users)
            .set({
              tier: tier,
              subscriptionStatus: 'active',
              updatedAt: new Date(),
            } as any)
            .where(eq(users.id, userId));

          console.log(`✅ Set user ${userId} tier to: ${tier}`);
        } else {
          console.log(`🔍 Would set user ${userId} tier to: ${tier}`);
        }
        migratedCount++;
      }
    }

    console.log(`📊 User tier migration: ${migratedCount} users updated`);

  } catch (error) {
    console.error('❌ User tier migration failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   Schema v2.0 Migration Script');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  try {
    // Migrate widgets
    await migrateWidgets();

    // Migrate user tiers
    await migrateUserTiers();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   Migration Complete!');
    console.log('═══════════════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();

/**
 * Clean Test Data Script
 *
 * Removes all test users and their associated data (cascades to licenses and widgets)
 * Test users are identified by email patterns matching test run IDs
 */

import { config } from 'dotenv';
import { db } from '../lib/db/client';
import { users } from '../lib/db/schema';
import { like, or } from 'drizzle-orm';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function cleanTestData() {
  console.log('🧹 Cleaning test data...');

  try {
    // Delete all users with test email patterns
    // This will CASCADE delete their licenses and widgets
    // Patterns: day3-user-*, temp-*, test-*
    const result = await db
      .delete(users)
      .where(
        or(
          like(users.email, 'day3-user-%'),
          like(users.email, 'temp-%'),
          like(users.email, 'test-%')
        )
      )
      .returning();

    console.log(`✅ Deleted ${result.length} test users and their associated data`);

    if (result.length > 0) {
      console.log('   Deleted users:');
      result.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    process.exit(1);
  }

  process.exit(0);
}

cleanTestData();

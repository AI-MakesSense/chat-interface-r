/**
 * Debug Script: Check License in Database
 *
 * Purpose: Verify that a specific license key exists and is configured correctly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../lib/db/client';
import { licenses } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

const licenseKey = '23502877b37aeb999a05d5ec075fda9b'; // Pro tier

async function checkLicense() {
  console.log(`\n🔍 Checking license: ${licenseKey}\n`);

  const result = await db.select().from(licenses).where(eq(licenses.licenseKey, licenseKey));

  if (result.length === 0) {
    console.log('❌ License NOT found in database');
    console.log('\n💡 Try running: pnpm db:seed\n');
    process.exit(1);
  }

  const license = result[0];
  console.log('✅ License found!\n');
  console.log('License Details:');
  console.log('───────────────────────────────────────');
  console.log(`ID:                  ${license.id}`);
  console.log(`Tier:                ${license.tier}`);
  console.log(`Status:              ${license.status}`);
  console.log(`Branding Enabled:    ${license.brandingEnabled}`);
  console.log(`Domains:             ${JSON.stringify(license.domains)}`);
  console.log(`Domain Limit:        ${license.domainLimit}`);
  console.log(`Widget Limit:        ${license.widgetLimit}`);
  console.log(`Expires At:          ${license.expiresAt || 'Never'}`);
  console.log(`Created At:          ${license.createdAt}`);
  console.log('───────────────────────────────────────\n');

  // Check for issues
  if (license.status !== 'active') {
    console.log(`⚠️  WARNING: License status is "${license.status}" (should be "active")`);
  }

  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    console.log(`⚠️  WARNING: License expired on ${license.expiresAt}`);
  }

  if (license.domains.length === 0) {
    console.log(`⚠️  WARNING: No domains configured`);
  } else {
    console.log(`✅ Allowed domains: ${license.domains.join(', ')}`);
  }

  process.exit(0);
}

checkLicense().catch((error) => {
  console.error('Error checking license:', error);
  process.exit(1);
});

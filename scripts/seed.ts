/**
 * Database Seed Script
 *
 * Purpose: Populate database with test data for development
 * Usage: pnpm db:seed
 *
 * Creates:
 * - Test user accounts with subscription tiers
 * - Sample licenses (basic, pro, agency) - legacy, kept for backward compatibility
 * - Sample widgets with widgetKey, embedType, userId (new schema v2.0)
 */

// IMPORTANT: Load environment variables FIRST, before any imports
import { config } from 'dotenv';
config({ path: '.env.local' });

// Now import db client (which needs env vars)
import { db } from '../lib/db/client';
import { users, licenses, widgets } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { randomBytes } from 'crypto';

/**
 * Generate a random license key (32-char hex)
 */
function generateLicenseKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a widget key (16-char alphanumeric)
 * Uses base36 encoding for URL-friendly keys
 */
function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

/**
 * Sample widget configuration
 */
const sampleConfig = {
  branding: {
    companyName: 'Acme Corp',
    welcomeText: 'How can we help you today?',
    responseTimeText: 'We typically respond within minutes',
    firstMessage: 'Hello! I\'m here to help. What can I do for you?',
    inputPlaceholder: 'Type your message...',
    logoUrl: 'https://via.placeholder.com/150',
  },
  style: {
    theme: 'auto',
    primaryColor: '#00bfff',
    secondaryColor: '#0080ff',
    backgroundColor: '#ffffff',
    fontColor: '#333333',
    position: 'bottom-right',
    cornerRadius: 12,
    fullscreen: false,
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    fontUrl: null,
    disableDefaultFont: false,
  },
  features: {
    attachmentsEnabled: true,
    allowedExtensions: ['.jpg', '.png', '.pdf', '.txt'],
    maxFileSize: 5242880, // 5MB
  },
  connection: {
    webhookUrl: 'https://infinitesystems.app.n8n.cloud/webhook/d3421cff-f72f-423f-a4d3-d0571a0c93ab/chat',
    route: null,
  },
};

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // 0. Clear existing data (for idempotent seeding)
    console.log('Clearing existing data...');
    await db.delete(widgets); // Delete child records first
    await db.delete(licenses);
    await db.delete(users);
    console.log('✓ Cleared existing data\n');

    // 1. Create test users with subscription tiers
    console.log('Creating test users...');

    const testUser1 = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: await hashPassword('password123'),
      name: 'Test User',
      emailVerified: true,
      tier: 'basic',
      subscriptionStatus: 'active',
    }).returning();

    const testUser2 = await db.insert(users).values({
      email: 'demo@example.com',
      passwordHash: await hashPassword('demo1234'),
      name: 'Demo User',
      emailVerified: true,
      tier: 'pro',
      subscriptionStatus: 'active',
    }).returning();

    const testUser3 = await db.insert(users).values({
      email: 'agency@example.com',
      passwordHash: await hashPassword('agency1234'),
      name: 'Agency Owner',
      emailVerified: true,
      tier: 'agency',
      subscriptionStatus: 'active',
    }).returning();

    console.log(`✓ Created ${testUser1.length + testUser2.length + testUser3.length} users`);

    // 2. Create licenses
    console.log('\nCreating licenses...');

    // Basic license for test user
    const basicLicense = await db.insert(licenses).values({
      userId: testUser1[0].id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['localhost', 'test.example.com'],
      domainLimit: 1,
      brandingEnabled: true,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }).returning();

    // Pro license for demo user
    const proLicense = await db.insert(licenses).values({
      userId: testUser2[0].id,
      licenseKey: generateLicenseKey(),
      tier: 'pro',
      domains: ['localhost', 'demo.example.com'],
      domainLimit: 1,
      brandingEnabled: false,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }).returning();

    // Agency license for agency user
    const agencyLicense = await db.insert(licenses).values({
      userId: testUser3[0].id,
      licenseKey: generateLicenseKey(),
      tier: 'agency',
      domains: ['agency.example.com', 'client1.com', 'client2.com'],
      domainLimit: -1, // unlimited
      brandingEnabled: false,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }).returning();

    console.log(`✓ Created 3 licenses`);
    console.log(`  - Basic: ${basicLicense[0].licenseKey}`);
    console.log(`  - Pro: ${proLicense[0].licenseKey}`);
    console.log(`  - Agency: ${agencyLicense[0].licenseKey}`);

    // 3. Create widgets with new schema fields
    console.log('\nCreating widgets...');

    // Generate widget keys
    const basicWidgetKey = generateWidgetKey();
    const proWidgetKey = generateWidgetKey();
    const agencyWidgetKey = generateWidgetKey();
    const inlineWidgetKey = generateWidgetKey();
    const fullpageWidgetKey = generateWidgetKey();

    // Basic widget - popup type (default)
    await db.insert(widgets).values({
      licenseId: basicLicense[0].id,
      userId: testUser1[0].id,
      widgetKey: basicWidgetKey,
      name: 'Basic Widget',
      embedType: 'popup',
      allowedDomains: ['localhost', 'test.example.com'],
      config: sampleConfig,
    });

    // Pro widget - popup type
    await db.insert(widgets).values({
      licenseId: proLicense[0].id,
      userId: testUser2[0].id,
      widgetKey: proWidgetKey,
      name: 'Pro Widget',
      embedType: 'popup',
      allowedDomains: ['localhost', 'demo.example.com'],
      config: {
        ...sampleConfig,
        branding: {
          ...sampleConfig.branding,
          companyName: 'Demo Company',
        },
        style: {
          ...sampleConfig.style,
          primaryColor: '#9333ea', // Purple
        },
      },
    });

    // Agency widget - popup type
    await db.insert(widgets).values({
      licenseId: agencyLicense[0].id,
      userId: testUser3[0].id,
      widgetKey: agencyWidgetKey,
      name: 'Agency Widget',
      embedType: 'popup',
      allowedDomains: null, // Agency can use on any domain
      config: {
        ...sampleConfig,
        branding: {
          ...sampleConfig.branding,
          companyName: 'Agency Client',
        },
        style: {
          ...sampleConfig.style,
          primaryColor: '#f59e0b', // Amber
        },
      },
    });

    // Inline widget example (Pro tier)
    await db.insert(widgets).values({
      licenseId: proLicense[0].id,
      userId: testUser2[0].id,
      widgetKey: inlineWidgetKey,
      name: 'Inline Support Widget',
      embedType: 'inline',
      allowedDomains: ['localhost', 'demo.example.com'],
      config: {
        ...sampleConfig,
        branding: {
          ...sampleConfig.branding,
          companyName: 'Inline Demo',
          welcomeText: 'Chat with us directly on this page',
        },
        style: {
          ...sampleConfig.style,
          primaryColor: '#059669', // Emerald
        },
      },
    });

    // Fullpage widget example (Agency tier)
    await db.insert(widgets).values({
      licenseId: agencyLicense[0].id,
      userId: testUser3[0].id,
      widgetKey: fullpageWidgetKey,
      name: 'Fullpage Chat Portal',
      embedType: 'fullpage',
      allowedDomains: null, // Agency can use on any domain
      config: {
        ...sampleConfig,
        branding: {
          ...sampleConfig.branding,
          companyName: 'Chat Portal',
          welcomeText: 'Welcome to our dedicated support portal',
        },
        style: {
          ...sampleConfig.style,
          primaryColor: '#7c3aed', // Violet
        },
      },
    });

    console.log('✓ Created 5 widgets');
    console.log(`  - Basic (popup): ${basicWidgetKey}`);
    console.log(`  - Pro (popup): ${proWidgetKey}`);
    console.log(`  - Agency (popup): ${agencyWidgetKey}`);
    console.log(`  - Inline: ${inlineWidgetKey}`);
    console.log(`  - Fullpage: ${fullpageWidgetKey}`);

    // Print summary
    console.log('\n✅ Seed completed successfully!\n');
    console.log('Test accounts (with account-level subscriptions):');
    console.log('  Email: test@example.com | Password: password123 | Tier: basic');
    console.log('  Email: demo@example.com | Password: demo1234 | Tier: pro');
    console.log('  Email: agency@example.com | Password: agency1234 | Tier: agency\n');
    console.log('Embed types created:');
    console.log('  - popup: Standard chat bubble (basic, pro, agency)');
    console.log('  - inline: Embedded in container (pro tier)');
    console.log('  - fullpage: Full viewport chat (agency tier)\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();

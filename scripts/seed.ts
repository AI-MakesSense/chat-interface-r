/**
 * Database Seed Script
 *
 * Purpose: Populate database with test data for development
 * Usage: pnpm db:seed
 *
 * Creates:
 * - Test user accounts
 * - Sample licenses (basic, pro, agency)
 * - Sample widget configurations
 */

// IMPORTANT: Load environment variables FIRST, before any imports
import { config } from 'dotenv';
config({ path: '.env.local' });

// Now import db client (which needs env vars)
import { db } from '../lib/db/client';
import { users, licenses, widgetConfigs } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/password';
import { randomBytes } from 'crypto';

/**
 * Generate a random license key (32-char hex)
 */
function generateLicenseKey(): string {
  return randomBytes(16).toString('hex');
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
    webhookUrl: 'https://example.com/webhook/test',
    route: null,
  },
};

async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // 0. Clear existing data (for idempotent seeding)
    console.log('Clearing existing data...');
    await db.delete(widgetConfigs); // Delete child records first
    await db.delete(licenses);
    await db.delete(users);
    console.log('✓ Cleared existing data\n');

    // 1. Create test users
    console.log('Creating test users...');

    const testUser1 = await db.insert(users).values({
      email: 'test@example.com',
      passwordHash: await hashPassword('password123'),
      name: 'Test User',
      emailVerified: true,
    }).returning();

    const testUser2 = await db.insert(users).values({
      email: 'demo@example.com',
      passwordHash: await hashPassword('demo1234'),
      name: 'Demo User',
      emailVerified: true,
    }).returning();

    const testUser3 = await db.insert(users).values({
      email: 'agency@example.com',
      passwordHash: await hashPassword('agency1234'),
      name: 'Agency Owner',
      emailVerified: true,
    }).returning();

    console.log(`✓ Created ${testUser1.length + testUser2.length + testUser3.length} users`);

    // 2. Create licenses
    console.log('\nCreating licenses...');

    // Basic license for test user
    const basicLicense = await db.insert(licenses).values({
      userId: testUser1[0].id,
      licenseKey: generateLicenseKey(),
      tier: 'basic',
      domains: ['localhost:3000', 'test.example.com'],
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
      domains: ['demo.example.com'],
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

    // 3. Create widget configs
    console.log('\nCreating widget configurations...');

    await db.insert(widgetConfigs).values({
      licenseId: basicLicense[0].id,
      config: sampleConfig,
      version: 1,
    });

    await db.insert(widgetConfigs).values({
      licenseId: proLicense[0].id,
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
      version: 1,
    });

    await db.insert(widgetConfigs).values({
      licenseId: agencyLicense[0].id,
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
      version: 1,
    });

    console.log('✓ Created 3 widget configurations');

    // Print summary
    console.log('\n✅ Seed completed successfully!\n');
    console.log('Test accounts:');
    console.log('  Email: test@example.com | Password: password123 | Tier: Basic');
    console.log('  Email: demo@example.com | Password: demo1234 | Tier: Pro');
    console.log('  Email: agency@example.com | Password: agency1234 | Tier: Agency\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();

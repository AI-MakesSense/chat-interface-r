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
 * Sample widget configuration - Basic tier
 */
const basicConfig = {
  branding: {
    companyName: 'Acme Corp',
    welcomeText: 'How can we help you today?',
    responseTimeText: 'We typically respond within minutes',
    firstMessage: 'Hello! I\'m here to help. What can I do for you?',
    inputPlaceholder: 'Type your message...',
    logoUrl: 'https://via.placeholder.com/150',
    brandingEnabled: true,
  },
  themeMode: 'light',
  useAccent: true,
  accentColor: '#00bfff',
  radius: 'medium',
  density: 'normal',
  style: {
    position: 'bottom-right',
  },
  features: {
    attachmentsEnabled: false,
    allowedExtensions: ['.jpg', '.png', '.pdf', '.txt'],
    maxFileSize: 5242880,
  },
  connection: {
    provider: 'n8n',
    webhookUrl: 'https://infinitesystems.app.n8n.cloud/webhook/d3421cff-f72f-423f-a4d3-d0571a0c93ab/chat',
  },
};

/**
 * Sample widget configuration - Pro tier with advancedStyling
 */
const proConfig = {
  branding: {
    companyName: 'Demo Company',
    welcomeText: 'Welcome to our Pro support!',
    responseTimeText: 'We typically respond instantly',
    firstMessage: 'Hi there! How can I assist you today?',
    inputPlaceholder: 'Ask me anything...',
    logoUrl: 'https://via.placeholder.com/150',
    brandingEnabled: false,
    launcherIcon: 'chat',
  },
  themeMode: 'light',
  useAccent: true,
  accentColor: '#9333ea',
  accentLevel: 2,
  useTintedGrayscale: true,
  tintHue: 280,
  tintLevel: 10,
  shadeLevel: 50,
  radius: 'large',
  density: 'normal',
  fontFamily: 'Inter',
  fontSize: 15,
  greeting: 'How can I help you today?',
  starterPrompts: [
    { label: 'Get Started', icon: '🚀' },
    { label: 'Ask a Question', icon: '❓' },
  ],
  placeholder: 'Type your message...',
  style: {
    position: 'bottom-right',
  },
  features: {
    attachmentsEnabled: true,
    allowedExtensions: ['.jpg', '.png', '.pdf', '.txt', '.doc', '.docx'],
    maxFileSize: 10485760,
  },
  connection: {
    provider: 'n8n',
    webhookUrl: 'https://infinitesystems.app.n8n.cloud/webhook/d3421cff-f72f-423f-a4d3-d0571a0c93ab/chat',
  },
  advancedStyling: {
    enabled: true,
    messages: {
      userMessageBackground: '#9333ea',
      userMessageText: '#FFFFFF',
      botMessageBackground: '#F3F4F6',
      botMessageText: '#111827',
      messageSpacing: 12,
      bubblePadding: 12,
      showAvatar: false,
    },
    markdown: {
      codeBlockBackground: '#1F2937',
      codeBlockText: '#F9FAFB',
      linkColor: '#9333ea',
      linkHoverColor: '#7C3AED',
    },
  },
  behavior: {
    autoOpen: false,
    autoOpenDelay: 0,
    showCloseButton: true,
    persistMessages: true,
    enableTypingIndicator: true,
  },
};

/**
 * Sample widget configuration - Agency tier with full styling
 */
const agencyConfig = {
  branding: {
    companyName: 'Agency Client',
    welcomeText: 'Premium Support Experience',
    responseTimeText: 'Instant AI-powered responses',
    firstMessage: 'Welcome! I\'m your dedicated assistant. How may I help?',
    inputPlaceholder: 'Tell me what you need...',
    logoUrl: 'https://via.placeholder.com/150',
    brandingEnabled: false,
    launcherIcon: 'support',
  },
  themeMode: 'dark',
  useAccent: true,
  accentColor: '#f59e0b',
  accentLevel: 2,
  useTintedGrayscale: true,
  tintHue: 40,
  tintLevel: 15,
  shadeLevel: 60,
  useCustomSurfaceColors: true,
  surfaceBackgroundColor: '#18181B',
  surfaceForegroundColor: '#27272A',
  useCustomUserMessageColors: true,
  userMessageTextColor: '#FFFFFF',
  userMessageBgColor: '#f59e0b',
  radius: 'large',
  density: 'spacious',
  fontFamily: 'Poppins',
  fontSize: 16,
  greeting: 'How can we assist you today?',
  starterPrompts: [
    { label: 'View Services', icon: '📋' },
    { label: 'Get Support', icon: '🛠️' },
    { label: 'Contact Sales', icon: '💼' },
  ],
  placeholder: 'Describe your needs...',
  disclaimer: 'Powered by AI • Responses may vary',
  style: {
    position: 'bottom-right',
  },
  features: {
    attachmentsEnabled: true,
    allowedExtensions: ['.jpg', '.png', '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx'],
    maxFileSize: 20971520,
    emailTranscript: true,
    ratingPrompt: true,
  },
  connection: {
    provider: 'n8n',
    webhookUrl: 'https://infinitesystems.app.n8n.cloud/webhook/d3421cff-f72f-423f-a4d3-d0571a0c93ab/chat',
  },
  advancedStyling: {
    enabled: true,
    messages: {
      userMessageBackground: '#f59e0b',
      userMessageText: '#000000',
      botMessageBackground: '#27272A',
      botMessageText: '#E4E4E7',
      messageSpacing: 14,
      bubblePadding: 14,
      showAvatar: true,
      avatarUrl: 'https://via.placeholder.com/40',
    },
    markdown: {
      codeBlockBackground: '#0F0F10',
      codeBlockText: '#FCD34D',
      codeBlockBorder: '#374151',
      inlineCodeBackground: '#27272A',
      inlineCodeText: '#FBBF24',
      linkColor: '#F59E0B',
      linkHoverColor: '#D97706',
      tableHeaderBackground: '#27272A',
      tableBorderColor: '#3F3F46',
    },
  },
  behavior: {
    autoOpen: false,
    autoOpenDelay: 0,
    showCloseButton: true,
    persistMessages: true,
    enableSoundNotifications: false,
    enableTypingIndicator: true,
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

    // 3. Create widgets
    console.log('\nCreating widgets...');

    await db.insert(widgets).values({
      licenseId: basicLicense[0].id,
      name: 'Basic Widget',
      config: basicConfig,
    });

    await db.insert(widgets).values({
      licenseId: proLicense[0].id,
      name: 'Pro Widget',
      config: proConfig,
    });

    await db.insert(widgets).values({
      licenseId: agencyLicense[0].id,
      name: 'Agency Widget',
      config: agencyConfig,
    });

    console.log('✓ Created 3 widgets');

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

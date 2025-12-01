/**
 * Test Script for Schema v2.0 Endpoints
 *
 * Validates the new widget endpoints:
 * - GET /api/w/[widgetKey]/config
 * - POST /api/w/[widgetKey]/validate
 * - GET /w/[widgetKey].js
 *
 * Usage:
 *   npx tsx scripts/test-v2-endpoints.ts [widgetKey]
 *   npx tsx scripts/test-v2-endpoints.ts --all
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      message: 'OK',
      duration: Date.now() - start,
    });
    console.log(`✓ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({
      name,
      passed: false,
      message,
      duration: Date.now() - start,
    });
    console.log(`✗ ${name}: ${message}`);
  }
}

async function getWidgetKeys(): Promise<string[]> {
  const sql = neon(process.env.DATABASE_URL!);
  const widgets = await sql`
    SELECT widget_key FROM widgets
    WHERE widget_key IS NOT NULL AND status = 'active'
    LIMIT 10
  `;
  return widgets.map((w: any) => w.widget_key);
}

async function testConfigEndpoint(widgetKey: string): Promise<void> {
  const url = `${BASE_URL}/api/w/${widgetKey}/config`;
  const response = await fetch(url, {
    headers: {
      'Origin': 'http://localhost:3000',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Config endpoint failed: ${response.status} - ${error.error || 'Unknown error'}`);
  }

  const config = await response.json();

  // Validate required fields
  if (!config.license) throw new Error('Missing license in config');
  if (!config.license.key) throw new Error('Missing license.key in config');
  if (config.license.key !== widgetKey) throw new Error(`License key mismatch: ${config.license.key} !== ${widgetKey}`);
  if (!config.theme) throw new Error('Missing theme in config');
  if (!config.connection) throw new Error('Missing connection in config');
}

async function testValidateEndpoint(widgetKey: string): Promise<void> {
  const url = `${BASE_URL}/api/w/${widgetKey}/validate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
    body: JSON.stringify({ domain: 'localhost' }),
  });

  if (!response.ok) {
    throw new Error(`Validate endpoint HTTP error: ${response.status}`);
  }

  const result = await response.json();

  if (!result.valid) {
    throw new Error(`Validation failed: ${result.reason}`);
  }

  if (!result.widget) throw new Error('Missing widget in validation response');
  if (result.widget.widgetKey !== widgetKey) {
    throw new Error(`Widget key mismatch: ${result.widget.widgetKey} !== ${widgetKey}`);
  }
}

async function testWidgetServing(widgetKey: string): Promise<void> {
  const url = `${BASE_URL}/w/${widgetKey}.js`;
  const response = await fetch(url, {
    headers: {
      'Referer': 'http://localhost:3000/',
    },
  });

  // Widget serving returns JS content
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('javascript')) {
    throw new Error(`Expected JavaScript content, got: ${contentType}`);
  }

  const script = await response.text();

  // Check it's not an error script
  if (script.includes('console.error') && script.includes('ChatWidget')) {
    // Check for specific error indicators
    if (script.includes('LICENSE_INVALID') || script.includes('DOMAIN_UNAUTHORIZED')) {
      throw new Error('Widget serving returned error script');
    }
  }

  // Should have some content
  if (script.length < 100) {
    throw new Error('Widget script too short, likely an error');
  }
}

async function testInvalidWidgetKey(): Promise<void> {
  const invalidKey = 'invalid123';

  // Test config endpoint with invalid key
  const configResponse = await fetch(`${BASE_URL}/api/w/${invalidKey}/config`);
  if (configResponse.ok) {
    throw new Error('Config endpoint should reject invalid key format');
  }

  // Test validate endpoint with invalid key
  const validateResponse = await fetch(`${BASE_URL}/api/w/${invalidKey}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'localhost' }),
  });
  const validateResult = await validateResponse.json();
  if (validateResult.valid) {
    throw new Error('Validate endpoint should reject invalid key format');
  }
}

async function testNonExistentWidget(): Promise<void> {
  const fakeKey = 'AAAAAAAAAAAAAAAA'; // 16-char valid format but doesn't exist

  const configResponse = await fetch(`${BASE_URL}/api/w/${fakeKey}/config`);
  if (configResponse.ok) {
    throw new Error('Config endpoint should return 404 for non-existent widget');
  }

  const validateResponse = await fetch(`${BASE_URL}/api/w/${fakeKey}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'localhost' }),
  });
  const validateResult = await validateResponse.json();
  if (validateResult.valid) {
    throw new Error('Validate endpoint should reject non-existent widget');
  }
}

async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('Schema v2.0 Endpoint Tests');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('========================================\n');

  const args = process.argv.slice(2);
  let widgetKeys: string[] = [];

  if (args.includes('--all')) {
    console.log('Fetching all active widget keys from database...\n');
    widgetKeys = await getWidgetKeys();
    if (widgetKeys.length === 0) {
      console.log('No widgets found in database. Run migration first.');
      process.exit(1);
    }
    console.log(`Found ${widgetKeys.length} widgets to test\n`);
  } else if (args.length > 0 && !args[0].startsWith('-')) {
    widgetKeys = [args[0]];
  } else {
    // Try to get one widget from database
    console.log('Fetching a widget key from database...\n');
    widgetKeys = await getWidgetKeys();
    if (widgetKeys.length === 0) {
      console.log('No widgets found. Please provide a widget key or run migration first.');
      console.log('Usage: npx tsx scripts/test-v2-endpoints.ts [widgetKey]');
      process.exit(1);
    }
    widgetKeys = [widgetKeys[0]];
  }

  // Test error cases first
  console.log('Testing error cases...\n');
  await runTest('Invalid widget key format', testInvalidWidgetKey);
  await runTest('Non-existent widget', testNonExistentWidget);

  // Test each widget
  console.log('\nTesting valid widgets...\n');
  for (const widgetKey of widgetKeys) {
    console.log(`\nWidget: ${widgetKey}`);
    console.log('-'.repeat(40));

    await runTest(`[${widgetKey}] Config endpoint`, () => testConfigEndpoint(widgetKey));
    await runTest(`[${widgetKey}] Validate endpoint`, () => testValidateEndpoint(widgetKey));
    await runTest(`[${widgetKey}] Widget serving`, () => testWidgetServing(widgetKey));
  }

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }

  console.log('\n✓ All tests passed!\n');
}

main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});

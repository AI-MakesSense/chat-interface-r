/**
 * Test Setup File
 *
 * Purpose: Configure test environment and set up global test utilities
 * Runs before all tests (AFTER env-setup.ts has loaded environment variables)
 *
 * Note: Environment variables are now set in env-setup.ts which runs first
 * to ensure they're available before any module imports.
 */

import { beforeAll, afterAll } from 'vitest';

// Set up test hooks
beforeAll(() => {
  // Environment variables are already set in env-setup.ts
  // Add any additional test setup here (mocks, database connections, etc.)
});

// Clean up after all tests
afterAll(() => {
  // Cleanup if needed
});

/**
 * Environment Setup for Tests
 *
 * Purpose: Load environment variables BEFORE any modules are imported
 * This file runs at the very beginning of test execution, ensuring env vars
 * are available when modules like lib/auth/jwt.ts are first loaded.
 *
 * IMPORTANT: This must be the first setupFile in vitest.config.ts
 */

// Load .env.local file first
import { config } from 'dotenv';
config({ path: '.env.local' });

// Set environment variables before any imports happen
// Use .env.local DATABASE_URL for integration tests, fallback to test DB for unit tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-characters-long-for-testing';
}
// For integration tests, use the actual DATABASE_URL from .env.local
// For unit tests that don't need a database, this won't be used
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
}
process.env.NODE_ENV = 'test';
if (!process.env.NEXT_PUBLIC_URL) {
  process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';
}

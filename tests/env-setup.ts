/**
 * Environment Setup for Tests
 *
 * Purpose: Load environment variables BEFORE any modules are imported
 * This file runs at the very beginning of test execution, ensuring env vars
 * are available when modules like lib/auth/jwt.ts are first loaded.
 *
 * IMPORTANT: This must be the first setupFile in vitest.config.ts
 */

// Set environment variables before any imports happen
process.env.JWT_SECRET = 'test-jwt-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';

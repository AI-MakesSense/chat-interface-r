/**
 * Vitest Global Setup
 *
 * Sets up environment variables and globals needed for tests
 */

// Set environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars-length';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/test';

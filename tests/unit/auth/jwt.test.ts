/**
 * Unit Tests for JWT Utilities
 *
 * Tests for lib/auth/jwt.ts
 *
 * Test Coverage:
 * - signJWT creates valid tokens
 * - verifyJWT validates tokens correctly
 * - verifyJWT rejects invalid/expired tokens
 * - extractTokenFromCookie works correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { signJWT, verifyJWT, extractTokenFromCookie, type JWTPayload } from '@/lib/auth/jwt';

describe('JWT Utilities', () => {
  describe('signJWT', () => {
    it('should create a valid JWT token', async () => {
      // Arrange
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
      };

      // Act
      const token = await signJWT(payload);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts separated by dots
    });

    it('should create tokens with different payloads', async () => {
      // Arrange
      const payload1 = { sub: 'user-1', email: 'user1@example.com' };
      const payload2 = { sub: 'user-2', email: 'user2@example.com' };

      // Act
      const token1 = await signJWT(payload1);
      const token2 = await signJWT(payload2);

      // Assert
      expect(token1).not.toBe(token2); // Different payloads should produce different tokens
    });

    it('should include iat and exp claims', async () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'test@example.com' };

      // Act
      const token = await signJWT(payload);
      const decoded = await verifyJWT(token);

      // Assert
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(decoded.iat!);
    });

    it('should set expiration to 7 days from now', async () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const now = Math.floor(Date.now() / 1000);
      const sevenDays = 7 * 24 * 60 * 60; // 7 days in seconds

      // Act
      const token = await signJWT(payload);
      const decoded = await verifyJWT(token);

      // Assert
      const expiresIn = decoded.exp! - now;
      expect(expiresIn).toBeGreaterThan(sevenDays - 10); // Allow 10 seconds tolerance
      expect(expiresIn).toBeLessThanOrEqual(sevenDays + 10);
    });
  });

  describe('verifyJWT', () => {
    it('should verify and decode a valid token', async () => {
      // Arrange
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
      };
      const token = await signJWT(payload);

      // Act
      const decoded = await verifyJWT(token);

      // Assert
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
    });

    it('should preserve all payload fields', async () => {
      // Arrange
      const payload = {
        sub: 'user-456',
        email: 'another@example.com',
      };
      const token = await signJWT(payload);

      // Act
      const decoded = await verifyJWT(token);

      // Assert
      expect(decoded.sub).toBe('user-456');
      expect(decoded.email).toBe('another@example.com');
    });

    it('should reject invalid token format', async () => {
      // Arrange
      const invalidToken = 'not.a.valid.jwt.token';

      // Act & Assert
      await expect(verifyJWT(invalidToken)).rejects.toThrow('Invalid or expired token');
    });

    it('should reject empty token', async () => {
      // Arrange
      const emptyToken = '';

      // Act & Assert
      await expect(verifyJWT(emptyToken)).rejects.toThrow('Invalid or expired token');
    });

    it('should reject token with invalid signature', async () => {
      // Arrange
      const token = await signJWT({ sub: 'user-123', email: 'test@example.com' });
      // Tamper with the token by changing last character
      const tamperedToken = token.slice(0, -1) + 'X';

      // Act & Assert
      await expect(verifyJWT(tamperedToken)).rejects.toThrow('Invalid or expired token');
    });

    it('should reject completely invalid string', async () => {
      // Arrange
      const invalidToken = 'totally-not-a-jwt';

      // Act & Assert
      await expect(verifyJWT(invalidToken)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('extractTokenFromCookie', () => {
    it('should extract token from cookie header with default name', () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const cookieHeader = `auth-token=${token}`;

      // Act
      const extracted = extractTokenFromCookie(cookieHeader);

      // Assert
      expect(extracted).toBe(token);
    });

    it('should extract token from cookie header with multiple cookies', () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const cookieHeader = `other_cookie=value; auth-token=${token}; another=cookie`;

      // Act
      const extracted = extractTokenFromCookie(cookieHeader);

      // Assert
      expect(extracted).toBe(token);
    });

    it('should extract token with custom cookie name', () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const cookieHeader = `custom_auth=${token}`;

      // Act
      const extracted = extractTokenFromCookie(cookieHeader, 'custom_auth');

      // Assert
      expect(extracted).toBe(token);
    });

    it('should return null if cookie header is null', () => {
      // Act
      const extracted = extractTokenFromCookie(null);

      // Assert
      expect(extracted).toBeNull();
    });

    it('should return null if auth cookie is not present', () => {
      // Arrange
      const cookieHeader = 'other_cookie=value; another=cookie';

      // Act
      const extracted = extractTokenFromCookie(cookieHeader);

      // Assert
      expect(extracted).toBeNull();
    });

    it('should return null if cookie header is empty string', () => {
      // Act
      const extracted = extractTokenFromCookie('');

      // Assert
      expect(extracted).toBeNull();
    });

    it('should handle cookies with no spaces after semicolon', () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const cookieHeader = `other=value;auth-token=${token};another=cookie`;

      // Act
      const extracted = extractTokenFromCookie(cookieHeader);

      // Assert
      expect(extracted).toBe(token);
    });

    it('should handle cookies with spaces around equals sign', () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const cookieHeader = `auth-token = ${token}`;

      // Act
      const extracted = extractTokenFromCookie(cookieHeader);

      // Assert
      // This should actually return null because the cookie name won't match exactly
      // but let's test the current implementation behavior
      expect(extracted).toBeNull(); // Cookie name "auth-token " (with space) won't match
    });

    it('should extract first matching cookie if multiple exist', () => {
      // Arrange
      const token1 = 'token1';
      const token2 = 'token2';
      const cookieHeader = `auth-token=${token1}; other=value; auth-token=${token2}`;

      // Act
      const extracted = extractTokenFromCookie(cookieHeader);

      // Assert
      expect(extracted).toBe(token1); // Should get the first one
    });
  });

  describe('Integration: signJWT + verifyJWT', () => {
    it('should successfully sign and verify a token', async () => {
      // Arrange
      const originalPayload = {
        sub: 'user-789',
        email: 'integration@example.com',
      };

      // Act
      const token = await signJWT(originalPayload);
      const decodedPayload = await verifyJWT(token);

      // Assert
      expect(decodedPayload.sub).toBe(originalPayload.sub);
      expect(decodedPayload.email).toBe(originalPayload.email);
    });

    it('should handle special characters in email', async () => {
      // Arrange
      const payload = {
        sub: 'user-special',
        email: 'user+test@example.co.uk',
      };

      // Act
      const token = await signJWT(payload);
      const decoded = await verifyJWT(token);

      // Assert
      expect(decoded.email).toBe(payload.email);
    });

    it('should handle UUID as user ID', async () => {
      // Arrange
      const payload = {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'uuid@example.com',
      };

      // Act
      const token = await signJWT(payload);
      const decoded = await verifyJWT(token);

      // Assert
      expect(decoded.sub).toBe(payload.sub);
    });
  });
});

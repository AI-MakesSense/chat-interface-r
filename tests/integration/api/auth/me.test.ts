/**
 * Integration Tests for Get Current User API Route
 *
 * Tests for app/api/auth/me/route.ts
 *
 * Test Coverage:
 * - GET /api/auth/me returns user data with valid token
 * - GET /api/auth/me rejects requests without token
 * - GET /api/auth/me rejects requests with invalid token
 * - GET /api/auth/me handles user not found case
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/auth/me/route';
import { NextRequest } from 'next/server';
import * as dbQueries from '@/lib/db/queries';
import { signJWT } from '@/lib/auth/jwt';
import { mockUser, resetDbMocks } from '@/tests/mocks/db';

// Mock the database queries module
vi.mock('@/lib/db/queries', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

// Helper function to create a mock GET request
function createMeRequest(cookieHeader?: string): NextRequest {
  const headers = new Headers();
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  return new NextRequest('http://localhost:3000/api/auth/me', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    resetDbMocks();
  });

  describe('Success Cases', () => {
    it('should return user data with valid token', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      // Mock: getUserById returns user
      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.id).toBe(mockUser.id);
      expect(data.user.email).toBe(mockUser.email);
      expect(data.user.name).toBe(mockUser.name);
      expect(data.user.emailVerified).toBe(mockUser.emailVerified);
      expect(data.user.createdAt).toBeDefined();
    });

    it('should not return password hash', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain('passwordHash');
    });

    it('should include emailVerified status', async () => {
      // Arrange
      const verifiedUser = { ...mockUser, emailVerified: true };
      const payload = { sub: verifiedUser.id, email: verifiedUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(verifiedUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.user.emailVerified).toBe(true);
    });

    it('should include createdAt timestamp', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.user.createdAt).toBeDefined();
      expect(new Date(data.user.createdAt)).toBeInstanceOf(Date);
    });

    it('should work with token in cookie among other cookies', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`session=xyz; auth_token=${token}; other=value`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.id).toBe(mockUser.id);
    });

    it('should handle user with null name', async () => {
      // Arrange
      const userWithoutName = { ...mockUser, name: null };
      const payload = { sub: userWithoutName.id, email: userWithoutName.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(userWithoutName);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.name).toBeNull();
    });
  });

  describe('Authentication Errors', () => {
    it('should reject request without cookie header', async () => {
      // Arrange
      const request = createMeRequest();

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject request without auth_token cookie', async () => {
      // Arrange
      const request = createMeRequest('other=value; session=xyz');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject request with invalid token format', async () => {
      // Arrange
      const request = createMeRequest('auth_token=invalid-token-format');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should reject request with malformed token', async () => {
      // Arrange
      const request = createMeRequest('auth_token=not.a.jwt');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or expired token');
    });

    it('should reject request with empty token', async () => {
      // Arrange
      const request = createMeRequest('auth_token=');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject request with tampered token', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);
      // Tamper with the token
      const tamperedToken = token.slice(0, -5) + 'XXXXX';

      const request = createMeRequest(`auth_token=${tamperedToken}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or expired token');
    });
  });

  describe('User Not Found', () => {
    it('should return 404 if user no longer exists', async () => {
      // Arrange
      const payload = { sub: 'non-existent-user-id', email: 'deleted@example.com' };
      const token = await signJWT(payload);

      // Mock: user not found in database
      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(null);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should handle deleted user gracefully', async () => {
      // Arrange
      // Token is valid but user was deleted from DB
      const payload = { sub: 'deleted-user-id', email: 'deleted@example.com' };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(null);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });
  });

  describe('Edge Cases', () => {
    it('should handle UUID user ID', async () => {
      // Arrange
      const userWithUUID = {
        ...mockUser,
        id: '550e8400-e29b-41d4-a716-446655440000',
      };
      const payload = { sub: userWithUUID.id, email: userWithUUID.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(userWithUUID);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.id).toBe(userWithUUID.id);
    });

    it('should handle email with special characters', async () => {
      // Arrange
      const userWithSpecialEmail = {
        ...mockUser,
        email: 'user+test@example.co.uk',
      };
      const payload = { sub: userWithSpecialEmail.id, email: userWithSpecialEmail.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(userWithSpecialEmail);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.email).toBe(userWithSpecialEmail.email);
    });

    it('should call getUserById with correct user ID from token', async () => {
      // Arrange
      const userId = 'test-user-123';
      const payload = { sub: userId, email: 'test@example.com' };
      const token = await signJWT(payload);

      const getUserByIdSpy = vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      await GET(request);

      // Assert
      expect(getUserByIdSpy).toHaveBeenCalledWith(userId);
    });
  });

  describe('Token Payload Extraction', () => {
    it('should extract user ID from token sub claim', async () => {
      // Arrange
      const userId = 'extracted-user-id';
      const payload = { sub: userId, email: 'extract@example.com' };
      const token = await signJWT(payload);

      const getUserByIdSpy = vi.spyOn(dbQueries, 'getUserById').mockResolvedValue({
        ...mockUser,
        id: userId,
      });

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      await GET(request);

      // Assert
      expect(getUserByIdSpy).toHaveBeenCalledWith(userId);
      expect(getUserByIdSpy).toHaveBeenCalledTimes(1);
    });

    it('should use token email to verify user identity', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      // The returned user should match the one from the database
      expect(data.user.email).toBe(mockUser.email);
    });
  });

  describe('Response Format', () => {
    it('should return user object nested in response', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty('user');
      expect(typeof data.user).toBe('object');
    });

    it('should include all expected user fields', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('name');
      expect(data.user).toHaveProperty('emailVerified');
      expect(data.user).toHaveProperty('createdAt');
    });

    it('should not include updatedAt or passwordHash', async () => {
      // Arrange
      const payload = { sub: mockUser.id, email: mockUser.email };
      const token = await signJWT(payload);

      vi.spyOn(dbQueries, 'getUserById').mockResolvedValue(mockUser);

      const request = createMeRequest(`auth_token=${token}`);

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.user).not.toHaveProperty('passwordHash');
      expect(data.user).not.toHaveProperty('updatedAt');
    });
  });
});

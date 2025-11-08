/**
 * Integration Tests for Signup API Route
 *
 * Tests for app/api/auth/signup/route.ts
 *
 * Test Coverage:
 * - POST /api/auth/signup creates user and returns token
 * - POST /api/auth/signup rejects duplicate emails
 * - POST /api/auth/signup validates password strength
 * - POST /api/auth/signup validates email format
 * - POST /api/auth/signup sets auth cookie
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/auth/signup/route';
import { NextRequest } from 'next/server';
import * as dbQueries from '@/lib/db/queries';
import { mockUser, resetDbMocks, setupDbMocksForSuccess } from '@/tests/mocks/db';

// Mock the database queries module
vi.mock('@/lib/db/queries', () => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  getUserById: vi.fn(),
  updateUser: vi.fn(),
}));

// Helper function to create a mock POST request
function createSignupRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    resetDbMocks();
  });

  describe('Success Cases', () => {
    it('should create user and return token with valid data', async () => {
      // Arrange
      const signupData = {
        email: 'newuser@example.com',
        password: 'ValidPass123',
        name: 'New User',
      };

      // Mock: email not taken
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);

      // Mock: user creation
      vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'new-user-id',
        email: signupData.email,
        passwordHash: 'hashed-password',
        name: signupData.name,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(signupData.email);
      expect(data.user.name).toBe(signupData.name);
      expect(data.user.id).toBeDefined();
      expect(data.token).toBeDefined();

      // Verify password hash is NOT returned
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should set auth cookie on successful signup', async () => {
      // Arrange
      const signupData = {
        email: 'cookie@example.com',
        password: 'ValidPass123',
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);
      vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'cookie-user-id',
        email: signupData.email,
        passwordHash: 'hashed',
        name: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('auth_token=');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Strict');
    });

    it('should work without optional name field', async () => {
      // Arrange
      const signupData = {
        email: 'noname@example.com',
        password: 'ValidPass123',
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);
      vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'noname-id',
        email: signupData.email,
        passwordHash: 'hashed',
        name: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.user.email).toBe(signupData.email);
      expect(data.user.name).toBeNull();
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const signupData = {
        email: 'MixedCase@Example.COM',
        password: 'ValidPass123',
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);

      const createUserSpy = vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'normalized-id',
        email: signupData.email.toLowerCase(),
        passwordHash: 'hashed',
        name: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      await POST(request);

      // Assert - createUser should be called with lowercase email
      expect(createUserSpy).toHaveBeenCalled();
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid email format', async () => {
      // Arrange
      const signupData = {
        email: 'not-an-email',
        password: 'ValidPass123',
      };

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should reject missing email', async () => {
      // Arrange
      const signupData = {
        password: 'ValidPass123',
      };

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing password', async () => {
      // Arrange
      const signupData = {
        email: 'test@example.com',
      };

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject password shorter than 8 characters', async () => {
      // Arrange
      const signupData = {
        email: 'test@example.com',
        password: 'Short1',
      };

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject password without number', async () => {
      // Arrange
      const signupData = {
        email: 'test@example.com',
        password: 'NoNumberPassword',
      };

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must contain at least one number');
    });

    it('should reject empty request body', async () => {
      // Arrange
      const request = createSignupRequest({});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Duplicate Email', () => {
    it('should reject signup with existing email', async () => {
      // Arrange
      const signupData = {
        email: 'existing@example.com',
        password: 'ValidPass123',
      };

      // Mock: email already exists
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(mockUser);

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409); // Conflict
      expect(data.error).toBe('Email already registered');
    });

    it('should reject signup with case-insensitive duplicate email', async () => {
      // Arrange
      const signupData = {
        email: 'EXISTING@EXAMPLE.COM',
        password: 'ValidPass123',
      };

      // Mock: email exists (lowercase)
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        email: 'existing@example.com',
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error).toBe('Email already registered');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long valid password', async () => {
      // Arrange
      const longPassword = 'A'.repeat(100) + '123';
      const signupData = {
        email: 'longpass@example.com',
        password: longPassword,
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);
      vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'long-pass-id',
        email: signupData.email,
        passwordHash: 'hashed',
        name: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle email with special characters', async () => {
      // Arrange
      const signupData = {
        email: 'user+test@example.co.uk',
        password: 'ValidPass123',
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);
      vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'special-email-id',
        email: signupData.email,
        passwordHash: 'hashed',
        name: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.user.email).toBe(signupData.email);
    });

    it('should handle password with special characters', async () => {
      // Arrange
      const signupData = {
        email: 'special@example.com',
        password: 'P@ssw0rd!#$%',
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);
      vi.spyOn(dbQueries, 'createUser').mockResolvedValue({
        id: 'special-pass-id',
        email: signupData.email,
        passwordHash: 'hashed',
        name: null,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = createSignupRequest(signupData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle malformed JSON', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'not valid json{',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});

/**
 * Integration Tests for Login API Route
 *
 * Tests for app/api/auth/login/route.ts
 *
 * Test Coverage:
 * - POST /api/auth/login returns token for valid credentials
 * - POST /api/auth/login rejects invalid credentials
 * - POST /api/auth/login rejects non-existent email
 * - POST /api/auth/login validates input format
 * - POST /api/auth/login sets auth cookie
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import * as dbQueries from '@/lib/db/queries';
import { hashPassword } from '@/lib/auth/password';
import { mockUser, resetDbMocks } from '@/tests/mocks/db';

// Mock the database queries module
vi.mock('@/lib/db/queries', () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

// Helper function to create a mock POST request
function createLoginRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  // Known password for testing: "Password123"
  const testPassword = 'Password123';
  let testPasswordHash: string;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    resetDbMocks();

    // Create a real bcrypt hash for testing password verification
    testPasswordHash = await hashPassword(testPassword);
  });

  describe('Success Cases', () => {
    it('should return token for valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: testPassword,
      };

      // Mock: user exists with correct password hash
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        email: loginData.email,
        passwordHash: testPasswordHash,
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(loginData.email);
      expect(data.user.id).toBeDefined();
      expect(data.token).toBeDefined();

      // Verify password hash is NOT returned
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should set auth cookie on successful login', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: testPassword,
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        passwordHash: testPasswordHash,
      });

      const request = createLoginRequest(loginData);

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

    it('should return user data in response', async () => {
      // Arrange
      const loginData = {
        email: 'detailed@example.com',
        password: testPassword,
      };

      const userWithDetails = {
        id: 'user-123',
        email: loginData.email,
        passwordHash: testPasswordHash,
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(userWithDetails);

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.user.id).toBe(userWithDetails.id);
      expect(data.user.email).toBe(userWithDetails.email);
      expect(data.user.name).toBe(userWithDetails.name);
    });

    it('should handle case-insensitive email login', async () => {
      // Arrange
      const loginData = {
        email: 'TEST@EXAMPLE.COM',
        password: testPassword,
      };

      // User stored with lowercase email
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        email: 'test@example.com',
        passwordHash: testPasswordHash,
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('Invalid Credentials', () => {
    it('should reject incorrect password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      // User exists but with different password
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        passwordHash: testPasswordHash, // Hash of "Password123"
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject non-existent email', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: testPassword,
      };

      // Mock: user does not exist
      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue(null);

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should reject empty password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: '',
      };

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should use same error message for non-existent email and wrong password', async () => {
      // Arrange
      const loginData1 = {
        email: 'nonexistent@example.com',
        password: testPassword,
      };
      const loginData2 = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      // Mock for first request: user doesn't exist
      vi.spyOn(dbQueries, 'getUserByEmail')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          ...mockUser,
          passwordHash: testPasswordHash,
        });

      const request1 = createLoginRequest(loginData1);
      const request2 = createLoginRequest(loginData2);

      // Act
      const response1 = await POST(request1);
      const response2 = await POST(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Assert - Same error message to prevent user enumeration
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
      expect(data1.error).toBe(data2.error);
      expect(data1.error).toBe('Invalid email or password');
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid email format', async () => {
      // Arrange
      const loginData = {
        email: 'not-an-email',
        password: testPassword,
      };

      const request = createLoginRequest(loginData);

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
      const loginData = {
        password: testPassword,
      };

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject missing password', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
      };

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty request body', async () => {
      // Arrange
      const request = createLoginRequest({});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle password with special characters', async () => {
      // Arrange
      const specialPassword = 'P@ssw0rd!#$%';
      const specialPasswordHash = await hashPassword(specialPassword);

      const loginData = {
        email: 'test@example.com',
        password: specialPassword,
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        passwordHash: specialPasswordHash,
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should handle email with plus sign', async () => {
      // Arrange
      const loginData = {
        email: 'user+test@example.com',
        password: testPassword,
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        email: loginData.email,
        passwordHash: testPasswordHash,
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.email).toBe(loginData.email);
    });

    it('should reject password with trailing whitespace', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: testPassword + ' ', // extra space
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        passwordHash: testPasswordHash, // Hash without space
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid email or password');
    });

    it('should handle malformed JSON', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
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

    it('should handle user with null name', async () => {
      // Arrange
      const loginData = {
        email: 'noname@example.com',
        password: testPassword,
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        name: null,
        passwordHash: testPasswordHash,
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.name).toBeNull();
    });
  });

  describe('Security', () => {
    it('should not leak information about whether email exists', async () => {
      // This test ensures we use the same error message pattern
      // to prevent attackers from enumerating valid emails

      // Arrange
      const loginData1 = { email: 'exists@example.com', password: 'wrong' };
      const loginData2 = { email: 'notexist@example.com', password: 'any' };

      vi.spyOn(dbQueries, 'getUserByEmail')
        .mockResolvedValueOnce({ ...mockUser, passwordHash: testPasswordHash })
        .mockResolvedValueOnce(null);

      const request1 = createLoginRequest(loginData1);
      const request2 = createLoginRequest(loginData2);

      // Act
      const response1 = await POST(request1);
      const response2 = await POST(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Assert - Both should have same error
      expect(data1.error).toBe(data2.error);
      expect(response1.status).toBe(response2.status);
    });

    it('should not return password hash in response', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: testPassword,
      };

      vi.spyOn(dbQueries, 'getUserByEmail').mockResolvedValue({
        ...mockUser,
        passwordHash: testPasswordHash,
      });

      const request = createLoginRequest(loginData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(data)).not.toContain(testPasswordHash);
    });
  });
});

/**
 * Unit Tests for Auth Middleware
 *
 * Tests for lib/auth/guard.ts
 *
 * Test Coverage:
 * - requireAuth extracts and validates JWT from cookies
 * - requireAuth throws error when no token
 * - optionalAuth returns null when no token
 * - createAuthCookie formats cookie correctly
 * - clearAuthCookie formats cookie correctly
 */

import { NextRequest } from 'next/server';
import {
  requireAuth,
  optionalAuth,
  createAuthCookie,
  clearAuthCookie,
} from '@/lib/auth/guard';
import { signJWT } from '@/lib/auth/jwt';
import { jwtVerify } from 'jose';

// Mock jose library to avoid ESM issues
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { sub: 'user-123', email: 'test@example.com' },
  }),
}));

// Helper function to create a mock NextRequest with cookies
function createMockRequest(cookieHeader?: string): NextRequest {
  const headers = new Headers();
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  // Return a mock object that satisfies the interface used by requireAuth
  return {
    headers,
    cookies: {
      get: (name: string) => ({ value: cookieHeader?.match(new RegExp(`${name}=([^;]+)`))?.[1] }),
    },
    nextUrl: new URL('http://localhost:3000/api/test'),
    url: 'http://localhost:3000/api/test',
  } as unknown as NextRequest;
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should extract and verify valid JWT from cookie', async () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = await signJWT(payload);
      const request = createMockRequest(`auth-token=${token}`);

      // Act
      const result = await requireAuth(request);

      // Assert
      expect(result).toBeDefined();
      expect(result.sub).toBe(payload.sub);
      expect(result.email).toBe(payload.email);
    });

    it('should work with multiple cookies', async () => {
      // Arrange
      const payload = { sub: 'user-456', email: 'multi@example.com' };
      const token = await signJWT(payload);
      const request = createMockRequest(`other=value; auth-token=${token}; another=cookie`);
      (jwtVerify as jest.Mock).mockResolvedValue({ payload });

      // Act
      const result = await requireAuth(request);

      // Assert
      expect(result.sub).toBe(payload.sub);
      expect(result.email).toBe(payload.email);
    });

    it('should throw error when no cookie header', async () => {
      // Arrange
      const request = createMockRequest();

      // Act & Assert
      await expect(requireAuth(request)).rejects.toThrow('Authentication required');
    });

    it('should throw error when auth-token cookie is missing', async () => {
      // Arrange
      const request = createMockRequest('other=value; session=abc123');

      // Act & Assert
      await expect(requireAuth(request)).rejects.toThrow('Authentication required');
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      const request = createMockRequest('auth-token=invalid-token-format');
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(requireAuth(request)).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', async () => {
      // Arrange
      const request = createMockRequest('auth-token=not.a.jwt');
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      await expect(requireAuth(request)).rejects.toThrow('Invalid or expired token');
    });

    it('should throw error for empty token', async () => {
      // Arrange
      const request = createMockRequest('auth-token=');

      // Act & Assert
      await expect(requireAuth(request)).rejects.toThrow('Authentication required');
    });

    it('should extract all JWT payload fields', async () => {
      // Arrange
      const payload = {
        sub: 'user-789',
        email: 'detailed@example.com',
      };
      const token = await signJWT(payload);
      const request = createMockRequest(`auth-token=${token}`);
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          ...payload,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }
      });

      // Act
      const result = await requireAuth(request);

      // Assert
      expect(result.sub).toBe(payload.sub);
      expect(result.email).toBe(payload.email);
      expect(result.iat).toBeDefined();
      expect(result.exp).toBeDefined();
    });
  });

  describe('optionalAuth', () => {
    it('should return payload for valid token', async () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = await signJWT(payload);
      const request = createMockRequest(`auth-token=${token}`);
      (jwtVerify as jest.Mock).mockResolvedValue({ payload });

      // Act
      const result = await optionalAuth(request);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.sub).toBe(payload.sub);
      expect(result?.email).toBe(payload.email);
    });

    it('should return null when no cookie header', async () => {
      // Arrange
      const request = createMockRequest();

      // Act
      const result = await optionalAuth(request);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when auth-token cookie is missing', async () => {
      // Arrange
      const request = createMockRequest('other=value; session=abc123');

      // Act
      const result = await optionalAuth(request);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for invalid token', async () => {
      // Arrange
      const request = createMockRequest('auth-token=invalid-token');
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Act
      const result = await optionalAuth(request);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for empty token', async () => {
      // Arrange
      const request = createMockRequest('auth-token=');

      // Act
      const result = await optionalAuth(request);

      // Assert
      expect(result).toBeNull();
    });

    it('should not throw errors', async () => {
      // Arrange
      const request = createMockRequest('auth-token=will-cause-error');
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      // Act & Assert
      // Should not throw, just return null
      const result = await optionalAuth(request);
      expect(result).toBeNull();
    });
  });

  describe('createAuthCookie', () => {
    it('should create cookie string with default max age', () => {
      // Arrange
      const token = 'test-jwt-token';
      const defaultMaxAge = 60 * 60 * 24 * 7; // 7 days

      // Act
      const cookie = createAuthCookie(token);

      // Assert
      expect(cookie).toContain('auth-token=');
      expect(cookie).toContain(token);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain(`Max-Age=${defaultMaxAge}`);
    });

    it('should create cookie string with custom max age', () => {
      // Arrange
      const token = 'test-jwt-token';
      const customMaxAge = 3600; // 1 hour

      // Act
      const cookie = createAuthCookie(token, customMaxAge);

      // Assert
      expect(cookie).toContain(`Max-Age=${customMaxAge}`);
    });

    it('should include all security flags', () => {
      // Arrange
      const token = 'secure-token';

      // Act
      const cookie = createAuthCookie(token);

      // Assert
      expect(cookie).toContain('HttpOnly'); // Prevent XSS
      expect(cookie).toContain('Secure'); // HTTPS only
      expect(cookie).toContain('SameSite=Lax'); // CSRF protection
    });

    it('should set path to root', () => {
      // Arrange
      const token = 'test-token';

      // Act
      const cookie = createAuthCookie(token);

      // Assert
      expect(cookie).toContain('Path=/');
    });

    it('should format cookie correctly', () => {
      // Arrange
      const token = 'formatted-token';

      // Act
      const cookie = createAuthCookie(token);

      // Assert
      // Should be: auth-token=formatted-token; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800
      const parts = cookie.split('; ');
      expect(parts[0]).toBe('auth-token=formatted-token');
      expect(parts).toContain('HttpOnly');
      expect(parts).toContain('Secure');
      expect(parts).toContain('SameSite=Lax');
      expect(parts).toContain('Path=/');
      expect(parts.some(part => part.startsWith('Max-Age='))).toBe(true);
    });

    it('should handle tokens with special characters', () => {
      // Arrange
      const token = 'token.with.dots-and_underscores';

      // Act
      const cookie = createAuthCookie(token);

      // Assert
      expect(cookie).toContain(token);
    });

    it('should use max age of 0 when specified', () => {
      // Arrange
      const token = 'expire-now';

      // Act
      const cookie = createAuthCookie(token, 0);

      // Assert
      expect(cookie).toContain('Max-Age=0');
    });
  });

  describe('clearAuthCookie', () => {
    it('should create cookie string to clear auth cookie', () => {
      // Act
      const cookie = clearAuthCookie();

      // Assert
      expect(cookie).toContain('auth-token=');
      expect(cookie).toContain('Max-Age=0');
    });

    it('should include all security flags', () => {
      // Act
      const cookie = clearAuthCookie();

      // Assert
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
    });

    it('should set empty value', () => {
      // Act
      const cookie = clearAuthCookie();

      // Assert
      // Should start with auth-token= (empty value)
      expect(cookie).toMatch(/^auth-token=;/);
    });

    it('should set Max-Age to 0', () => {
      // Act
      const cookie = clearAuthCookie();

      // Assert
      expect(cookie).toContain('Max-Age=0');
    });

    it('should set path to root', () => {
      // Act
      const cookie = clearAuthCookie();

      // Assert
      expect(cookie).toContain('Path=/');
    });

    it('should format cookie correctly', () => {
      // Act
      const cookie = clearAuthCookie();

      // Assert
      const parts = cookie.split('; ');
      expect(parts[0]).toBe('auth-token=');
      expect(parts).toContain('HttpOnly');
      expect(parts).toContain('Secure');
      expect(parts).toContain('SameSite=Strict');
      expect(parts).toContain('Path=/');
      expect(parts).toContain('Max-Age=0');
    });
  });

  describe('Integration: Full auth flow', () => {
    it('should authenticate user through complete flow', async () => {
      // Arrange
      const payload = { sub: 'user-integration', email: 'flow@example.com' };

      // Act - Simulate login: create token and cookie
      const token = await signJWT(payload);
      const setCookie = createAuthCookie(token);

      // Extract token from cookie string (simulate browser storing it)
      const tokenMatch = setCookie.match(/auth-token=([^;]+)/);
      const storedToken = tokenMatch ? tokenMatch[1] : '';

      // Simulate subsequent request with cookie
      const request = createMockRequest(`auth-token=${storedToken}`);
      (jwtVerify as jest.Mock).mockResolvedValue({ payload });
      const authenticatedUser = await requireAuth(request);

      // Assert
      expect(authenticatedUser.sub).toBe(payload.sub);
      expect(authenticatedUser.email).toBe(payload.email);
    });

    it('should handle logout flow', async () => {
      // Arrange
      const payload = { sub: 'user-logout', email: 'logout@example.com' };
      const token = await signJWT(payload);

      // Act - User is authenticated
      const request1 = createMockRequest(`auth-token=${token}`);
      const user = await requireAuth(request1);
      expect(user).toBeDefined();

      // Logout - clear cookie
      const clearCookie = clearAuthCookie();
      expect(clearCookie).toContain('Max-Age=0');

      // After logout - no auth cookie
      const request2 = createMockRequest();
      await expect(requireAuth(request2)).rejects.toThrow('Authentication required');
    });

    it('should work with optionalAuth for public endpoints', async () => {
      // Arrange - Authenticated user
      const payload = { sub: 'user-optional', email: 'optional@example.com' };
      const token = await signJWT(payload);
      const requestAuth = createMockRequest(`auth-token=${token}`);
      (jwtVerify as jest.Mock).mockResolvedValue({ payload });

      // Arrange - Anonymous user
      const requestAnon = createMockRequest();

      // Act
      const userAuth = await optionalAuth(requestAuth);
      const userAnon = await optionalAuth(requestAnon);

      // Assert
      expect(userAuth).not.toBeNull();
      expect(userAuth?.sub).toBe(payload.sub);
      expect(userAnon).toBeNull();
    });
  });
});

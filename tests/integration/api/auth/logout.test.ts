/**
 * Integration Tests for Logout API Route
 *
 * Tests for app/api/auth/logout/route.ts
 *
 * Test Coverage:
 * - POST /api/auth/logout clears auth cookie
 * - POST /api/auth/logout returns success message
 * - POST /api/auth/logout works without authentication
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/logout/route';
import { NextRequest } from 'next/server';
import { signJWT } from '@/lib/auth/jwt';

// Helper function to create a mock POST request
function createLogoutRequest(cookieHeader?: string): NextRequest {
  const headers = new Headers();
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  return new NextRequest('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/auth/logout', () => {
  describe('Success Cases', () => {
    it('should return success message', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });

    it('should clear auth cookie', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toBeDefined();
      expect(setCookieHeader).toContain('auth_token=');
      expect(setCookieHeader).toContain('Max-Age=0');
    });

    it('should set cookie to expire immediately', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('Max-Age=0');
    });

    it('should include security flags in clear cookie', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('SameSite=Strict');
    });

    it('should set cookie path to root', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('Path=/');
    });

    it('should work when user is already authenticated', async () => {
      // Arrange
      const payload = { sub: 'user-123', email: 'test@example.com' };
      const token = await signJWT(payload);
      const request = createLogoutRequest(`auth_token=${token}`);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');

      // Verify cookie is cleared
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('Max-Age=0');
    });

    it('should work when user is not authenticated', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      // Logout should still succeed even if not authenticated
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });

    it('should work with invalid token in cookie', async () => {
      // Arrange
      const request = createLogoutRequest('auth_token=invalid-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      // Should still clear the cookie and return success
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');

      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('Max-Age=0');
    });

    it('should work with multiple cookies present', async () => {
      // Arrange
      const payload = { sub: 'user-456', email: 'multi@example.com' };
      const token = await signJWT(payload);
      const request = createLogoutRequest(`session=xyz; auth_token=${token}; other=value`);

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('auth_token=');
      expect(setCookieHeader).toContain('Max-Age=0');
    });
  });

  describe('Response Format', () => {
    it('should return JSON response', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);
      const contentType = response.headers.get('Content-Type');

      // Assert
      expect(contentType).toContain('application/json');
    });

    it('should have message property in response', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty('message');
      expect(typeof data.message).toBe('string');
    });

    it('should return specific success message', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.message).toBe('Logged out successfully');
    });
  });

  describe('Cookie Clearing Details', () => {
    it('should set empty value for auth_token', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      // Cookie value should be empty (auth_token=; ...)
      expect(setCookieHeader).toMatch(/^auth_token=;/);
    });

    it('should format clear cookie correctly', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      const parts = setCookieHeader?.split('; ') || [];

      expect(parts[0]).toBe('auth_token=');
      expect(parts).toContain('HttpOnly');
      expect(parts).toContain('Secure');
      expect(parts).toContain('SameSite=Strict');
      expect(parts).toContain('Path=/');
      expect(parts).toContain('Max-Age=0');
    });

    it('should not include any token value', async () => {
      // Arrange
      const payload = { sub: 'user-789', email: 'test@example.com' };
      const token = await signJWT(payload);
      const request = createLogoutRequest(`auth_token=${token}`);

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');
      // Should not contain the old token
      expect(setCookieHeader).not.toContain(token);
      expect(setCookieHeader).toMatch(/^auth_token=;/);
    });
  });

  describe('Idempotency', () => {
    it('should be idempotent - multiple logouts should work', async () => {
      // Arrange
      const request1 = createLogoutRequest();
      const request2 = createLogoutRequest();

      // Act
      const response1 = await POST(request1);
      const response2 = await POST(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(data1.message).toBe(data2.message);
    });

    it('should always return same response structure', async () => {
      // Arrange
      const requests = [
        createLogoutRequest(),
        createLogoutRequest('auth_token=some-token'),
        createLogoutRequest('other=value'),
      ];

      // Act
      const responses = await Promise.all(requests.map(req => POST(req)));
      const dataList = await Promise.all(responses.map(res => res.json()));

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      dataList.forEach(data => {
        expect(data.message).toBe('Logged out successfully');
      });
    });
  });

  describe('Security', () => {
    it('should not require authentication to logout', async () => {
      // This is intentional - logout should work even if token is invalid/missing
      // This prevents users from being stuck in a logged-in state

      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(200);
    });

    it('should clear cookie with proper security attributes', async () => {
      // Arrange
      const request = createLogoutRequest();

      // Act
      const response = await POST(request);

      // Assert
      const setCookieHeader = response.headers.get('Set-Cookie');

      // Security checks
      expect(setCookieHeader).toContain('HttpOnly'); // Prevent XSS
      expect(setCookieHeader).toContain('Secure'); // HTTPS only
      expect(setCookieHeader).toContain('SameSite=Strict'); // CSRF protection
    });

    it('should work even with malformed cookie header', async () => {
      // Arrange
      const request = createLogoutRequest('malformed cookie header;;;');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cookie header', async () => {
      // Arrange
      const request = createLogoutRequest('');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });

    it('should handle request without any headers', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });

    it('should complete successfully even if cookie is already expired', async () => {
      // Arrange
      // Simulate a request where the cookie is already expired
      const request = createLogoutRequest('auth_token=expired-token');

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });
  });

  describe('Integration: Full Logout Flow', () => {
    it('should clear valid session cookie', async () => {
      // Arrange - Simulate user logging in and getting a token
      const payload = { sub: 'user-integration', email: 'flow@example.com' };
      const token = await signJWT(payload);

      // User has valid session
      const request = createLogoutRequest(`auth_token=${token}`);

      // Act - User logs out
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');

      // Cookie should be cleared
      const setCookieHeader = response.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('Max-Age=0');
      expect(setCookieHeader).not.toContain(token);
    });

    it('should allow logout without breaking if user is already logged out', async () => {
      // Arrange - User is already logged out (no cookie)
      const request = createLogoutRequest();

      // Act - User tries to logout again
      const response = await POST(request);
      const data = await response.json();

      // Assert - Should still work gracefully
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logged out successfully');
    });
  });
});

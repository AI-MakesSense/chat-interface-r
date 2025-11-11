/**
 * Tests for Auth Helper Functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/helpers';
import { requireAuth } from '@/lib/auth/middleware';

// Mock the auth module
vi.mock('@/lib/auth/middleware');

describe('Auth Helpers', () => {
  const mockRequireAuth = vi.mocked(requireAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAuthenticatedUserId', () => {
    it('should extract userId from test mock format', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test.com/api/test');
      const mockUser = { userId: 'test-user-123' };
      mockRequireAuth.mockResolvedValue(mockUser);

      // Act
      const userId = await getAuthenticatedUserId(mockRequest);

      // Assert
      expect(userId).toBe('test-user-123');
      expect(mockRequireAuth).toHaveBeenCalledWith(mockRequest);
    });

    it('should extract sub from real JWT format', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test.com/api/test');
      const mockUser = { sub: 'jwt-user-456' };
      mockRequireAuth.mockResolvedValue(mockUser);

      // Act
      const userId = await getAuthenticatedUserId(mockRequest);

      // Assert
      expect(userId).toBe('jwt-user-456');
      expect(mockRequireAuth).toHaveBeenCalledWith(mockRequest);
    });

    it('should prefer userId over sub when both are present', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test.com/api/test');
      const mockUser = { userId: 'test-user-789', sub: 'jwt-user-999' };
      mockRequireAuth.mockResolvedValue(mockUser);

      // Act
      const userId = await getAuthenticatedUserId(mockRequest);

      // Assert
      expect(userId).toBe('test-user-789');
    });

    it('should throw error when no user ID can be extracted', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test.com/api/test');
      const mockUser = {}; // No userId or sub
      mockRequireAuth.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(getAuthenticatedUserId(mockRequest)).rejects.toThrow(
        'Unable to extract user ID from authentication token'
      );
    });

    it('should propagate authentication errors', async () => {
      // Arrange
      const mockRequest = new NextRequest('http://test.com/api/test');
      const authError = new Error('Authentication failed');
      mockRequireAuth.mockRejectedValue(authError);

      // Act & Assert
      await expect(getAuthenticatedUserId(mockRequest)).rejects.toThrow('Authentication failed');
    });
  });
});
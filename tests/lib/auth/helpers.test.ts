/**
 * Tests for Auth Helper Functions
 */

import { NextRequest } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/helpers';
import { requireAuth } from '@/lib/auth/guard';

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

// Mock the auth module
jest.mock('@/lib/auth/middleware');

describe('Auth Helpers', () => {
  const mockRequireAuth = jest.mocked(requireAuth);

  beforeEach(() => {
    jest.clearAllMocks();
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
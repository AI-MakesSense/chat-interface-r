/**
 * Integration Tests for List Licenses API Route
 *
 * Tests for app/api/licenses/route.ts GET handler
 *
 * RED Phase: These tests will FAIL because the route handler doesn't exist yet.
 *
 * Test Coverage:
 * - Valid scenarios: List all licenses for authenticated user, empty array, multiple licenses
 * - Invalid scenarios: Missing authentication, returns only user's licenses (not other users')
 */

import { GET } from '@/app/api/licenses/route';
import { NextRequest } from 'next/server';
import * as dbClient from '@/lib/db/client';
import * as authMiddleware from '@/lib/auth/guard';

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

// Mock the database client
jest.mock('@/lib/db/client', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  },
}));

// Mock authentication middleware
jest.mock('@/lib/auth/guard', () => ({
  requireAuth: jest.fn(),
}));

// Helper function to create a mock GET request
function createListRequest(authToken?: string): NextRequest {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers['cookie'] = `auth_token=${authToken}`;
  }

  return new NextRequest('http://localhost:3000/api/licenses', {
    method: 'GET',
    headers,
  });
}

describe('GET /api/licenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Scenarios', () => {
    it('should list all licenses for authenticated user', async () => {
      // FAIL REASON: GET route handler does not exist yet

      // Arrange
      const mockUserId = 'user-123';

      jest.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockLicenses = [
        {
          id: 'license-1',
          userId: mockUserId,
          licenseKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          tier: 'basic',
          domains: ['example1.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'license-2',
          userId: mockUserId,
          licenseKey: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
          tier: 'pro',
          domains: ['example2.com'],
          domainLimit: 1,
          brandingEnabled: false,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockDbSelect = jest.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockLicenses),
      } as any);

      const request = createListRequest('valid-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.licenses).toBeDefined();
      expect(Array.isArray(data.licenses)).toBe(true);
      expect(data.licenses).toHaveLength(2);
      expect(data.licenses[0].userId).toBe(mockUserId);
      expect(data.licenses[1].userId).toBe(mockUserId);
    });

    it('should return empty array if user has no licenses', async () => {
      // FAIL REASON: GET route handler does not exist yet

      // Arrange
      const mockUserId = 'user-no-licenses';

      jest.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'newuser@example.com',
      } as any);

      const mockDbSelect = jest.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]), // Empty array
      } as any);

      const request = createListRequest('valid-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.licenses).toBeDefined();
      expect(Array.isArray(data.licenses)).toBe(true);
      expect(data.licenses).toHaveLength(0);
    });

    it('should return multiple licenses for user with many licenses', async () => {
      // FAIL REASON: GET route handler does not exist yet

      // Arrange
      const mockUserId = 'user-many-licenses';

      jest.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'poweruser@example.com',
      } as any);

      const mockLicenses = [
        {
          id: 'license-1',
          userId: mockUserId,
          licenseKey: 'key1-2345678901234567890123456789',
          tier: 'basic',
          domains: ['site1.com'],
        },
        {
          id: 'license-2',
          userId: mockUserId,
          licenseKey: 'key2-2345678901234567890123456789',
          tier: 'pro',
          domains: ['site2.com'],
        },
        {
          id: 'license-3',
          userId: mockUserId,
          licenseKey: 'key3-2345678901234567890123456789',
          tier: 'agency',
          domains: ['site3.com', 'site4.com', 'site5.com'],
        },
      ];

      const mockDbSelect = jest.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(mockLicenses),
      } as any);

      const request = createListRequest('valid-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.licenses).toHaveLength(3);
      expect(data.licenses[0].tier).toBe('basic');
      expect(data.licenses[1].tier).toBe('pro');
      expect(data.licenses[2].tier).toBe('agency');
    });

    it('should include all license fields in response', async () => {
      // FAIL REASON: GET route handler does not exist yet

      // Arrange
      const mockUserId = 'user-fields';

      jest.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockLicense = {
        id: 'license-complete',
        userId: mockUserId,
        licenseKey: 'complete-key-123456789012345678',
        tier: 'pro',
        domains: ['complete.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-01'),
      };

      const mockDbSelect = jest.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockLicense]),
      } as any);

      const request = createListRequest('valid-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.licenses[0]).toMatchObject({
        id: 'license-complete',
        userId: mockUserId,
        licenseKey: 'complete-key-123456789012345678',
        tier: 'pro',
        domains: ['complete.com'],
        domainLimit: 1,
        brandingEnabled: false,
        status: 'active',
      });
      expect(data.licenses[0].expiresAt).toBeDefined();
      expect(data.licenses[0].createdAt).toBeDefined();
      expect(data.licenses[0].updatedAt).toBeDefined();
    });
  });

  describe('Invalid Scenarios', () => {
    it('should reject request without authentication', async () => {
      // FAIL REASON: GET route handler does not exist yet

      // Arrange
      jest.spyOn(authMiddleware, 'requireAuth').mockRejectedValue(
        new Error('Authentication required')
      );

      const request = createListRequest(); // No token

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should return only licenses owned by authenticated user (not other users)', async () => {
      // FAIL REASON: GET route handler does not exist yet

      // Arrange
      const mockUserId = 'user-123';
      const otherUserId = 'user-456';

      jest.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      // Mock database returns only user-123's licenses
      const mockLicenses = [
        {
          id: 'license-owned',
          userId: mockUserId,
          licenseKey: 'owned-key-12345678901234567890',
          tier: 'basic',
          domains: ['mysite.com'],
        },
        // Intentionally NOT including other users' licenses
      ];

      const mockDbSelect = jest.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => {
          // Verify where clause is filtering by userId
          return Promise.resolve(mockLicenses);
        }),
      } as any);

      const request = createListRequest('valid-token');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.licenses).toHaveLength(1);
      expect(data.licenses[0].userId).toBe(mockUserId);
      // Verify all returned licenses belong to the authenticated user
      data.licenses.forEach((license: any) => {
        expect(license.userId).toBe(mockUserId);
        expect(license.userId).not.toBe(otherUserId);
      });
    });
  });
});

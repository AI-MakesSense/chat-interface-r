/**
 * Integration Tests for Update License API Route
 *
 * Tests for app/api/licenses/[id]/route.ts PATCH handler
 *
 * RED Phase: These tests will FAIL because the route handler doesn't exist yet.
 *
 * Test Coverage:
 * - Valid scenarios: Update domains, status, expiresAt, multiple fields, domain normalization
 * - Invalid scenarios: Missing auth, license not owned by user (403), not found (404), invalid body, empty update
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PATCH } from '@/app/api/licenses/[id]/route';
import { NextRequest } from 'next/server';
import * as dbClient from '@/lib/db/client';
import * as authMiddleware from '@/lib/auth/middleware';
import * as licenseDomain from '@/lib/license/domain';

// Mock the database client
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn(),
  },
}));

// Mock authentication middleware
vi.mock('@/lib/auth/middleware', () => ({
  requireAuth: vi.fn(),
}));

// Mock domain normalization
vi.mock('@/lib/license/domain', () => ({
  normalizeDomain: vi.fn((domain: string) => domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')),
  isValidDomain: vi.fn((domain: string) => domain.length > 0 && domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.')),
}));

// Helper function to create a mock PATCH request
function createUpdateRequest(licenseId: string, body: any, authToken?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['cookie'] = `auth_token=${authToken}`;
  }

  return new NextRequest(`http://localhost:3000/api/licenses/${licenseId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
}

// Context object for dynamic route parameters
const createContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

describe('PATCH /api/licenses/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Scenarios', () => {
    it('should update license domains', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-123';
      const mockUserId = 'user-123';
      const updateData = {
        domains: ['new-domain.com'],
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      // Mock license fetch (verify ownership)
      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          licenseKey: 'existing-key-1234567890123456789',
          tier: 'basic',
          domains: ['old-domain.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      // Mock license update
      const mockDbUpdate = vi.spyOn(dbClient.db, 'update');
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          licenseKey: 'existing-key-1234567890123456789',
          tier: 'basic',
          domains: ['new-domain.com'],
          domainLimit: 1,
          brandingEnabled: true,
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.license).toBeDefined();
      expect(data.license.domains).toEqual(['new-domain.com']);
    });

    it('should update license status', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-456';
      const mockUserId = 'user-456';
      const updateData = {
        status: 'cancelled',
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          tier: 'pro',
          status: 'active',
        }]),
      } as any);

      const mockDbUpdate = vi.spyOn(dbClient.db, 'update');
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          tier: 'pro',
          status: 'cancelled',
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.license.status).toBe('cancelled');
    });

    it('should update license expiresAt', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-789';
      const mockUserId = 'user-789';
      const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      const updateData = {
        expiresAt: futureDate.toISOString(),
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }]),
      } as any);

      const mockDbUpdate = vi.spyOn(dbClient.db, 'update');
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          expiresAt: futureDate,
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.license.expiresAt).toBeDefined();
    });

    it('should update multiple fields at once', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-multi';
      const mockUserId = 'user-multi';
      const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      const updateData = {
        domains: ['multi-domain.com'],
        status: 'active',
        expiresAt: futureDate.toISOString(),
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          tier: 'basic',
          domains: ['old-domain.com'],
          status: 'expired',
        }]),
      } as any);

      const mockDbUpdate = vi.spyOn(dbClient.db, 'update');
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          tier: 'basic',
          domains: ['multi-domain.com'],
          status: 'active',
          expiresAt: futureDate,
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.license.domains).toEqual(['multi-domain.com']);
      expect(data.license.status).toBe('active');
      expect(data.license.expiresAt).toBeDefined();
    });

    it('should normalize domains on update', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-normalize';
      const mockUserId = 'user-normalize';
      const updateData = {
        domains: ['HTTPS://WWW.Normalized.COM'],
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const normalizeSpy = vi.spyOn(licenseDomain, 'normalizeDomain');

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          tier: 'basic',
          domains: ['old-domain.com'],
        }]),
      } as any);

      const mockDbUpdate = vi.spyOn(dbClient.db, 'update');
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
          tier: 'basic',
          domains: ['normalized.com'],
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(normalizeSpy).toHaveBeenCalled();
      expect(data.license.domains).toContain('normalized.com');
    });
  });

  describe('Invalid Scenarios', () => {
    it('should reject request without authentication', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-no-auth';
      const updateData = {
        status: 'active',
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockRejectedValue(
        new Error('Authentication required')
      );

      const request = createUpdateRequest(licenseId, updateData); // No token
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject update to license not owned by user (403 Forbidden)', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-not-owned';
      const mockUserId = 'user-123';
      const updateData = {
        status: 'active',
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      // Mock license fetch - license belongs to different user
      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: 'different-user-456', // Different user
          tier: 'basic',
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should return 404 for non-existent license', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-not-found';
      const mockUserId = 'user-123';
      const updateData = {
        status: 'active',
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      // Mock license fetch - no license found
      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // Empty array
      } as any);

      const request = createUpdateRequest(licenseId, updateData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('License not found');
    });

    it('should reject invalid request body (schema validation fails)', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-invalid';
      const mockUserId = 'user-123';
      const invalidData = {
        status: 'invalid-status', // Not 'active', 'cancelled', or 'expired'
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, invalidData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty update object', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-empty';
      const mockUserId = 'user-123';
      const emptyData = {}; // No fields to update

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const request = createUpdateRequest(licenseId, emptyData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject expiresAt in the past', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-past-date';
      const mockUserId = 'user-123';
      const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      const invalidData = {
        expiresAt: pastDate.toISOString(),
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, invalidData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject empty domains array', async () => {
      // FAIL REASON: PATCH route handler does not exist yet

      // Arrange
      const licenseId = 'license-empty-domains';
      const mockUserId = 'user-123';
      const invalidData = {
        domains: [], // Empty array
      };

      vi.spyOn(authMiddleware, 'requireAuth').mockResolvedValue({
        userId: mockUserId,
        email: 'test@example.com',
      } as any);

      const mockDbSelect = vi.spyOn(dbClient.db, 'select');
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: licenseId,
          userId: mockUserId,
        }]),
      } as any);

      const request = createUpdateRequest(licenseId, invalidData, 'valid-token');
      const context = createContext(licenseId);

      // Act
      const response = await PATCH(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });
});

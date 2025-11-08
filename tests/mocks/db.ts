/**
 * Database Mocks for Testing
 *
 * Purpose: Mock database queries to avoid real database calls in unit tests
 * Use these mocks with vi.mock() in your tests
 */

import { vi } from 'vitest';
import type { User } from '@/lib/db/schema';

// Mock user data for testing
export const mockUser: User = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKKT.nW7Fu', // bcrypt hash of "Password123"
  name: 'Test User',
  emailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUser2: User = {
  id: 'test-user-id-456',
  email: 'test2@example.com',
  passwordHash: '$2a$12$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRS',
  name: 'Test User 2',
  emailVerified: false,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

// Mock database query functions
export const mockGetUserByEmail = vi.fn();
export const mockGetUserById = vi.fn();
export const mockCreateUser = vi.fn();
export const mockUpdateUser = vi.fn();

// Helper to reset all mocks
export function resetDbMocks() {
  mockGetUserByEmail.mockReset();
  mockGetUserById.mockReset();
  mockCreateUser.mockReset();
  mockUpdateUser.mockReset();
}

// Default implementations for common scenarios
export function setupDbMocksForSuccess() {
  mockGetUserByEmail.mockImplementation(async (email: string) => {
    if (email === mockUser.email) return mockUser;
    if (email === mockUser2.email) return mockUser2;
    return null;
  });

  mockGetUserById.mockImplementation(async (id: string) => {
    if (id === mockUser.id) return mockUser;
    if (id === mockUser2.id) return mockUser2;
    return null;
  });

  mockCreateUser.mockImplementation(async (data: any) => ({
    id: 'new-user-id',
    email: data.email,
    passwordHash: data.passwordHash,
    name: data.name || null,
    emailVerified: data.emailVerified || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  mockUpdateUser.mockImplementation(async (id: string, data: any) => {
    if (id === mockUser.id) {
      return { ...mockUser, ...data };
    }
    return null;
  });
}

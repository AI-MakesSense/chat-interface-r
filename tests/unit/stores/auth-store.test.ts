/**
 * Auth Store Tests (RED Phase)
 *
 * Tests for authentication state management.
 * These tests should FAIL initially as they expose missing functionality or bugs.
 *
 * Test Coverage:
 * - Initial state
 * - Login success/failure
 * - Signup success/failure
 * - Logout
 * - checkAuth with valid/invalid cookie
 * - localStorage persistence
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should fail - initial state should have null user', () => {
      // WHY THIS SHOULD FAIL: Testing that initial state is properly set
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Login', () => {
    it('should fail - login with valid credentials should set user and isAuthenticated', async () => {
      // WHY THIS SHOULD FAIL: Need to verify login flow works correctly
      const { login } = useAuthStore.getState();

      await login('test@example.com', 'Password123');

      const state = useAuthStore.getState();

      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should fail - login with invalid credentials should set error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify error handling
      const { login } = useAuthStore.getState();

      await expect(login('wrong@example.com', 'wrong')).rejects.toThrow();

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should fail - login should set isLoading during request', async () => {
      // WHY THIS SHOULD FAIL: Need to verify loading state management
      const { login } = useAuthStore.getState();

      // Start login (don't await yet)
      const loginPromise = login('test@example.com', 'Password123');

      // Check loading state immediately
      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;

      // Check loading state after completion
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should fail - login should clear previous error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify error is cleared on new attempt
      const { login } = useAuthStore.getState();

      // Set error from previous failed attempt
      useAuthStore.setState({ error: 'Previous error' });

      await login('test@example.com', 'Password123');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('Signup', () => {
    it('should fail - signup with valid data should create user', async () => {
      // WHY THIS SHOULD FAIL: Need to verify signup flow
      const { signup } = useAuthStore.getState();

      await signup({
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
      });

      const state = useAuthStore.getState();

      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('new@example.com');
      expect(state.user?.name).toBe('New User');
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should fail - signup with existing email should set error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify duplicate email handling
      const { signup } = useAuthStore.getState();

      await expect(
        signup({
          email: 'existing@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow();

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Email already exists');
    });

    it('should fail - signup without name should work', async () => {
      // WHY THIS SHOULD FAIL: Name is optional, should still succeed
      const { signup } = useAuthStore.getState();

      await signup({
        email: 'new@example.com',
        password: 'Password123',
      });

      const state = useAuthStore.getState();

      expect(state.user).not.toBeNull();
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should fail - logout should clear user and isAuthenticated', async () => {
      // WHY THIS SHOULD FAIL: Need to verify logout clears state
      const { login, logout } = useAuthStore.getState();

      // Login first
      await login('test@example.com', 'Password123');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Logout
      await logout();

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should fail - logout should clear state even if API fails', async () => {
      // WHY THIS SHOULD FAIL: Need to verify logout clears state even on error
      const { login, logout } = useAuthStore.getState();

      // Login first
      await login('test@example.com', 'Password123');

      // Mock logout failure
      server.use(
        http.post('/api/auth/logout', () => {
          return HttpResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
          );
        })
      );

      // Logout should still clear state
      await logout();

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should fail - checkAuth with valid session should restore user', async () => {
      // WHY THIS SHOULD FAIL: Need to verify session restoration
      const { checkAuth } = useAuthStore.getState();

      await checkAuth();

      const state = useAuthStore.getState();

      expect(state.user).not.toBeNull();
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should fail - checkAuth with invalid session should clear state', async () => {
      // WHY THIS SHOULD FAIL: Need to verify invalid session handling
      const { checkAuth } = useAuthStore.getState();

      // Mock invalid session
      server.use(
        http.get('/api/auth/me', () => {
          return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await checkAuth();

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull(); // Should not set error for auth check
    });

    it('should fail - checkAuth should not throw on network error', async () => {
      // WHY THIS SHOULD FAIL: Need to verify graceful error handling
      const { checkAuth } = useAuthStore.getState();

      // Mock network error
      server.use(
        http.get('/api/auth/me', () => {
          return HttpResponse.error();
        })
      );

      // Should not throw
      await expect(checkAuth()).resolves.not.toThrow();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('localStorage Persistence', () => {
    it('should fail - user data should persist to localStorage', async () => {
      // WHY THIS SHOULD FAIL: Need to verify persistence works
      const { login } = useAuthStore.getState();

      await login('test@example.com', 'Password123');

      // Check localStorage
      const stored = localStorage.getItem('auth-storage');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.user).not.toBeNull();
      expect(parsed.state.user.email).toBe('test@example.com');
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it('should fail - loading and error states should NOT persist', async () => {
      // WHY THIS SHOULD FAIL: Need to verify only relevant state persists
      const { login } = useAuthStore.getState();

      // Try to login with invalid credentials
      try {
        await login('wrong@example.com', 'wrong');
      } catch (e) {
        // Expected to fail
      }

      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.isLoading).toBeUndefined();
        expect(parsed.state.error).toBeUndefined();
      }
    });

    it('should fail - state should restore from localStorage on mount', () => {
      // WHY THIS SHOULD FAIL: Need to verify state restoration
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      // Manually set localStorage
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: mockUser,
            isAuthenticated: true,
          },
          version: 0,
        })
      );

      // Create new store instance (simulates remount)
      // Note: This test may fail because Zustand persist doesn't auto-hydrate in tests
      // We'll need to trigger hydration manually or use a different approach
      const state = useAuthStore.getState();

      // This might fail initially if hydration isn't working
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should fail - clearError should clear error state', () => {
      // WHY THIS SHOULD FAIL: Need to verify error clearing
      useAuthStore.setState({ error: 'Test error' });

      const { clearError } = useAuthStore.getState();
      clearError();

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });

    it('should fail - setUser should update user and isAuthenticated', () => {
      // WHY THIS SHOULD FAIL: Need to verify setUser works correctly
      const { setUser } = useAuthStore.getState();

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      };

      setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should fail - setUser with null should clear authentication', () => {
      // WHY THIS SHOULD FAIL: Need to verify setUser(null) clears auth
      const { setUser } = useAuthStore.getState();

      // Set user first
      setUser({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: false,
        createdAt: '2025-01-01T00:00:00.000Z',
      });

      // Clear user
      setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });
});

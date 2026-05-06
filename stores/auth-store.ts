/**
 * Authentication Store
 *
 * Zustand store for managing authentication state throughout the application.
 * Handles login, signup, logout, and session validation.
 *
 * Features:
 * - JWT token authentication (HTTP-only cookies)
 * - Automatic session restoration on mount via checkAuth()
 * - Error state management
 * - Loading states for async operations
 *
 * SECURITY NOTE:
 * User data is NOT persisted to localStorage to comply with GDPR/privacy requirements.
 * Session is restored on mount by validating the HTTP-only cookie via checkAuth().
 * This prevents XSS attacks and malicious browser extensions from accessing user data.
 */

import { create } from 'zustand';

/**
 * User object returned from authentication endpoints
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  isAdmin?: boolean;
}

/**
 * Signup form data structure
 */
export interface SignupData {
  email: string;
  password: string;
  name?: string;
  inviteCode?: string;
}

/**
 * Authentication state interface
 */
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

/**
 * Authentication store
 *
 * Manages user authentication state.
 * User data is NOT persisted to localStorage for security/privacy compliance.
 * Session is restored on mount via checkAuth() which validates the HTTP-only cookie.
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

      /**
       * Login user with email and password
       *
       * Calls POST /api/auth/login, stores JWT in HTTP-only cookie,
       * and saves user data to state.
       *
       * @param email - User email address
       * @param password - User password
       * @throws Error if credentials are invalid
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies in request
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      /**
       * Register new user account
       *
       * Calls POST /api/auth/signup, creates user in database,
       * sends verification email, and logs user in.
       *
       * @param data - Signup form data (email, password, name)
       * @throws Error if email already exists or validation fails
       */
      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Include cookies in request
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
          }

          const responseData = await response.json();

          set({
            user: responseData.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Signup failed',
          });
          throw error;
        }
      },

      /**
       * Logout current user
       *
       * Calls POST /api/auth/logout to clear HTTP-only cookie,
       * then clears local state and any persisted data.
       */
      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include', // Include cookies in request
          });

          if (!response.ok) {
            throw new Error('Logout failed');
          }

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // SECURITY: Clear any persisted auth data from localStorage
          localStorage.removeItem('auth-storage');
        } catch (error) {
          // Even if logout fails, clear local state and storage
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Logout failed',
          });

          // SECURITY: Clear localStorage even on error
          localStorage.removeItem('auth-storage');
        }
      },

      /**
       * Check authentication status
       *
       * Validates existing JWT cookie by calling GET /api/auth/me.
       * Called on app mount to restore session if valid cookie exists.
       */
      checkAuth: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch('/api/auth/me', {
            credentials: 'include', // Include cookies in request
          });

          if (!response.ok) {
            // No valid session, clear state
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            return;
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null, // Don't show error for failed auth check
          });
        }
      },

      /**
       * Clear error state
       *
       * Used to dismiss error messages in UI
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set user directly
       *
       * Used by middleware or other parts of the app to update user state
       */
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },
}));

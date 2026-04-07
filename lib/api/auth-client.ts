/**
 * Authentication API Client
 *
 * Client-side API wrapper for authentication endpoints.
 * Provides typed interfaces for login, signup, logout, and session validation.
 *
 * All functions handle HTTP-only cookies automatically via `credentials: 'include'`.
 * Errors are thrown with user-friendly messages for UI consumption.
 */

import type { User, SignupData } from '@/stores/auth-store';

/**
 * API response for successful authentication
 */
export interface AuthResponse {
  user: User;
  message?: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Base fetch wrapper with common options
 *
 * Automatically includes credentials (cookies) and handles JSON parsing
 */
async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include HTTP-only cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

/**
 * Login user with email and password
 *
 * Endpoint: POST /api/auth/login
 * Sets HTTP-only JWT cookie on success
 *
 * @param email - User email address
 * @param password - User password
 * @returns User object
 * @throws Error with message if credentials are invalid
 *
 * @example
 * const user = await authClient.login('user@example.com', 'password123');
 */
export async function login(email: string, password: string): Promise<User> {
  const response = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return response.user;
}

/**
 * Register new user account
 *
 * Endpoint: POST /api/auth/signup
 * Creates user, sends verification email, and logs user in
 *
 * @param data - Signup form data (email, password, optional name)
 * @returns User object
 * @throws Error if email already exists or validation fails
 *
 * @example
 * const user = await authClient.signup({
 *   email: 'user@example.com',
 *   password: 'securepassword',
 *   name: 'John Doe'
 * });
 */
export async function signup(data: SignupData): Promise<User> {
  const response = await apiFetch<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  return response.user;
}

/**
 * Logout current user
 *
 * Endpoint: POST /api/auth/logout
 * Clears HTTP-only JWT cookie
 *
 * @throws Error if logout request fails (rare)
 *
 * @example
 * await authClient.logout();
 */
export async function logout(): Promise<void> {
  await apiFetch<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}

/**
 * Check current authentication status
 *
 * Endpoint: GET /api/auth/me
 * Validates existing JWT cookie and returns user data
 *
 * @returns User object if authenticated, null if not
 *
 * @example
 * const user = await authClient.checkAuth();
 * if (user) {
 *   console.log('User is logged in:', user.email);
 * }
 */
export async function checkAuth(): Promise<User | null> {
  try {
    const response = await apiFetch<{ user: User }>('/api/auth/me', {
      method: 'GET',
    });
    return response.user;
  } catch (error) {
    // Not authenticated or session expired
    return null;
  }
}

/**
 * Auth client object for named exports
 */
export const authClient = {
  login,
  signup,
  logout,
  checkAuth,
};

export default authClient;

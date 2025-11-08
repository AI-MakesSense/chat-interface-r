/**
 * Authentication Middleware
 *
 * Purpose: Verify user authentication for protected routes
 * Responsibility: Extract and verify JWT from cookies, return user payload
 *
 * Usage:
 *   const user = await requireAuth(request);
 *   // If token is invalid, throws error (catch in route handler)
 */

import { NextRequest } from 'next/server';
import { verifyJWT, extractTokenFromCookie, type JWTPayload } from './jwt';

/**
 * Require authentication for a route
 *
 * Extracts JWT from cookie, verifies it, and returns the payload
 *
 * @param request - Next.js request object
 * @returns Decoded JWT payload with user info
 * @throws Error if not authenticated or token invalid
 */
export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
  // Get cookie header
  const cookieHeader = request.headers.get('cookie');

  // Extract token
  const token = extractTokenFromCookie(cookieHeader);

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // Verify and decode token
    const payload = await verifyJWT(token);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Optional authentication (doesn't throw if not authenticated)
 *
 * @param request - Next.js request object
 * @returns Decoded JWT payload or null if not authenticated
 */
export async function optionalAuth(request: NextRequest): Promise<JWTPayload | null> {
  try {
    return await requireAuth(request);
  } catch {
    return null;
  }
}

/**
 * Create an auth cookie string
 *
 * @param token - JWT token to store in cookie
 * @param maxAge - Cookie max age in seconds (default: 7 days)
 * @returns Cookie string for Set-Cookie header
 */
export function createAuthCookie(token: string, maxAge = 60 * 60 * 24 * 7): string {
  return `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

/**
 * Create a cookie string to clear the auth cookie
 *
 * @returns Cookie string for Set-Cookie header
 */
export function clearAuthCookie(): string {
  return 'auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

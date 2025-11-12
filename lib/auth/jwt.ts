/**
 * JWT Utilities
 *
 * Purpose: JSON Web Token creation and verification for authentication
 * Responsibility: Handle JWT signing and verification with proper security
 *
 * Security Notes:
 * - Tokens expire after 7 days
 * - Uses HS256 algorithm
 * - Secret must be at least 32 characters
 * - Tokens stored in HTTP-only cookies (not localStorage)
 */

import { SignJWT, jwtVerify } from 'jose';

// JWT secret from environment (must be set)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

// Convert secret to Uint8Array for jose library
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * JWT Payload Interface
 * Contains user identity and metadata
 */
export interface JWTPayload {
  sub: string; // Subject: user ID
  email: string; // User email
  iat?: number; // Issued at (automatically added)
  exp?: number; // Expiration time (automatically added)
}

/**
 * Sign a JWT token
 *
 * @param payload - User data to encode in token
 * @returns Signed JWT string
 */
export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  try {
    const token = await new SignJWT(payload as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // 7 days
      .sign(secret);

    return token;
  } catch (error) {
    console.error('Error signing JWT:', error);
    throw new Error('Failed to sign JWT token');
  }
}

/**
 * Verify and decode a JWT token
 *
 * @param token - JWT string to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    // Token is invalid or expired
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract JWT from cookie string
 *
 * @param cookieHeader - Cookie header value
 * @param cookieName - Name of the auth cookie (default: 'auth-token')
 * @returns JWT token or null if not found
 */
export function extractTokenFromCookie(
  cookieHeader: string | null,
  cookieName = 'auth-token'
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const authCookie = cookies.find((c) => c.startsWith(`${cookieName}=`));

  if (!authCookie) return null;

  return authCookie.substring(cookieName.length + 1);
}

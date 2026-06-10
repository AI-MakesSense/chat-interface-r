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

/**
 * Lazily resolve the JWT secret on first use.
 *
 * The throw must not run at module top level: Next.js's data-collection step
 * evaluates every route module at build time, which transitively loads this
 * file. A module-top-level throw kills the build before any env var injection
 * (Preview scope, Marketplace integrations) has had a chance to apply.
 * Deferring to a function preserves the same validation contract but shifts
 * the failure surface from build time to request time, where the error is
 * actionable.
 */
let _secret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (_secret) return _secret;

  const raw = process.env.JWT_SECRET;
  if (!raw) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  if (raw.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  _secret = new TextEncoder().encode(raw);
  return _secret;
}

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
      .sign(getSecret());

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
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
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

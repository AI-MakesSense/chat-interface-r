/**
 * Admin Authorization Guard
 *
 * Purpose: Verify that the authenticated user is a platform admin
 * Admin status is determined by the ADMIN_EMAILS environment variable.
 * No database role column needed.
 */

import { NextRequest } from 'next/server';
import { requireAuth } from './guard';
import { type JWTPayload } from './jwt';

/**
 * Parse the ADMIN_EMAILS env var into a lowercase email set
 */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || '';
  const emails = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return new Set(emails);
}

/**
 * Check if an email address belongs to a platform admin
 */
export function isAdminEmail(email: string): boolean {
  return getAdminEmails().has(email.toLowerCase());
}

/**
 * Require admin authorization for a route
 *
 * Wraps requireAuth() and additionally checks the JWT email
 * against the ADMIN_EMAILS environment variable.
 *
 * @param request - Next.js request object
 * @returns Decoded JWT payload with admin user info
 * @throws Error('Authentication required') if not logged in
 * @throws Error('Forbidden') if not an admin
 */
export async function requireAdmin(request: NextRequest): Promise<JWTPayload> {
  const payload = await requireAuth(request);

  if (!isAdminEmail(payload.email)) {
    throw new Error('Forbidden');
  }

  return payload;
}

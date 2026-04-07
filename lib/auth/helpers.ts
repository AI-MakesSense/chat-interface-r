/**
 * Auth Helper Functions
 *
 * Purpose: Provide utility functions for authentication-related operations
 * Responsibility: Extract and normalize user information from authentication tokens
 * Assumptions: Authentication tokens may come from different sources (test mocks, real JWT)
 */

import { NextRequest } from 'next/server';
import { requireAuth } from './guard';

/**
 * Extract the authenticated user's ID from the request
 *
 * @param request - The Next.js request object containing authentication headers
 * @returns The user's ID string
 * @throws Will throw an error if authentication fails
 *
 * @description
 * This function handles the extraction of user ID from authentication tokens,
 * supporting both test mock format (userId property) and real JWT format (sub property).
 * This abstraction eliminates code duplication across API routes.
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string> {
  const user = await requireAuth(request);

  // Support both test mock (userId) and real JWT (sub) formats
  // The 'any' cast is necessary because the JWT payload structure varies
  const userId = (user as any).userId || user.sub;

  if (!userId) {
    throw new Error('Unable to extract user ID from authentication token');
  }

  return userId;
}
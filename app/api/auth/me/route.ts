/**
 * Get Current User API Route
 *
 * GET /api/auth/me
 *
 * Purpose: Get currently authenticated user's information
 * Returns: { user: { id, email, name } }
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getUserById } from '@/lib/db/queries';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);

    // Get full user data from database
    const user = await getUserById(authUser.sub);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Return user data (without password hash)
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

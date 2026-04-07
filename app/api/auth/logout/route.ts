/**
 * Logout API Route
 *
 * POST /api/auth/logout
 *
 * Purpose: Clear authentication cookie
 * Returns: { message: 'Logged out successfully' }
 */

import { NextRequest } from 'next/server';
import { clearAuthCookie } from '@/lib/auth/guard';
import { handleAPIError } from '@/lib/utils/api-error';

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = Response.json({
      message: 'Logged out successfully',
    });

    // Clear auth cookie
    response.headers.set('Set-Cookie', clearAuthCookie());

    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

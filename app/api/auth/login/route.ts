/**
 * Login API Route
 *
 * POST /api/auth/login
 *
 * Purpose: Authenticate user and create session
 * Body: { email, password }
 * Returns: { user: { id, email, name }, token }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { createAuthCookie } from '@/lib/auth/guard';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

// Validation schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return errorResponse('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return errorResponse('Invalid email or password', 401);
    }

    // Generate JWT
    const token = await signJWT({
      sub: user.id,
      email: user.email,
    });

    // Create response
    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });

    // Set auth cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

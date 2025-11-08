/**
 * Signup API Route
 *
 * POST /api/auth/signup
 *
 * Purpose: Create a new user account
 * Body: { email, password, name? }
 * Returns: { user: { id, email, name }, token }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@/lib/db/queries';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { createAuthCookie } from '@/lib/auth/middleware';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

// Validation schema
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate body
    const body = await request.json();
    const { email, password, name } = SignupSchema.parse(body);

    // Additional password validation
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return errorResponse(passwordError, 400);
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return errorResponse('Email already registered', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await createUser({
      email,
      passwordHash,
      name,
      emailVerified: false,
    });

    // Generate JWT
    const token = await signJWT({
      sub: user.id,
      email: user.email,
    });

    // Create response
    const response = Response.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      { status: 201 }
    );

    // Set auth cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Login API Route
 *
 * POST /api/auth/login
 *
 * Purpose: Authenticate user and create session
 * Body: { email, password }
 * Returns: { user: { id, email, name } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserByEmail } from '@/lib/db/queries';
import { verifyPassword } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { createAuthCookie } from '@/lib/auth/guard';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logActivity } from '@/lib/db/admin-queries';

// Validation schema
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LOGIN_IP_LIMIT = { limit: 25, windowMs: 15 * 60 * 1000 };
const LOGIN_EMAIL_LIMIT = { limit: 12, windowMs: 15 * 60 * 1000 };

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const ipRate = checkRateLimit('auth:login:ip', clientIP, LOGIN_IP_LIMIT);
    if (!ipRate.allowed) {
      return Response.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipRate.retryAfter || 60) },
        }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    const emailRate = checkRateLimit(
      'auth:login:email',
      email.toLowerCase(),
      LOGIN_EMAIL_LIMIT
    );
    if (!emailRate.allowed) {
      return Response.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(emailRate.retryAfter || 60) },
        }
      );
    }

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
    });

    // Set auth cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    // Log activity
    void logActivity(user.id, 'user_login', { email: user.email });

    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

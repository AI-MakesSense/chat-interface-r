/**
 * Signup API Route
 *
 * POST /api/auth/signup
 *
 * Purpose: Create a new user account
 * Body: { email, password, name? }
 * Returns: { user: { id, email, name } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createUser, getUserByEmail } from '@/lib/db/queries';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { signJWT } from '@/lib/auth/jwt';
import { createAuthCookie } from '@/lib/auth/guard';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { logActivity, getInvitationByCode, updateInvitationStatus } from '@/lib/db/admin-queries';

// Validation schema
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  inviteCode: z.string().optional(),
});

const SIGNUP_IP_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };
const SIGNUP_EMAIL_LIMIT = { limit: 6, windowMs: 60 * 60 * 1000 };

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
    const ipRate = checkRateLimit('auth:signup:ip', clientIP, SIGNUP_IP_LIMIT);
    if (!ipRate.allowed) {
      return Response.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(ipRate.retryAfter || 60) },
        }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const { email, password, name, inviteCode } = SignupSchema.parse(body);

    const emailRate = checkRateLimit(
      'auth:signup:email',
      email.toLowerCase(),
      SIGNUP_EMAIL_LIMIT
    );
    if (!emailRate.allowed) {
      return Response.json(
        { error: 'Too many signup attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(emailRate.retryAfter || 60) },
        }
      );
    }

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
      },
      { status: 201 }
    );

    // Set auth cookie
    response.headers.set('Set-Cookie', createAuthCookie(token));

    // Handle invitation acceptance
    if (inviteCode) {
      try {
        const invitation = await getInvitationByCode(inviteCode);
        if (invitation && invitation.status === 'pending' && new Date(invitation.expiresAt) > new Date()) {
          await updateInvitationStatus(invitation.id, 'accepted', user.id);
        }
      } catch {
        // Don't block signup if invite processing fails
      }
    }

    // Log activity
    void logActivity(user.id, 'user_signup', { inviteCode: inviteCode || null });

    return response;
  } catch (error) {
    return handleAPIError(error);
  }
}

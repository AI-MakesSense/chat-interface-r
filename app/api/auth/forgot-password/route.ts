import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { getUserByEmail, createPasswordResetToken, getValidPasswordResetToken, deletePasswordResetToken } from '@/lib/db/queries';
import { passwordResetTokens } from '@/lib/db/schema';
import { db } from '@/lib/db/client';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Forgot Password API
 *
 * POST /api/auth/forgot-password
 *
 * Request: { email: string }
 *
 * Security:
 * - Always returns success message (prevents email enumeration)
 * - Rate limited to 3 requests per email per hour
 * - Token expires after 1 hour
 */

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.toLowerCase();

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

    // Check if user exists
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return successResponse;
    }

    // Rate limiting: Check for recent tokens (max 3 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTokens = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          gt(passwordResetTokens.createdAt, oneHourAgo)
        )
      );

    if (recentTokens.length >= 3) {
      // Still return success to prevent enumeration
      console.log(`[Forgot Password] Rate limit exceeded for email: ${normalizedEmail}`);
      return successResponse;
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create password reset token
    await createPasswordResetToken(user.id, token, expiresAt);

    // In production, send email with reset link
    // For MVP, we'll log the token to console
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    // TODO: Replace with actual email sending in production
    console.log(`[Forgot Password] Reset link for ${normalizedEmail}: ${resetUrl}`);

    return successResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.error('[Forgot Password] Error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

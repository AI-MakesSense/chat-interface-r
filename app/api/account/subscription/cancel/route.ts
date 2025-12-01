/**
 * Subscription Cancel API Route
 *
 * POST /api/account/subscription/cancel
 *
 * Purpose: Cancel the user's subscription (at period end)
 * Schema v2.0: Subscription is at the user/account level
 *
 * Returns: { success: true, message: string, canceledAt: string }
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getUserById } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);

    // Get user data
    const user = await getUserById(authUser.sub);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const currentTier = (user as any).tier || 'free';
    const currentStatus = (user as any).subscriptionStatus || 'active';

    // Check if user has a subscription to cancel
    if (currentTier === 'free') {
      return errorResponse('No active subscription to cancel', 400);
    }

    // Check if already canceled
    if (currentStatus === 'canceled') {
      return errorResponse('Subscription is already canceled', 400);
    }

    // In production, this would cancel the Stripe subscription
    const stripeEnabled = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== '';
    const stripeSubscriptionId = (user as any).stripeSubscriptionId;

    if (stripeEnabled && stripeSubscriptionId) {
      // Production: Cancel Stripe subscription at period end
      // This is a placeholder - actual Stripe integration would go here
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // await stripe.subscriptions.update(stripeSubscriptionId, {
      //   cancel_at_period_end: true,
      // });
    }

    // Update user subscription status
    const currentPeriodEnd = (user as any).currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        subscriptionStatus: 'canceled',
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, user.id));

    return Response.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      canceledAt: new Date().toISOString(),
      accessUntil: currentPeriodEnd instanceof Date ? currentPeriodEnd.toISOString() : currentPeriodEnd,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * Subscription Upgrade API Route
 *
 * POST /api/account/subscription/upgrade
 *
 * Purpose: Initiate a subscription upgrade to a higher tier
 * Schema v2.0: Subscription is at the user/account level
 *
 * Request: { tier: 'basic' | 'pro' | 'agency' }
 * Returns: { checkoutUrl: string } or { success: true } if already subscribed
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getUserById } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

/**
 * Tier pricing configuration (Stripe Price IDs would go here in production)
 */
const TIER_PRICING = {
  basic: {
    price: 2900, // $29.00 in cents
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    name: 'Basic',
  },
  pro: {
    price: 4900, // $49.00 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    name: 'Pro',
  },
  agency: {
    price: 14900, // $149.00 in cents
    priceId: process.env.STRIPE_AGENCY_PRICE_ID || 'price_agency',
    name: 'Agency',
  },
} as const;

type UpgradeTier = keyof typeof TIER_PRICING;

const VALID_TIERS = ['basic', 'pro', 'agency'] as const;

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);

    // Get user data
    const user = await getUserById(authUser.sub);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Parse request body
    const body = await request.json();
    const { tier } = body;

    // Validate tier
    if (!tier || !VALID_TIERS.includes(tier)) {
      return errorResponse(
        `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
        400
      );
    }

    const targetTier = tier as UpgradeTier;
    const currentTier = (user as any).tier || 'free';

    // Check if already at or above target tier
    const tierOrder = ['free', 'basic', 'pro', 'agency'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const targetIndex = tierOrder.indexOf(targetTier);

    if (targetIndex <= currentIndex) {
      return errorResponse(
        `Already at ${currentTier} tier. Cannot upgrade to ${targetTier}.`,
        400
      );
    }

    // In production, this would create a Stripe checkout session
    // For now, we'll simulate the upgrade for development
    const stripeEnabled = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== '';

    if (stripeEnabled) {
      // Production: Create Stripe checkout session
      // This is a placeholder - actual Stripe integration would go here
      const pricing = TIER_PRICING[targetTier];

      // Return a mock checkout URL for now
      // In production, this would be a real Stripe checkout URL
      const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?tier=${targetTier}&price=${pricing.price}`;

      return Response.json({
        checkoutUrl,
        tier: targetTier,
        price: pricing.price,
        name: pricing.name,
      });
    } else {
      // Development: Directly upgrade the user (no payment)
      await db
        .update(users)
        .set({
          tier: targetTier,
          subscriptionStatus: 'active',
          updatedAt: new Date(),
        } as any)
        .where(eq(users.id, user.id));

      return Response.json({
        success: true,
        tier: targetTier,
        message: `Upgraded to ${TIER_PRICING[targetTier].name} tier (development mode - no payment required)`,
      });
    }
  } catch (error) {
    return handleAPIError(error);
  }
}

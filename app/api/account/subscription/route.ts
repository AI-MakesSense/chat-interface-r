/**
 * Account Subscription API Route
 *
 * GET /api/account/subscription
 *
 * Purpose: Get current user's subscription details
 * Schema v2.0: Subscription is now at the user level, not per-license
 *
 * Returns: {
 *   subscription: {
 *     tier: 'free' | 'basic' | 'pro' | 'agency',
 *     status: 'active' | 'canceled' | 'past_due',
 *     currentPeriodEnd: string | null,
 *     stripeCustomerId: string | null,
 *     stripeSubscriptionId: string | null
 *   },
 *   features: TierFeatures,
 *   usage: { widgetsUsed: number, widgetsLimit: number }
 * }
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { getUserById } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { widgets } from '@/lib/db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

/**
 * Tier feature configuration
 */
const TIER_FEATURES = {
  free: {
    widgetLimit: 3,
    embedTypes: ['popup'],
    advancedStyling: false,
    whiteLabel: false,
    fileAttachments: false,
    customFonts: false,
    domainWhitelist: false,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  basic: {
    widgetLimit: 5,
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: false,
    whiteLabel: false,
    fileAttachments: true,
    customFonts: false,
    domainWhitelist: true,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  pro: {
    widgetLimit: -1, // Unlimited
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: true,
    whiteLabel: true,
    fileAttachments: true,
    customFonts: true,
    domainWhitelist: true,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: true,
  },
  agency: {
    widgetLimit: -1, // Unlimited
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: true,
    whiteLabel: true,
    fileAttachments: true,
    customFonts: true,
    domainWhitelist: true,
    emailTranscripts: true,
    apiAccess: true,
    teamMembers: 5,
    prioritySupport: true,
  },
} as const;

type SubscriptionTier = keyof typeof TIER_FEATURES;

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);

    // Get full user data from database
    const user = await getUserById(authUser.sub);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Get tier from user (Schema v2.0) or default to 'free'
    const tier = ((user as any).tier || 'free') as SubscriptionTier;
    const status = (user as any).subscriptionStatus || 'active';
    const currentPeriodEnd = (user as any).currentPeriodEnd || null;
    const stripeCustomerId = (user as any).stripeCustomerId || null;
    const stripeSubscriptionId = (user as any).stripeSubscriptionId || null;

    // Get features for this tier
    const features = TIER_FEATURES[tier] || TIER_FEATURES.free;

    // Count user's active widgets
    const widgetCount = await db
      .select({ count: widgets.id })
      .from(widgets)
      .where(
        and(
          eq(widgets.userId, user.id),
          ne(widgets.status, 'deleted')
        )
      );

    const widgetsUsed = widgetCount.length > 0 ? Number(widgetCount[0].count) || 0 : 0;

    return Response.json({
      subscription: {
        tier,
        status,
        currentPeriodEnd,
        stripeCustomerId,
        stripeSubscriptionId,
      },
      features,
      usage: {
        widgetsUsed,
        widgetsLimit: features.widgetLimit,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

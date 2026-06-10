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
import { TIER_LIMITS, normalizeUserTier, type Tier } from '@/lib/license/tiers';

/**
 * Unlimited sentinel for the wire/response shape. The dashboard
 * (components/dashboard/subscription-card.tsx) treats widgetLimit === -1 as
 * "unlimited" (renders ∞, skips the usage bar), so the API must convert the
 * shared module's Infinity → -1 at the response boundary. Do NOT leak Infinity
 * (it is not valid JSON and serializes to null).
 */
const UNLIMITED_WIRE_VALUE = -1;
const toWireLimit = (max: number): number =>
  Number.isFinite(max) ? max : UNLIMITED_WIRE_VALUE;

/**
 * Tier feature configuration.
 *
 * Widget limits are NOT defined here — they come from the shared
 * lib/license/tiers TIER_LIMITS (single source of truth). The fields below are
 * display-only entitlements surfaced on the dashboard. `whiteLabel` mirrors
 * brandingRemovable from the shared module and is derived per-tier at response
 * time; the remaining fields are display config local to this route.
 */
const TIER_FEATURES = {
  free: {
    embedTypes: ['popup'],
    advancedStyling: false,
    fileAttachments: false,
    customFonts: false,
    domainWhitelist: false,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  basic: {
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: false,
    fileAttachments: true,
    customFonts: false,
    domainWhitelist: true,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: false,
  },
  pro: {
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: true,
    fileAttachments: true,
    customFonts: true,
    domainWhitelist: true,
    emailTranscripts: false,
    apiAccess: false,
    teamMembers: 1,
    prioritySupport: true,
  },
  agency: {
    embedTypes: ['popup', 'inline', 'fullpage', 'portal'],
    advancedStyling: true,
    fileAttachments: true,
    customFonts: true,
    domainWhitelist: true,
    emailTranscripts: true,
    apiAccess: true,
    teamMembers: 5,
    prioritySupport: true,
  },
} as const satisfies Record<Tier, Record<string, unknown>>;

type SubscriptionTier = Tier;

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authUser = await requireAuth(request);

    // Get full user data from database
    const user = await getUserById(authUser.sub);
    if (!user) {
      return errorResponse('User not found', 404);
    }

    // Get tier from user (Schema v2.0); normalizeUserTier handles null/unknown → 'free'
    const tier = normalizeUserTier((user as any).tier);
    const status = (user as any).subscriptionStatus || 'active';
    const currentPeriodEnd = (user as any).currentPeriodEnd || null;
    const stripeCustomerId = (user as any).stripeCustomerId || null;
    const stripeSubscriptionId = (user as any).stripeSubscriptionId || null;

    // Get display features for this tier. widgetLimit + whiteLabel come from the
    // shared TIER_LIMITS module (single source of truth); the rest are display
    // config local to this route. widgetLimit uses the -1 unlimited wire value.
    const limits = TIER_LIMITS[tier];
    const features = {
      ...TIER_FEATURES[tier],
      widgetLimit: toWireLimit(limits.maxWidgets),
      whiteLabel: limits.brandingRemovable,
    };

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

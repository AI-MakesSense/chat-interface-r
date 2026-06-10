/**
 * Subscription Upgrade API Route
 *
 * POST /api/account/subscription/upgrade
 *
 * Purpose: Initiate a subscription upgrade to a higher tier
 *
 * This endpoint is gated behind the BILLING_ENABLED feature flag.
 * When billing is disabled (default), the endpoint returns 501 so no code
 * path can silently upgrade a user's tier without real payment.
 *
 * When billing is eventually enabled, this handler will be extended to
 * create a real Stripe checkout session. Until then it returns 501 even
 * when the flag is set, signalling that the wiring is incomplete.
 *
 * Tiers are managed out-of-band by admins via PATCH /api/admin/users/[id].
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { BILLING_ENABLED } from '@/lib/feature-flags';
import { handleAPIError, errorResponse } from '@/lib/utils/api-error';

export async function POST(request: NextRequest) {
  try {
    // Gate first: unauthenticated requests still 401 via requireAuth below,
    // but we 501 before any tier-mutation logic executes.
    if (!BILLING_ENABLED) {
      return Response.json(
        {
          error:
            'Billing is not enabled on this deployment. Contact support to change your plan.',
        },
        { status: 501 }
      );
    }

    // Verify authentication (only reached when BILLING_ENABLED=true)
    await requireAuth(request);

    // Stripe checkout not yet implemented. Return 501 rather than silently
    // mutating the tier without payment.
    return Response.json(
      { error: 'Checkout not yet implemented. Contact support to change your plan.' },
      { status: 501 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

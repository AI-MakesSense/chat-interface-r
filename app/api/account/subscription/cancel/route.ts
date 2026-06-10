/**
 * Subscription Cancel API Route
 *
 * POST /api/account/subscription/cancel
 *
 * Purpose: Cancel the user's subscription (at period end)
 *
 * This endpoint is gated behind the BILLING_ENABLED feature flag.
 * When billing is disabled (default), the endpoint returns 501 so no code
 * path can mutate subscriptionStatus without real Stripe confirmation.
 *
 * When billing is eventually enabled, this handler will be extended to
 * cancel the real Stripe subscription. Until then it returns 501 even
 * when the flag is set, signalling that the wiring is incomplete.
 *
 * Subscription state is managed out-of-band by admins via PATCH /api/admin/users/[id].
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/guard';
import { BILLING_ENABLED } from '@/lib/feature-flags';
import { handleAPIError } from '@/lib/utils/api-error';

export async function POST(request: NextRequest) {
  try {
    // Gate first: 501 before any subscription-status mutation executes.
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

    // Stripe cancellation not yet implemented. Return 501 rather than
    // silently mutating subscriptionStatus without Stripe confirmation.
    return Response.json(
      { error: 'Cancellation not yet implemented. Contact support to change your plan.' },
      { status: 501 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

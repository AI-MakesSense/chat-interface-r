/**
 * Widget Validation Endpoint (Schema v2.0)
 *
 * POST /api/w/[widgetKey]/validate
 *
 * Purpose: Public endpoint to validate widget key for embedding
 * Replaces /api/licenses/validate for Schema v2.0
 *
 * Body: { domain: string }
 * Returns: { valid: boolean, widget?: {...}, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';
import { z } from 'zod';

const ValidateSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
) {
  try {
    const { widgetKey } = await params;

    // Validate widgetKey format
    if (!widgetKey || !/^[A-Za-z0-9]{16}$/.test(widgetKey)) {
      return NextResponse.json({
        valid: false,
        reason: 'Invalid widget key format',
      }, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Parse request body
    const body = await request.json();
    const parsed = ValidateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        valid: false,
        reason: 'Domain is required',
      }, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const { domain } = parsed.data;

    // Fetch widget with user data
    const widget = await getWidgetByKeyWithUser(widgetKey);

    if (!widget) {
      return NextResponse.json({
        valid: false,
        reason: 'Widget not found',
      }, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check widget status
    if (widget.status !== 'active') {
      return NextResponse.json({
        valid: false,
        reason: `Widget is ${widget.status}`,
      }, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Check user subscription status
    const user = widget.user as any;
    const subscriptionStatus = user.subscriptionStatus || 'active';
    const currentPeriodEnd = user.currentPeriodEnd;
    const userTier = user.tier || 'free';

    if (subscriptionStatus === 'canceled') {
      if (!currentPeriodEnd || new Date(currentPeriodEnd) <= new Date()) {
        return NextResponse.json({
          valid: false,
          reason: 'Subscription expired',
        }, {
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Check domain authorization
    const normalizedDomain = normalizeDomain(domain);
    const allowedDomains = (widget as any).allowedDomains || [];

    // Agency tier or empty allowedDomains allows any domain
    if (userTier !== 'agency' && allowedDomains.length > 0) {
      const isAuthorized = normalizedDomain === 'localhost' || allowedDomains.some((allowedDomain: string) => {
        const normalizedAllowed = normalizeDomain(allowedDomain);
        return normalizedAllowed === normalizedDomain ||
          normalizedDomain.endsWith('.' + normalizedAllowed);
      });

      if (!isAuthorized) {
        return NextResponse.json({
          valid: false,
          reason: 'Domain not authorized',
          domain: normalizedDomain,
        }, {
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Widget is valid
    return NextResponse.json({
      valid: true,
      widget: {
        id: widget.id,
        widgetKey: widgetKey,
        name: widget.name,
        status: widget.status,
        embedType: (widget as any).embedType || 'popup',
        tier: userTier,
        allowedDomains: allowedDomains,
      },
    }, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('[Widget Validate v2] Error:', error);
    return NextResponse.json({
      valid: false,
      reason: 'Internal server error',
    }, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

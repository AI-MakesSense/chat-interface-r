/**
 * Widget Serving Route (Schema v2.0)
 *
 * Purpose: Serve embeddable chat widget using widgetKey
 * Route: GET /w/[widgetKey].js (or /w/[widgetKey])
 *
 * Features:
 * - Widget key validation (16-char alphanumeric)
 * - Per-widget domain whitelist (allowedDomains)
 * - User subscription status validation
 * - IP-based rate limiting
 * - Caching headers for performance
 * - CORS support
 *
 * Security:
 * - Domain validation prevents unauthorized embedding
 * - Rate limiting prevents abuse
 * - No sensitive data in error responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWidgetByKeyWithUser } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';
import { extractDomainFromReferer, createResponseHeaders } from '@/lib/widget/headers';
import { createErrorScript, logWidgetError, ErrorType } from '@/lib/widget/error';
import { checkRateLimit } from '@/lib/widget/rate-limit';
import { serveWidgetBundle } from '@/lib/widget/serve';

/**
 * Extract IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Create error response with JavaScript error script
 */
function createErrorResponse(
  errorType: ErrorType,
  context?: Record<string, any>
): NextResponse {
  logWidgetError(errorType, context);
  const errorScript = createErrorScript(errorType);

  let status = 403;
  if (errorType === 'INTERNAL_ERROR') {
    status = 500;
  }

  const headers = createResponseHeaders();
  return new NextResponse(errorScript, {
    status,
    headers
  });
}

/**
 * GET handler for widget serving endpoint
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing widgetKey
 * @returns NextResponse with widget bundle or error script
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
): Promise<NextResponse> {
  try {
    // Extract widget key from route params
    const { widgetKey } = await params;

    // Remove .js extension if present
    const cleanWidgetKey = widgetKey.replace(/\.js$/, '');

    // Step 1: Validate widgetKey format (16-char alphanumeric)
    if (!cleanWidgetKey || !/^[A-Za-z0-9]{16}$/.test(cleanWidgetKey)) {
      return createErrorResponse('LICENSE_INVALID', { widgetKey: cleanWidgetKey });
    }

    // Step 2: Extract domain from referer or origin header
    // Some browsers/contexts don't send referer (privacy settings, HTTPS→HTTP, etc.)
    // Fall back to origin header, or allow if neither present (initial script load)
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');

    let domain: string | null = null;
    if (referer) {
      domain = extractDomainFromReferer(referer);
    } else if (origin) {
      domain = extractDomainFromReferer(origin);
    }

    // If no domain info available, log warning but allow (for script initial load)
    // Domain validation will still happen if allowedDomains is configured
    if (!domain) {
      console.warn(`[Widget] No referer/origin for ${cleanWidgetKey}, allowing initial load`);
      domain = 'unknown';
    }

    // Step 4: Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Step 5: Check IP rate limit (10 req/sec)
    const ipRateLimit = checkRateLimit(clientIP, 'ip');
    if (!ipRateLimit.allowed) {
      const errorScript = createErrorScript('INTERNAL_ERROR');
      return new NextResponse(errorScript, {
        status: 429,
        headers: {
          ...createResponseHeaders(),
          'Retry-After': String(ipRateLimit.retryAfter || 1)
        }
      });
    }

    // Step 6: Fetch widget with user data from database
    const widget = await getWidgetByKeyWithUser(cleanWidgetKey);
    if (!widget) {
      return createErrorResponse('LICENSE_INVALID', {
        widgetKey: cleanWidgetKey,
        domain,
        ip: clientIP
      });
    }

    // Step 7: Check widget rate limit (100 req/min)
    const widgetRateLimit = checkRateLimit(cleanWidgetKey, 'license');
    if (!widgetRateLimit.allowed) {
      const errorScript = createErrorScript('INTERNAL_ERROR');
      return new NextResponse(errorScript, {
        status: 429,
        headers: {
          ...createResponseHeaders(),
          'Retry-After': String(widgetRateLimit.retryAfter || 1)
        }
      });
    }

    // Step 8: Validate widget status
    if (widget.status !== 'active') {
      return createErrorResponse('LICENSE_INVALID', {
        widgetKey: cleanWidgetKey,
        domain,
        status: widget.status,
        ip: clientIP
      });
    }

    // Step 9: Validate user subscription status (Schema v2.0)
    const user = widget.user as any;
    const subscriptionStatus = user.subscriptionStatus || 'active';
    const currentPeriodEnd = user.currentPeriodEnd;

    if (subscriptionStatus === 'canceled') {
      // Check if within grace period
      if (!currentPeriodEnd || new Date(currentPeriodEnd) <= new Date()) {
        return createErrorResponse('LICENSE_EXPIRED', {
          widgetKey: cleanWidgetKey,
          domain,
          ip: clientIP
        });
      }
    }

    if (subscriptionStatus === 'past_due') {
      // Allow past_due for grace period, but could add stricter checks
      console.warn(`[Widget] Serving widget for past_due subscription: ${cleanWidgetKey}`);
    }

    // Step 10: Validate domain authorization
    const normalizedRequestDomain = normalizeDomain(domain);
    const allowedDomains = (widget as any).allowedDomains || [];
    const userTier = user.tier || 'free';

    // Agency tier or empty allowedDomains allows any domain
    // Also skip validation if domain is 'unknown' (no referer/origin sent)
    if (userTier !== 'agency' && allowedDomains.length > 0 && normalizedRequestDomain !== 'unknown') {
      const isAuthorized = normalizedRequestDomain === 'localhost' || allowedDomains.some((allowedDomain: string) => {
        const normalizedAllowed = normalizeDomain(allowedDomain);
        return normalizedAllowed === normalizedRequestDomain ||
          normalizedRequestDomain.endsWith('.' + normalizedAllowed);
      });

      if (!isAuthorized) {
        return createErrorResponse('DOMAIN_UNAUTHORIZED', {
          widgetKey: cleanWidgetKey,
          domain: normalizedRequestDomain,
          allowedDomains,
          ip: clientIP
        });
      }
    }

    // Step 11: Serve widget bundle
    // Check if it's a ChatKit widget
    if (widget.widgetType === 'chatkit') {
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const widgetUrl = `${protocol}://${host}/widget/chatkit/${cleanWidgetKey}`;

      const script = `
(function() {
  if (document.getElementById('chatkit-widget-container')) return;

  var container = document.createElement('div');
  container.id = 'chatkit-widget-container';
  container.style.cssText = "position: fixed; bottom: 0; right: 0; width: 100vw; height: 100vh; border: none; z-index: 999999; pointer-events: none;";

  var iframe = document.createElement('iframe');
  iframe.src = "${widgetUrl}";
  iframe.style.cssText = "width: 100%; height: 100%; border: none; background: transparent; color-scheme: normal;";
  iframe.allowTransparency = "true";

  container.appendChild(iframe);
  document.body.appendChild(container);
})();
      `;

      return new NextResponse(script, {
        status: 200,
        headers: {
          ...createResponseHeaders(),
          'Content-Type': 'application/javascript',
        }
      });
    }

    // For n8n widgets, serve the widget bundle
    // Create a mock license object for backward compatibility with serveWidgetBundle
    const mockLicense = {
      id: user.id,
      licenseKey: cleanWidgetKey,
      tier: userTier,
      domains: allowedDomains,
      status: 'active' as const,
      brandingEnabled: userTier === 'free' || userTier === 'basic',
    };

    const widgetBundle = await serveWidgetBundle(mockLicense as any, widget.id);

    // Step 12: Return successful response
    return new NextResponse(widgetBundle, {
      status: 200,
      headers: createResponseHeaders()
    });

  } catch (error) {
    console.error('[Widget Serving v2] Internal error:', error);

    return createErrorResponse('INTERNAL_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

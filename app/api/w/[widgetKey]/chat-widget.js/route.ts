/**
 * Widget Serving API Route (By Widget Key)
 *
 * Purpose: Serve embeddable chat widget using widget key (instead of license key)
 * Route: GET /api/w/[widgetKey]/chat-widget.js
 *
 * This is the SECURE route that should be used for embedding widgets.
 * Widget keys are:
 * - Scoped to a single widget (not all widgets under a license)
 * - Can be rotated without affecting other widgets
 * - Don't expose the license key which controls multiple resources
 *
 * Features:
 * - Referer header validation
 * - Domain authorization checking (uses license domains)
 * - License status validation
 * - IP and widget-based rate limiting
 * - Caching headers for performance
 * - CORS support
 *
 * Security:
 * - Domain validation prevents widget key theft
 * - Rate limiting prevents abuse
 * - No sensitive data in error responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWidgetByKey } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';
import { extractDomainFromReferer, createResponseHeaders } from '@/lib/widget/headers';
import { createErrorScript, logWidgetError, ErrorType } from '@/lib/widget/error';
import { checkRateLimit, buildRateLimitHeaders } from '@/lib/widget/rate-limit';
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
  return new NextResponse(errorScript, { status, headers });
}

/**
 * GET handler for widget serving endpoint (by widget key)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ widgetKey: string }> }
): Promise<NextResponse> {
  try {
    const { widgetKey } = await params;

    // Step 1: Extract and validate referer header
    const referer = request.headers.get('referer');
    if (!referer) {
      return createErrorResponse('REFERER_MISSING', { widgetKey });
    }

    // Step 2: Extract domain from referer
    const domain = extractDomainFromReferer(referer);
    if (!domain) {
      return createErrorResponse('REFERER_MISSING', { widgetKey, referer });
    }

    // Step 3: Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Step 4: Check IP rate limit (10 req/sec)
    const ipRateLimit = await checkRateLimit(clientIP, 'ip');
    if (!ipRateLimit.allowed) {
      const errorScript = createErrorScript('INTERNAL_ERROR');
      return new NextResponse(errorScript, {
        status: 429,
        headers: {
          ...createResponseHeaders(),
          ...buildRateLimitHeaders(ipRateLimit),
        }
      });
    }

    // Step 5: Fetch widget and license from database by widget key
    const widget = await getWidgetByKey(widgetKey);
    if (!widget) {
      return createErrorResponse('LICENSE_INVALID', {
        widgetKey,
        domain,
        ip: clientIP
      });
    }

    const license = widget.license;

    // Step 6: Check license rate limit (100 req/min) using widget key
    const widgetRateLimit = await checkRateLimit(widgetKey, 'license');
    if (!widgetRateLimit.allowed) {
      const errorScript = createErrorScript('INTERNAL_ERROR');
      return new NextResponse(errorScript, {
        status: 429,
        headers: {
          ...createResponseHeaders(),
          ...buildRateLimitHeaders(widgetRateLimit),
        }
      });
    }

    // Step 7: Validate license status
    if (license.status === 'expired') {
      return createErrorResponse('LICENSE_EXPIRED', {
        widgetKey,
        domain,
        ip: clientIP
      });
    }

    if (license.status === 'cancelled') {
      return createErrorResponse('LICENSE_CANCELLED', {
        widgetKey,
        domain,
        ip: clientIP
      });
    }

    if (license.status !== 'active') {
      return createErrorResponse('LICENSE_INVALID', {
        widgetKey,
        domain,
        status: license.status,
        ip: clientIP
      });
    }

    // Step 8: Check expiration date
    if (license.expiresAt) {
      const now = new Date();
      if (license.expiresAt <= now) {
        return createErrorResponse('LICENSE_EXPIRED', {
          widgetKey,
          domain,
          expiresAt: license.expiresAt.toISOString(),
          ip: clientIP
        });
      }
    }

    // Step 9: Validate domain authorization
    const normalizedRequestDomain = normalizeDomain(domain);

    // Agency tier allows any domain
    if (license.tier !== 'agency') {
      // Check widget-specific allowed domains first, then license domains
      const allowedDomains = widget.allowedDomains || license.domains;

      const isAuthorized = normalizedRequestDomain === 'localhost' || allowedDomains.some(allowedDomain => {
        const normalizedAllowed = normalizeDomain(allowedDomain);
        return normalizedAllowed === normalizedRequestDomain ||
          normalizedRequestDomain.endsWith('.' + normalizedAllowed);
      });

      if (!isAuthorized) {
        return createErrorResponse('DOMAIN_UNAUTHORIZED', {
          widgetKey,
          domain: normalizedRequestDomain,
          allowedDomains,
          ip: clientIP
        });
      }
    }

    // Step 10: Check widget status
    if (widget.status !== 'active') {
      return createErrorResponse('LICENSE_INVALID', {
        widgetKey,
        domain,
        widgetStatus: widget.status,
        ip: clientIP
      });
    }

    // Step 11: Serve widget bundle with injected flags and relay config
    // Check if it's a ChatKit widget
    if (widget.widgetType === 'chatkit') {
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      // For ChatKit widgets, use the widget key in the URL
      const widgetUrl = `${protocol}://${host}/widget/chatkit/${widgetKey}`;

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

    // Serve standard widget bundle, passing widget key (not license key)
    const widgetBundle = await serveWidgetBundle(license, widget.id, widgetKey);

    return new NextResponse(widgetBundle, {
      status: 200,
      headers: createResponseHeaders()
    });

  } catch (error) {
    console.error('[Widget Serving] Internal error:', error);
    return createErrorResponse('INTERNAL_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

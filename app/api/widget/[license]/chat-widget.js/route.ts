/**
 * Widget Serving API Route
 *
 * Purpose: Serve embeddable chat widget with license validation and domain checks
 * Route: GET /api/widget/[license]/chat-widget.js
 *
 * Features:
 * - Referer header validation
 * - Domain authorization checking
 * - License status validation
 * - IP and license-based rate limiting
 * - Caching headers for performance
 * - CORS support
 *
 * Security:
 * - Domain validation prevents license key theft
 * - Rate limiting prevents abuse
 * - No sensitive data in error responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getWidgetsByLicenseId } from '@/lib/db/queries';
import { normalizeDomain } from '@/lib/license/domain';
import { extractDomainFromReferer, createResponseHeaders } from '@/lib/widget/headers';
import { createErrorScript, logWidgetError, ErrorType } from '@/lib/widget/error';
import { checkRateLimit } from '@/lib/widget/rate-limit';
import { serveWidgetBundle } from '@/lib/widget/serve';

/**
 * Extract IP address from request
 *
 * @param request - Next.js request object
 * @returns IP address string
 */
function getClientIP(request: NextRequest): string {
  // Check x-forwarded-for header (common in proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Take first IP if multiple (client IP)
    return forwarded.split(',')[0].trim();
  }

  // Check x-real-ip header (common in nginx)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (shouldn't happen in production)
  return 'unknown';
}

/**
 * Create error response with JavaScript error script
 *
 * @param errorType - Type of error that occurred
 * @param context - Additional error context for logging
 * @returns NextResponse with error script
 */
function createErrorResponse(
  errorType: ErrorType,
  context?: Record<string, any>
): NextResponse {
  // Log the error
  logWidgetError(errorType, context);

  // Create error script
  const errorScript = createErrorScript(errorType);

  // Determine status code based on error type
  let status = 403; // Default to Forbidden
  if (errorType === 'INTERNAL_ERROR') {
    status = 500;
  }

  // Create response with error script
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
 * @param params - Route parameters containing license key
 * @returns NextResponse with widget bundle or error script
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ license: string }> }
): Promise<NextResponse> {
  try {
    // Extract license key from route params (await for Next.js 16)
    const { license: licenseKey } = await params;

    // Step 1: Extract and validate referer header
    const referer = request.headers.get('referer');
    if (!referer) {
      return createErrorResponse('REFERER_MISSING', { licenseKey });
    }

    // Step 2: Extract domain from referer
    const domain = extractDomainFromReferer(referer);
    if (!domain) {
      return createErrorResponse('REFERER_MISSING', { licenseKey, referer });
    }

    // Step 3: Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Step 4: Check IP rate limit (10 req/sec)
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

    // Step 5: Fetch license from database
    const license = await getLicenseByKey(licenseKey);
    if (!license) {
      return createErrorResponse('LICENSE_INVALID', {
        licenseKey,
        domain,
        ip: clientIP
      });
    }

    // Step 6: Check license rate limit (100 req/min)
    const licenseRateLimit = checkRateLimit(licenseKey, 'license');
    if (!licenseRateLimit.allowed) {
      const errorScript = createErrorScript('INTERNAL_ERROR');
      return new NextResponse(errorScript, {
        status: 429,
        headers: {
          ...createResponseHeaders(),
          'Retry-After': String(licenseRateLimit.retryAfter || 1)
        }
      });
    }

    // Step 7: Validate license status
    if (license.status === 'expired') {
      return createErrorResponse('LICENSE_EXPIRED', {
        licenseKey,
        domain,
        ip: clientIP
      });
    }

    if (license.status === 'cancelled') {
      return createErrorResponse('LICENSE_CANCELLED', {
        licenseKey,
        domain,
        ip: clientIP
      });
    }

    if (license.status !== 'active') {
      return createErrorResponse('LICENSE_INVALID', {
        licenseKey,
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
          licenseKey,
          domain,
          expiresAt: license.expiresAt.toISOString(),
          ip: clientIP
        });
      }
    }

    // Step 9: Validate domain authorization
    // Normalize both domains for comparison
    const normalizedRequestDomain = normalizeDomain(domain);

    // Agency tier allows any domain
    if (license.tier !== 'agency') {
      // Check if domain is in allowed list (including subdomains)
      const isAuthorized = normalizedRequestDomain === 'localhost' || license.domains.some(allowedDomain => {
        const normalizedAllowed = normalizeDomain(allowedDomain);
        // Allow exact match OR subdomain match (e.g., project.user.replit.dev matches replit.dev)
        return normalizedAllowed === normalizedRequestDomain ||
               normalizedRequestDomain.endsWith('.' + normalizedAllowed);
      });

      if (!isAuthorized) {
        return createErrorResponse('DOMAIN_UNAUTHORIZED', {
          licenseKey,
          domain: normalizedRequestDomain,
          allowedDomains: license.domains,
          ip: clientIP
        });
      }
    }

    // Step 10: Get widgets for this license to inject relay configuration
    const widgets = await getWidgetsByLicenseId(license.id);
    const widgetId = widgets.length > 0 ? widgets[0].id : undefined;

    // Step 11: Serve widget bundle with injected flags and relay config
    const widgetBundle = await serveWidgetBundle(license, widgetId);

    // Step 12: Return successful response
    return new NextResponse(widgetBundle, {
      status: 200,
      headers: createResponseHeaders()
    });

  } catch (error) {
    // Log internal error
    console.error('[Widget Serving] Internal error:', error);

    // Return generic error response
    return createErrorResponse('INTERNAL_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

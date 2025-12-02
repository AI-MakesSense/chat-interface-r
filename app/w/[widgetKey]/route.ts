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
      // Use the new v2.0 ChatKit route that uses widgetKey
      const widgetUrl = `${protocol}://${host}/chatkit/${cleanWidgetKey}`;
      const embedType = (widget as any).embedType || 'popup';

      let script: string;

      if (embedType === 'inline') {
        // Inline mode: embed in a container specified by data-container attribute
        script = `
(function() {
  if (document.getElementById('chatkit-widget-container')) return;

  var scriptTag = document.currentScript;
  var containerId = scriptTag && scriptTag.getAttribute('data-container');
  var targetContainer = containerId ? document.getElementById(containerId) : null;

  if (targetContainer) {
    // Inline mode - embed in the target container
    var iframe = document.createElement('iframe');
    iframe.src = "${widgetUrl}";
    iframe.style.cssText = "width: 100%; height: 100%; border: none; background: transparent;";
    iframe.allow = "clipboard-write";
    targetContainer.innerHTML = '';
    targetContainer.appendChild(iframe);
  } else {
    console.warn('ChatKit: Container element not found. Use data-container attribute to specify the container ID.');
  }
})();
        `;
      } else {
        // Popup mode (default): floating chat bubble with toggle
        const config = widget.config as any;
        const accentColor = config?.chatkitAccentPrimary || config?.accentColor || '#0f172a';
        const position = config?.style?.position || 'bottom-right';
        const positionStyles = position === 'bottom-left'
          ? 'left: 20px; right: auto;'
          : 'right: 20px; left: auto;';

        script = `
(function() {
  if (document.getElementById('chatkit-widget-container')) return;

  var isOpen = false;

  // Create toggle button
  var toggleBtn = document.createElement('button');
  toggleBtn.id = 'chatkit-widget-toggle';
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  toggleBtn.style.cssText = "position: fixed; bottom: 20px; ${positionStyles} width: 56px; height: 56px; border-radius: 50%; background: ${accentColor}; color: white; border: none; cursor: pointer; z-index: 999998; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s, box-shadow 0.2s;";
  toggleBtn.onmouseenter = function() { toggleBtn.style.transform = 'scale(1.05)'; toggleBtn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; };
  toggleBtn.onmouseleave = function() { toggleBtn.style.transform = 'scale(1)'; toggleBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; };

  // Create container for iframe
  var container = document.createElement('div');
  container.id = 'chatkit-widget-container';
  container.style.cssText = "position: fixed; bottom: 90px; ${positionStyles} width: 400px; height: 600px; max-height: calc(100vh - 120px); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.2); z-index: 999999; display: none; background: white;";

  var iframe = document.createElement('iframe');
  iframe.src = "${widgetUrl}";
  iframe.style.cssText = "width: 100%; height: 100%; border: none; background: transparent;";
  iframe.allow = "clipboard-write";

  container.appendChild(iframe);
  document.body.appendChild(container);
  document.body.appendChild(toggleBtn);

  // Toggle chat open/closed
  toggleBtn.onclick = function() {
    isOpen = !isOpen;
    container.style.display = isOpen ? 'block' : 'none';
    toggleBtn.innerHTML = isOpen
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  };
})();
        `;
      }

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

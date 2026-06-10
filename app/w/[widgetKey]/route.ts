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
import { checkRateLimit } from '@/lib/security/rate-limit';
import { isDomainAllowed } from '@/lib/widget/resolve-widget';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';

/**
 * Build an inline bootstrap script that injects the stable loader with the
 * resolved widgetKey baked in. Used by the legacy compat path: a redirect would
 * be invisible to the loader (browsers keep the original currentScript.src), so
 * we serve JS that creates the loader <script> with data-widget-key set.
 *
 * The widgetKey is validated as 16-char alphanumeric upstream; JSON.stringify
 * still guards against any injection into the JS string literal.
 */
function buildLoaderBootstrap(origin: string, widgetKey: string): string {
  const loaderSrc = JSON.stringify(`${origin}/widget/loader.js`);
  const keyLiteral = JSON.stringify(widgetKey);
  return `(function(){var s=document.createElement('script');s.src=${loaderSrc};s.async=true;s.setAttribute('data-widget-key',${keyLiteral});document.head.appendChild(s);})();`;
}

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

    // Step 2: Extract domain from referer or origin header.
    // With crossorigin="anonymous" on the script tag, browsers send the Origin
    // header on cross-origin loads.  We still fall back to referer for legacy
    // embeds and accept a null domain (skip domain authz) rather than blocking
    // the widget entirely — the user experience of a silent failure is worse
    // than serving the widget to an unknown origin.
    //
    // NOTE: precedence here is INTENTIONALLY referer-first, the opposite of the
    // shared getRequestDomain (lib/widget/resolve-widget.ts), which is
    // origin-first. This legacy compat route serves plain <script src> loads,
    // where browsers send Referer but typically no Origin — and sandboxed
    // iframes send the literal "Origin: null", which never parses. Referer is
    // the richer signal for this traffic shape. The divergence is safe because
    // this route is documented fail-open (unknown domain => warn + serve), and
    // the loader bootstrap it returns triggers /api/w/[key]/config, which
    // re-runs domain authz via getRequestDomain fail-closed. Do not "unify"
    // this ordering without considering both properties.
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');

    let domain: string | null = null;
    if (referer) {
      domain = extractDomainFromReferer(referer);
    } else if (origin) {
      domain = extractDomainFromReferer(origin);
    }

    const domainUnknown = !domain;

    // Step 4: Get client IP for rate limiting
    const clientIP = getClientIP(request);

    // Step 5: Check IP rate limit (10 req/sec)
    const ipRateLimit = await checkRateLimit('widget-serve:ip', clientIP, { limit: 10, windowMs: 1000 });
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
    const widgetRateLimit = await checkRateLimit('widget-serve:widget', cleanWidgetKey, { limit: 100, windowMs: 60_000 });
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
    // When domain is unknown (no referer/origin), skip domain authz and log a
    // warning.  This avoids silent widget failures caused by strict Referrer
    // policies or privacy-focused browsers.
    const allowedDomains = (widget as any).allowedDomains || [];
    const userTier = user.tier || 'free';

    if (domainUnknown) {
      console.warn(
        `[Widget] Serving widget without origin context (referer/origin missing): ${cleanWidgetKey}, ip=${clientIP}`
      );
    } else {
      const normalizedRequestDomain = normalizeDomain(domain!);

      // Single source of truth for domain authorization (lib/widget/resolve-widget.ts):
      // agency-tier bypass, empty-allowedDomains bypass, NEXT_PUBLIC_APP_URL-derived
      // first-party allowance, non-production localhost bypass, exact/subdomain match.
      //
      // SECURITY: this route previously derived a first-party allowance from the
      // client-controlled Host header — the same allowedDomains bypass fixed in
      // resolve-widget.ts. The first-party domain now comes from server config only.
      if (!isDomainAllowed(normalizedRequestDomain, allowedDomains, userTier)) {
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
      if (!CHATKIT_SERVER_ENABLED) {
        return createErrorResponse('LICENSE_INVALID', {
          widgetKey: cleanWidgetKey,
          domain,
          reason: 'provider_disabled',
          ip: clientIP
        });
      }

      // Host used for URL construction only — NEVER for authorization (see isDomainAllowed).
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
    iframe.src = ${JSON.stringify(widgetUrl)};
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
        // Served-JS injection guard: these values are interpolated into a
        // script we serve to customer pages. Write paths validate them today,
        // but legacy rows predate that validation — never trust stored data
        // when building executable output.
        const rawAccent = config?.chatkitAccentPrimary || config?.accentColor || '#0f172a';
        const accentColor = /^#[0-9A-Fa-f]{3,8}$/.test(String(rawAccent)) ? String(rawAccent) : '#0f172a';
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
  iframe.src = ${JSON.stringify(widgetUrl)};
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

    // For n8n widgets, the injection/serve pipeline is gone (Task 18). The widget
    // is now served by the stable loader (which fetches /api/w/<key>/config and
    // injects the content-hashed bundle). This route remains as a compat shim for
    // any cached/legacy `/w/<key>.js` embeds.
    //
    // We CANNOT 302-redirect to /widget/loader.js?key=KEY: the browser keeps the
    // original <script src> (/w/KEY.js) as document.currentScript.src across the
    // redirect, so the loader never sees the ?key= and bails. Instead we serve an
    // inline bootstrap that injects the loader with the resolved widgetKey baked
    // into a data-widget-key attribute. All authorization above (status,
    // subscription, domain, rate limits) still runs first, and the loader's config
    // call re-checks domain authz.
    const requestOrigin = new URL(request.url).origin;
    const bootstrap = buildLoaderBootstrap(requestOrigin, cleanWidgetKey);
    return new NextResponse(bootstrap, {
      status: 200,
      headers: {
        ...createResponseHeaders(),
        'Content-Type': 'application/javascript',
      },
    });

  } catch (error) {
    console.error('[Widget Serving v2] Internal error:', error);

    return createErrorResponse('INTERNAL_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

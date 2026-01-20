import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById, getWidgetByKey, getLicenseByKey } from '@/lib/db/queries';
import { validateWebhookUrl, logBlockedUrlAttempt } from '@/lib/security/url-validator';
import { validateCorsOrigin, buildCorsHeaders, logBlockedCorsAttempt } from '@/lib/security/cors-validator';
import { checkRateLimit, buildRateLimitHeaders } from '@/lib/widget/rate-limit';
import { logger, securityLogger } from '@/lib/utils/logger';

/**
 * Interface for the expected incoming request body
 *
 * Authentication can be done via:
 * 1. widgetKey (PREFERRED - more secure, scoped to single widget)
 * 2. licenseKey (LEGACY - kept for backward compatibility)
 */
interface RelayBody {
  widgetId: string;
  licenseKey?: string;  // Legacy: kept for backward compatibility
  widgetKey?: string;   // Preferred: more secure, scoped to single widget
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Relay endpoint that forwards chat messages to the configured backend.
 * Supports N8n webhooks. ChatKit widgets connect directly to OpenAI via client-side sessions.
 */

/**
 * Extract client IP from request headers
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
 * Helper to build CORS headers for preflight - must allow all origins initially
 * since we don't know the license yet. Actual validation happens in POST.
 */
function getPreflightCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  // Preflight must be permissive since we don't know the license yet
  return new NextResponse(null, {
    status: 200,
    headers: getPreflightCorsHeaders(),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Get origin for CORS validation
  const origin = request.headers.get('origin');
  const clientIP = getClientIP(request);

  // Default CORS headers for early errors (before we know the license)
  let corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };

  try {
    // Rate limit by IP first (before parsing body)
    const ipRateLimit = await checkRateLimit(clientIP, 'relay-ip');
    if (!ipRateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...buildRateLimitHeaders(ipRateLimit),
          }
        }
      );
    }

    const body: RelayBody = await request.json();
    const { widgetId, licenseKey, widgetKey, message } = body;

    // 1. Input Validation - require either widgetKey (preferred) or licenseKey (legacy)
    if (!message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required field: message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!widgetKey && !licenseKey) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing authentication: widgetKey or licenseKey required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!widgetKey && !widgetId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required field: widgetId (required when using licenseKey)' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2. Rate limit by authentication key
    const rateLimitKey = widgetKey || licenseKey!;
    const keyRateLimit = await checkRateLimit(rateLimitKey, 'relay');
    if (!keyRateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Message rate limit exceeded. Please wait a moment.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...buildRateLimitHeaders(keyRateLimit),
          }
        }
      );
    }

    // 3. Database Lookup - use widgetKey if available (more secure), fallback to legacy flow
    let widget;
    let license;

    if (widgetKey) {
      // Preferred: Authenticate via widget key
      const widgetWithLicense = await getWidgetByKey(widgetKey);
      if (!widgetWithLicense) {
        return new NextResponse(
          JSON.stringify({ error: 'Widget not found or inactive' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      widget = widgetWithLicense;
      license = widgetWithLicense.license;
    } else {
      // Legacy: Authenticate via license key + widget ID
      widget = await getWidgetById(widgetId!);
      if (!widget) {
        return new NextResponse(
          JSON.stringify({ error: 'Widget not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      license = await getLicenseByKey(licenseKey!);
      if (!license) {
        return new NextResponse(
          JSON.stringify({ error: 'License not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // 4. CORS Validation - now that we have the license, validate origin
    const corsValidation = validateCorsOrigin(origin, license.domains, {
      isAgencyTier: license.tier === 'agency',
      allowNoOrigin: true, // Allow server-to-server requests
    });

    if (!corsValidation.allowed) {
      logBlockedCorsAttempt(origin, corsValidation.error || 'Unknown', {
        licenseId: license.id,
        widgetId,
      });
      // Return 403 without CORS headers (browser will block)
      return new NextResponse(
        JSON.stringify({ error: 'Origin not authorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update CORS headers with validated origin
    corsHeaders = buildCorsHeaders(corsValidation, {
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
    });

    // 5. SECURITY CHECK: Verify Ownership (only needed for legacy licenseKey flow)
    // When using widgetKey, ownership is already verified by getWidgetByKey returning the license
    if (!widgetKey && widget.licenseId !== license.id) {
      securityLogger.blocked('Unauthorized access attempt', {
        widgetLicenseId: widget.licenseId,
        providedLicenseId: license.id,
      });
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 6. Get Config and Determine Provider
    const config = widget.config as any;
    const provider = config?.connection?.provider || 'n8n';

    // 7. Route to Appropriate Handler
    if (provider === 'n8n') {
      return handleN8nRelay(config, body, license, corsHeaders);
    } else if (provider === 'chatkit') {
      return new NextResponse(
        JSON.stringify({ error: 'ChatKit widgets connect directly to OpenAI via client-side session' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

  } catch (err) {
    logger.error('[Chat Relay] Internal Server Error', err);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

/**
 * Handle N8n webhook relay
 */
async function handleN8nRelay(
  config: any,
  body: RelayBody,
  license: any,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  const webhookUrl = config?.connection?.webhookUrl;

  if (!webhookUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Webhook URL not configured for this widget' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // SSRF Protection: Validate webhook URL before making request
  const urlValidation = validateWebhookUrl(webhookUrl);
  if (!urlValidation.valid) {
    // Log the blocked attempt for security monitoring
    logBlockedUrlAttempt(webhookUrl, urlValidation.error || 'Unknown', {
      licenseId: license.id,
      widgetId: body.widgetId,
    });
    // Return generic error - don't reveal why URL was blocked
    return new NextResponse(
      JSON.stringify({ error: 'Widget configuration error. Please contact support.' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  const payload = {
    ...body,
    message: body.message,
    chatInput: body.message,
    widgetId: body.widgetId,
    licenseKey: body.licenseKey,
    metadata: {
      ...(body.metadata || {}),
      tier: license.tier,
      domainLimit: license.domainLimit
    }
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let responseJson;

    try {
      responseJson = JSON.parse(responseText);
    } catch (e) {
      responseJson = { message: responseText };
    }

    if (!response.ok) {
      // Use centralized logger - it handles environment-aware logging automatically
      logger.error('[Chat Relay] N8n Error', undefined, {
        status: response.status,
        licenseId: license.id,
        widgetId: body.widgetId,
        // Truncate response for logging (first 500 chars)
        responsePreview: responseText.substring(0, 500),
      });
      // Return generic error to client - never expose N8n details
      return new NextResponse(
        JSON.stringify({ error: 'Message delivery failed. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new NextResponse(JSON.stringify(responseJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (networkError) {
    // Use centralized logger - it handles environment-aware logging automatically
    logger.error('[Chat Relay] N8n Network Error', networkError, {
      licenseId: license.id,
    });
    return new NextResponse(
      JSON.stringify({ error: 'Unable to process message. Please try again.' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

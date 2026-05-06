import { NextRequest, NextResponse } from 'next/server';
import {
  getLicenseByKey,
  getUserById,
  getWidgetById,
  getWidgetByKeyWithUser,
} from '@/lib/db/queries';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';
import { normalizeDomain } from '@/lib/license/domain';
import { checkRateLimit } from '@/lib/security/rate-limit';

interface RelayBody {
  widgetId?: string;
  licenseKey: string; // In v2 this is widgetKey; legacy uses licenseKey
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

const RELAY_IP_LIMIT = { limit: 90, windowMs: 60_000 };
const RELAY_WIDGET_LIMIT = { limit: 240, windowMs: 60_000 };

function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': origin || '*',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

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

function normalizeDomainFromHeader(urlHeader: string | null): string | null {
  if (!urlHeader) return null;

  try {
    const hostname = new URL(urlHeader).hostname;
    const normalized = normalizeDomain(hostname);
    return normalized || null;
  } catch {
    return null;
  }
}

function getRequestDomain(request: NextRequest): string | null {
  return (
    normalizeDomainFromHeader(request.headers.get('origin')) ||
    normalizeDomainFromHeader(request.headers.get('referer'))
  );
}

function isSubscriptionActive(user: any): boolean {
  const subscriptionStatus = user?.subscriptionStatus || 'active';
  const currentPeriodEnd = user?.currentPeriodEnd;

  if (subscriptionStatus === 'active' || subscriptionStatus === 'past_due') {
    return true;
  }

  if (subscriptionStatus === 'canceled') {
    return Boolean(currentPeriodEnd && new Date(currentPeriodEnd) > new Date());
  }

  return false;
}

function isDomainAllowed(
  requestDomain: string,
  allowedDomains: string[],
  userTier: string,
  requestHost: string
): boolean {
  if (userTier === 'agency' || allowedDomains.length === 0) {
    return true;
  }

  const normalizedHost = normalizeDomain((requestHost || '').split(':')[0] || '');
  const isFirstPartyRequest =
    requestDomain !== 'unknown' &&
    normalizedHost !== 'unknown' &&
    requestDomain === normalizedHost;

  if (isFirstPartyRequest || requestDomain === 'localhost') {
    return true;
  }

  return allowedDomains.some((allowed) => {
    const normalizedAllowed = normalizeDomain(allowed);
    return (
      normalizedAllowed === requestDomain ||
      requestDomain.endsWith(`.${normalizedAllowed}`)
    );
  });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const corsHeaders = getCorsHeaders(request);

  try {
    const body: RelayBody = await request.json();
    const { widgetId, licenseKey, message } = body;

    if (!licenseKey || !message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: licenseKey or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const requestDomain = getRequestDomain(request);
    if (!requestDomain) {
      return new NextResponse(
        JSON.stringify({ error: 'Origin or referer header is required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const clientIP = getClientIP(request);
    const ipRate = checkRateLimit('chat-relay:ip', clientIP, RELAY_IP_LIMIT);
    if (!ipRate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many relay requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(ipRate.retryAfter || 1),
            ...corsHeaders,
          },
        }
      );
    }

    let widget: any = null;
    let user: any = null;
    const isWidgetKey = /^[A-Za-z0-9]{16}$/.test(licenseKey);

    if (isWidgetKey) {
      const widgetWithUser = await getWidgetByKeyWithUser(licenseKey);
      if (widgetWithUser) {
        widget = widgetWithUser;
        user = widgetWithUser.user;
      }
    }

    if (!widget && widgetId) {
      const widgetById = await getWidgetById(widgetId);
      if (widgetById) {
        widget = widgetById;

        if (widgetById.userId) {
          user = await getUserById(widgetById.userId);
        }

        // Legacy path: ensure supplied licenseKey is valid and belongs to this widget.
        if (!isWidgetKey && widgetById.licenseId) {
          const legacyLicense = await getLicenseByKey(licenseKey);
          if (!legacyLicense || legacyLicense.id !== widgetById.licenseId) {
            return new NextResponse(
              JSON.stringify({ error: 'Unauthorized widget-license pairing' }),
              { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            );
          }
          if (!user) {
            user = await getUserById(legacyLicense.userId);
          }
        }
      }
    }

    if (!widget) {
      return new NextResponse(
        JSON.stringify({ error: 'Widget not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (widget.status !== 'active') {
      return new NextResponse(
        JSON.stringify({ error: 'Widget is not active' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!user || !isSubscriptionActive(user)) {
      return new NextResponse(
        JSON.stringify({ error: 'Subscription is not active' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const allowedDomains = Array.isArray(widget.allowedDomains) ? widget.allowedDomains : [];
    const userTier = user.tier || 'free';
    const hostHeader = request.headers.get('host') || '';

    if (!isDomainAllowed(requestDomain, allowedDomains, userTier, hostHeader)) {
      return new NextResponse(
        JSON.stringify({ error: 'Domain not authorized for this widget' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const widgetRate = checkRateLimit(
      'chat-relay:widget',
      widget.widgetKey || widget.id,
      RELAY_WIDGET_LIMIT
    );
    if (!widgetRate.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Widget relay rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(widgetRate.retryAfter || 1),
            ...corsHeaders,
          },
        }
      );
    }

    const config = widget.config as any;
    const provider = config?.connection?.provider || 'n8n';

    if (provider === 'n8n') {
      return handleN8nRelay(config, body, userTier, corsHeaders);
    }

    if (provider === 'chatkit') {
      if (!CHATKIT_SERVER_ENABLED) {
        return new NextResponse(
          JSON.stringify({ error: 'Provider is disabled' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new NextResponse(
        JSON.stringify({
          error: 'ChatKit widgets connect directly to OpenAI via client-side session',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new NextResponse(
      JSON.stringify({ error: `Unsupported provider: ${provider}` }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('[Chat Relay] Internal Server Error:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function handleN8nRelay(
  config: any,
  body: RelayBody,
  userTier: string,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  const webhookUrl = config?.n8nWebhookUrl || config?.connection?.webhookUrl;

  if (!webhookUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Webhook URL not configured for this widget' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
      tier: userTier,
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseJson;

    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { message: responseText };
    }

    if (!response.ok) {
      console.error(`[Chat Relay] N8n Error (${response.status}):`, responseText);
      return new NextResponse(
        JSON.stringify({ error: 'Workflow execution failed', details: responseJson }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new NextResponse(JSON.stringify(responseJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (networkError) {
    console.error('[Chat Relay] N8n Network Error:', networkError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to connect to workflow backend' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

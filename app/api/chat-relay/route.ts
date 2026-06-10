import { NextRequest, NextResponse } from 'next/server';
import { normalizeDomain } from '@/lib/license/domain';
import { resolveAuthorizedWidget } from '@/lib/widget/resolve-widget';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { assertPublicWebhookUrl } from '@/lib/security/url-guard';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';

/** Upstream fetch timeout for the n8n webhook (ms). */
const N8N_FETCH_TIMEOUT_MS = 15_000;

/** Max upstream response body the relay will buffer (bytes). */
const N8N_MAX_RESPONSE_BYTES = 1_000_000;

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

/**
 * Extract a normalized domain from an Origin or Referer header value.
 * Returns null when the header is absent or the URL is unparseable.
 */
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

/**
 * Normalize the connection block from a possibly-legacy stored config WITHOUT
 * running the full migrateConfig on the hot relay path.
 *
 * Handles exactly the two fields the relay needs:
 *  - provider: deliberately MORE lenient than migrateConfig. migrateConfig's
 *    enum check is case-SENSITIVE (a stored 'CHATKIT' migrates to the 'n8n'
 *    default), while the relay matches case-insensitively (a superset) so a
 *    legacy mixed-case 'ChatKit' row still routes to the chatkit branch.
 *    Anything that is not 'chatkit' is treated as 'n8n' (the schema default) —
 *    a legacy/typo value must degrade to the default, NOT brick the widget
 *    with a permanent 400.
 *  - webhookUrl: canonical v2 path first, then the v1 flat field.
 */
function getRelayConnection(config: any): { provider: 'n8n' | 'chatkit'; webhookUrl?: string } {
  const rawProvider = config?.connection?.provider;
  const provider =
    typeof rawProvider === 'string' && rawProvider.trim().toLowerCase() === 'chatkit'
      ? 'chatkit'
      : 'n8n';
  const webhookUrl = config?.connection?.webhookUrl || config?.n8nWebhookUrl;
  return { provider, webhookUrl };
}

/**
 * Read a response body with a hard byte cap. Returns null when the body
 * exceeds the cap (declared via Content-Length or discovered while streaming).
 * The relay buffers the whole body to re-serialize it as JSON, so an unbounded
 * upstream body is an OOM vector — cap it.
 */
async function readBodyCapped(response: Response, maxBytes: number): Promise<string | null> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  if (!response.body) {
    // No streamable body in this runtime — fall back to text(). `.length` is
    // UTF-16 code units, not bytes, but it's a close-enough lower bound for
    // the cap; the streaming path above is the one production exercises.
    const text = await response.text();
    return text.length > maxBytes ? null : text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buf);
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
    const { licenseKey, message } = body;

    if (!licenseKey || !message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: licenseKey or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Legacy widgetId+licenseKey embeds (non-widgetKey-shaped licenseKey) are no
    // longer supported. Widgets must be embedded using their widgetKey.
    // The @deprecated getWidgetWithLicense shim is NOT used here — a non-widgetKey
    // licenseKey cannot be resolved and is rejected immediately.
    const isWidgetKey = /^[A-Za-z0-9]{16}$/.test(licenseKey);
    if (!isWidgetKey) {
      return new NextResponse(
        JSON.stringify({ error: 'This widget must be embedded using its widget key. Re-copy the embed code from your dashboard.' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const requestDomain = getRequestDomain(request);

    const clientIP = getClientIP(request);
    const ipRate = await checkRateLimit('chat-relay:ip', clientIP, RELAY_IP_LIMIT);
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

    // Single resolution path: resolveAuthorizedWidget handles lookup,
    // status, subscription, and domain authorization in one place.
    // requestDomain is passed as-is; if null the resolver returns 403
    // with 'Origin or referer header is required'.
    const resolved = await resolveAuthorizedWidget(licenseKey, requestDomain);

    if (!resolved.ok) {
      return new NextResponse(
        JSON.stringify({ error: resolved.error }),
        { status: resolved.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { widget, user } = resolved;
    const userTier = user.tier || 'free';

    const widgetRate = await checkRateLimit(
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
    const { provider, webhookUrl } = getRelayConnection(config);

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

    return handleN8nRelay(webhookUrl, body, userTier, corsHeaders);
  } catch (err) {
    console.error('[Chat Relay] Internal Server Error:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function handleN8nRelay(
  webhookUrl: string | undefined,
  body: RelayBody,
  userTier: string,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  if (!webhookUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Webhook URL not configured for this widget' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // SSRF guard: validate the user-controlled webhook URL before any fetch.
  // Rejects non-https, private-IP literals, and hostnames that DNS-resolve to
  // private addresses. Without this the relay would happily POST to internal
  // services (metadata endpoints, localhost, RFC1918) on the embedder's behalf.
  let safeUrl: URL;
  try {
    safeUrl = await assertPublicWebhookUrl(webhookUrl);
  } catch (err) {
    console.error('[Chat Relay] Webhook URL rejected:', (err as Error).message);
    return new NextResponse(
      JSON.stringify({ error: 'Webhook URL rejected by security policy' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  // Explicit allowlist instead of `...body` spread: a malicious embedder must not
  // be able to inject arbitrary top-level keys into the n8n payload. Only the
  // fields the widget client legitimately sends (see buildRelayPayload) are
  // forwarded. metadata.tier is server-derived and always overrides any client value.
  const bodyAny = body as any;
  const payload = {
    message: body.message,
    chatInput: body.message,
    sessionId: body.sessionId,
    threadId: bodyAny.threadId,
    // widgetId is forwarded to n8n for workflow use only — NOT an authorization input
    // (resolution is by widgetKey).
    widgetId: body.widgetId,
    licenseKey: body.licenseKey,
    attachments: bodyAny.attachments,
    context: bodyAny.context,
    customContext: bodyAny.customContext,
    extraInputs: bodyAny.extraInputs,
    metadata: {
      ...(body.metadata || {}),
      tier: userTier,
    },
  };

  try {
    const response = await fetch(safeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(N8N_FETCH_TIMEOUT_MS),
      // SSRF: do NOT follow redirects. assertPublicWebhookUrl validated the
      // original URL, but a public webhook could 3xx-bounce us to a private IP
      // (metadata endpoint, localhost, RFC1918). n8n webhooks are direct POST
      // endpoints that never redirect, so we treat any 3xx as a rejection
      // rather than following the Location.
      redirect: 'manual',
    });

    // With redirect:'manual', a 3xx upstream surfaces either as an opaque
    // redirect (response.type === 'opaqueredirect', status 0) or as a visible
    // 3xx status depending on the runtime. Reject both — never follow Location.
    if (
      response.type === 'opaqueredirect' ||
      response.status === 0 ||
      (response.status >= 300 && response.status < 400)
    ) {
      console.error(
        `[Chat Relay] Webhook attempted a redirect (status=${response.status}, type=${response.type}) — rejected`
      );
      return new NextResponse(
        JSON.stringify({ error: 'Webhook URL rejected by security policy' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const responseText = await readBodyCapped(response, N8N_MAX_RESPONSE_BYTES);
    if (responseText === null) {
      console.error('[Chat Relay] N8n response exceeded size cap — rejected');
      return new NextResponse(
        JSON.stringify({ error: 'Workflow response too large' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    let responseJson;

    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { message: responseText };
    }

    if (!response.ok) {
      console.error(`[Chat Relay] N8n Error (${response.status}):`, responseText);
      // Map ALL n8n non-2xx to 502: the upstream's status (e.g. 401/403) must not
      // masquerade as a relay-level auth/domain failure to the widget. Keep the
      // body + upstreamStatus for observability.
      return new NextResponse(
        JSON.stringify({ error: 'Workflow execution failed', upstreamStatus: response.status, details: responseJson }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new NextResponse(JSON.stringify(responseJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (networkError) {
    const errName = (networkError as Error)?.name;
    if (errName === 'TimeoutError' || errName === 'AbortError') {
      console.error('[Chat Relay] N8n request timed out:', errName);
      return new NextResponse(
        JSON.stringify({ error: 'Workflow backend timed out' }),
        { status: 504, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    console.error('[Chat Relay] N8n Network Error:', networkError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to connect to workflow backend' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

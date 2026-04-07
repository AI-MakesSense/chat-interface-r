import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById, getWidgetByKeyWithUser } from '@/lib/db/queries';
import { CHATKIT_SERVER_ENABLED } from '@/lib/feature-flags';

/**
 * Interface for the expected incoming request body
 * Supports both Schema v2.0 (widgetKey) and legacy (licenseKey + widgetId)
 */
interface RelayBody {
  widgetId?: string;
  licenseKey: string; // In v2.0, this is actually the widgetKey
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Relay endpoint that forwards chat messages to the configured backend.
 * Supports N8n webhooks. ChatKit widgets connect directly to OpenAI via client-side sessions.
 *
 * Schema v2.0: Uses widgetKey (passed as licenseKey for backward compatibility)
 */

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body: RelayBody = await request.json();
    const { widgetId, licenseKey, message } = body;

    // 1. Input Validation - licenseKey (widgetKey in v2.0) and message are required
    if (!licenseKey || !message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: licenseKey or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2. Database Lookup - Try Schema v2.0 first (widgetKey), fall back to legacy (widgetId)
    let widget;
    let userTier = 'free';

    // Check if licenseKey looks like a widgetKey (16-char alphanumeric)
    const isWidgetKey = /^[A-Za-z0-9]{16}$/.test(licenseKey);

    if (isWidgetKey) {
      // Schema v2.0: Look up by widgetKey
      const widgetWithUser = await getWidgetByKeyWithUser(licenseKey);
      if (widgetWithUser) {
        widget = widgetWithUser;
        userTier = widgetWithUser.user?.tier || 'free';
      }
    }

    // Fallback: Try by widgetId if provided and widget not found
    if (!widget && widgetId) {
      widget = await getWidgetById(widgetId);
    }

    if (!widget) {
      return new NextResponse(
        JSON.stringify({ error: 'Widget not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 3. Get Config and Determine Provider
    const config = widget.config as any;
    const provider = config?.connection?.provider || 'n8n';

    // 4. Route to Appropriate Handler
    if (provider === 'n8n') {
      return handleN8nRelay(config, body, userTier, corsHeaders);
    } else if (provider === 'chatkit') {
      if (!CHATKIT_SERVER_ENABLED) {
        return new NextResponse(
          JSON.stringify({ error: 'Provider is disabled' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      // ChatKit widgets don't use this relay - they connect directly to OpenAI
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
    console.error('[Chat Relay] Internal Server Error:', err);
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
  userTier: string,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  // Try both old and new config locations for webhook URL
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
      tier: userTier
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
      console.error(`[Chat Relay] N8n Error (${response.status}):`, responseText);
      return new NextResponse(
        JSON.stringify({ error: 'Workflow execution failed', details: responseJson }),
        { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new NextResponse(JSON.stringify(responseJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (networkError) {
    console.error('[Chat Relay] N8n Network Error:', networkError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to connect to workflow backend' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

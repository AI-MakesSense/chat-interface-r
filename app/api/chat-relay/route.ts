import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById, getLicenseByKey } from '@/lib/db/queries';

/**
 * Interface for the expected incoming request body
 */
interface RelayBody {
  widgetId: string;
  licenseKey: string;
  message: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Relay endpoint that forwards chat messages to the configured backend.
 * Supports N8n webhooks. ChatKit widgets connect directly to OpenAI via client-side sessions.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RelayBody = await request.json();
    const { widgetId, licenseKey, message, sessionId, metadata } = body;

    // 1. Input Validation
    if (!widgetId || !licenseKey || !message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: widgetId, licenseKey, or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Database Lookup
    const widget = await getWidgetById(widgetId);
    if (!widget) {
      return new NextResponse(
        JSON.stringify({ error: 'Widget not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const license = await getLicenseByKey(licenseKey);
    if (!license) {
      return new NextResponse(
        JSON.stringify({ error: 'License not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. SECURITY CHECK: Verify Ownership
    if (widget.licenseId !== license.id) {
      console.warn(`[Chat Relay] Unauthorized access: License ${licenseKey} tried to use Widget ${widgetId}`);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Widget does not belong to the provided license' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get Config and Determine Provider
    const config = widget.config as any;
    const provider = config?.connection?.provider || 'n8n';

    // 5. Route to Appropriate Handler
    if (provider === 'n8n') {
      return handleN8nRelay(config, body, license);
    } else if (provider === 'chatkit') {
      // ChatKit widgets don't use this relay - they connect directly to OpenAI
      return new NextResponse(
        JSON.stringify({ error: 'ChatKit widgets connect directly to OpenAI via client-side session' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      return new NextResponse(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (err) {
    console.error('[Chat Relay] Internal Server Error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle N8n webhook relay
 */
async function handleN8nRelay(
  config: any,
  body: RelayBody,
  license: any
): Promise<NextResponse> {
  const webhookUrl = config?.connection?.webhookUrl;

  if (!webhookUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Webhook URL not configured for this widget' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
      console.error(`[Chat Relay] N8n Error (${response.status}):`, responseText);
      return new NextResponse(
        JSON.stringify({ error: 'Workflow execution failed', details: responseJson }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new NextResponse(JSON.stringify(responseJson), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (networkError) {
    console.error('[Chat Relay] N8n Network Error:', networkError);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to connect to workflow backend' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

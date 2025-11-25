import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById, getLicenseByKey } from '@/lib/db/queries';

/**
 * Interface for the expected incoming request body
 */
interface RelayBody {
  widgetId: string;
  licenseKey: string;
  message: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * CORS headers for cross-origin requests from embedded widgets
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handle OPTIONS preflight requests for CORS
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Relay endpoint that forwards chat messages to the N8N webhook URL.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RelayBody = await request.json();
    const { widgetId, licenseKey, message, metadata } = body;

    // 1. Input Validation
    if (!widgetId || !licenseKey || !message) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields: widgetId, licenseKey, or message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 2. Database Lookup
    const widget = await getWidgetById(widgetId);
    if (!widget) {
      return new NextResponse(
        JSON.stringify({ error: 'Widget not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const license = await getLicenseByKey(licenseKey);
    if (!license) {
      return new NextResponse(
        JSON.stringify({ error: 'License not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 3. SECURITY CHECK: Verify Ownership
    if (widget.licenseId !== license.id) {
      console.warn(`[Chat Relay] Unauthorized access: License ${licenseKey} tried to use Widget ${widgetId}`);
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Widget does not belong to the provided license' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4. Get Webhook URL
    // FIX: Cast config to 'any' to avoid TypeScript 'unknown' error
    // Check both new (n8nWebhookUrl) and legacy (connection.webhookUrl) locations
    const config = widget.config as any;
    const webhookUrl = config?.n8nWebhookUrl || config?.connection?.webhookUrl;

    if (!webhookUrl) {
      console.error('[Chat Relay] No webhook URL found in config:', JSON.stringify(config, null, 2));
      return new NextResponse(
        JSON.stringify({ error: 'Webhook URL not configured for this widget' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[Chat Relay] Using webhook URL:', webhookUrl);

    // 5. Construct N8n Payload
    const payload = {
      ...body,
      message: message,
      chatInput: message,
      widgetId: widgetId,
      licenseKey: licenseKey,
      metadata: {
        ...(metadata || {}),
        tier: license.tier,
        domainLimit: license.domainLimit
      }
    };

    // 6. Forward to N8n
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
      console.error('[Chat Relay] Network Error:', networkError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to connect to workflow backend' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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
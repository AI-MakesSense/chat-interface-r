import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getWidgetWithLicense } from '@/lib/db/queries';

// Schema for the relay request payload
const relayRequestSchema = z.object({
  widgetId: z.string().min(1), // Allow any non-empty string (including 'preview-widget')
  licenseKey: z.string().min(1),
  message: z.string(),
  sessionId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  customContext: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  extraInputs: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = relayRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { widgetId, licenseKey, ...payload } = validationResult.data;

    // 2. Fetch widget and license
    // Skip widget lookup for preview mode
    if (widgetId === 'preview-widget' || licenseKey === 'preview') {
      return NextResponse.json(
        {
          output: 'Preview mode: This is a simulated response. Configure your webhook URL to test with real n8n.',
          preview: true
        },
        { status: 200 }
      );
    }

    const widget = await getWidgetWithLicense(widgetId);

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404 }
      );
    }

    // 3. Validate license key
    if (widget.license.licenseKey !== licenseKey) {
      return NextResponse.json(
        { error: 'Invalid license key' },
        { status: 401 }
      );
    }

    // 4. Validate license status
    if (widget.license.status !== 'active') {
      return NextResponse.json(
        { error: 'License is not active' },
        { status: 403 }
      );
    }

    // 5. Extract webhook URL
    // The config is stored as a JSONB column, so we need to cast it or access it safely
    // Based on schema, it should have a 'connection' property with 'webhookUrl'
    const config = widget.config as any;
    const webhookUrl = config?.connection?.webhookUrl;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL not configured for this widget' },
        { status: 400 }
      );
    }

    // 6. Forward request to N8n
    // We forward the payload minus the sensitive auth info (widgetId, licenseKey)
    // N8n receives the message, session, and context
    try {
      const n8nResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'N8n-Widget-Relay/1.0',
        },
        body: JSON.stringify(payload),
      });

      // Get the response from N8n
      // We try to parse as JSON, but fallback to text if needed
      const contentType = n8nResponse.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await n8nResponse.json();
      } else {
        responseData = { text: await n8nResponse.text() };
      }

      // Return the N8n response to the client
      return NextResponse.json(responseData, { status: n8nResponse.status });

    } catch (error) {
      console.error('Error forwarding to N8n:', error);
      return NextResponse.json(
        { error: 'Failed to communicate with upstream webhook' },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('DEBUG: Error in chat relay:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

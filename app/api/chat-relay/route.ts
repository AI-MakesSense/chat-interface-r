import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// NOTE: We use dynamic imports for DB queries to prevent crashes 
// if environment variables are missing during preview mode.

// Schema for the relay request payload
const relayRequestSchema = z.object({
  widgetId: z.string().min(1), // Allow any non-empty string (including 'preview-widget')
  licenseKey: z.string().min(1),
  message: z.string(),
  // ADDED: Allow 'chatInput' to pass through to n8n
  chatInput: z.string().optional(),
  sessionId: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  customContext: z.record(z.string(), z.any()).optional(),
  attachments: z.array(z.any()).optional(),
  extraInputs: z.record(z.string(), z.any()).optional(),
  // Add this field to allow testing unsaved URLs
  previewWebhookUrl: z.string().optional(),
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

    const { widgetId, licenseKey, previewWebhookUrl, ...payload } = validationResult.data;

    let targetWebhookUrl: string | null = null;

    // 2. Determine Webhook URL

    // CASE A: Preview Mode
    if (widgetId === 'preview-widget' || licenseKey === 'preview') {
      if (previewWebhookUrl) {
        // If the frontend sent a URL, use it (Real N8n connection test)
        targetWebhookUrl = previewWebhookUrl;
      } else {
        // Fallback to dummy response if no URL provided
        return NextResponse.json(
          {
            output: 'Preview mode: No webhook URL provided. Please enter a URL to test.',
            preview: true
          },
          { status: 200 }
        );
      }
    }
    // CASE B: Production/Saved Widget Mode
    else {
      // DYNAMIC IMPORT: Only import DB functions when we know we aren't in preview mode.
      const { getWidgetWithLicense } = await import('@/lib/db/queries');

      const widget = await getWidgetWithLicense(widgetId);

      if (!widget) {
        return NextResponse.json(
          { error: 'Widget not found' },
          { status: 404 }
        );
      }

      // Validate license key
      if (widget.license.licenseKey !== licenseKey) {
        return NextResponse.json(
          { error: 'Invalid license key' },
          { status: 401 }
        );
      }

      // Validate license status
      if (widget.license.status !== 'active') {
        return NextResponse.json(
          { error: 'License is not active' },
          { status: 403 }
        );
      }

      // Extract webhook URL from DB config
      const config = widget.config as any;
      targetWebhookUrl = config?.connection?.webhookUrl;
    }

    if (!targetWebhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL not configured for this widget' },
        { status: 400 }
      );
    }

    // 3. Forward request to N8n
    try {
      const n8nResponse = await fetch(targetWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'N8n-Widget-Relay/1.0',
        },
        body: JSON.stringify(payload),
      });

      // Get the response from N8n
      const contentType = n8nResponse.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await n8nResponse.json();
      } else {
        responseData = { output: await n8nResponse.text() };
      }

      // Return the N8n response to the client
      return NextResponse.json(responseData, {
        status: n8nResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });

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
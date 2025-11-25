import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById, getLicenseByKey } from '@/lib/db/queries';

/**
 * Interface for the expected incoming request body
 */
interface OpenAIRelayBody {
  widgetId?: string;
  licenseKey?: string;
  message: string;
  sessionId?: string;
  threadId?: string; // ChatKit thread ID for conversation continuity
  metadata?: Record<string, unknown>;
  // Preview mode fields - credentials passed directly (only from configurator preview)
  previewMode?: boolean;
  apiKey?: string;
  workflowId?: string;
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
 * OpenAI Responses API endpoint
 * Used for Agent Builder workflows
 */
const RESPONSES_API_URL = 'https://api.openai.com/v1/responses';

/**
 * OpenAI Responses API relay endpoint
 * Forwards chat messages to OpenAI using the workflow ID from Agent Builder
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: OpenAIRelayBody = await request.json();
    const { widgetId, licenseKey, message, threadId, metadata, previewMode } = body;

    // Variables for credentials
    let apiKey: string | undefined;
    let workflowId: string | undefined;

    // Check if this is preview mode (configurator testing)
    if (previewMode) {
      // Preview mode: credentials are passed directly in the request
      apiKey = body.apiKey;
      workflowId = body.workflowId;

      if (!message) {
        return new NextResponse(
          JSON.stringify({ error: 'Missing required field: message' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!apiKey || !workflowId) {
        return new NextResponse(
          JSON.stringify({ error: 'Preview mode requires apiKey and workflowId' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      console.log('[OpenAI Relay] Preview mode - using provided credentials');
    } else {
      // Production mode: look up credentials from widget config
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
        console.warn(`[OpenAI Relay] Unauthorized access: License ${licenseKey} tried to use Widget ${widgetId}`);
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized: Widget does not belong to the provided license' }),
          { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // 4. Get AgentKit Configuration from widget config
      const config = widget.config as Record<string, unknown>;
      apiKey = config?.agentKitApiKey as string | undefined;
      workflowId = config?.agentKitWorkflowId as string | undefined;

      if (!apiKey) {
        return new NextResponse(
          JSON.stringify({ error: 'OpenAI API key not configured for this widget' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!workflowId) {
        return new NextResponse(
          JSON.stringify({ error: 'OpenAI Workflow ID not configured for this widget' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      console.log('[OpenAI Relay] Processing request for widget:', widgetId);
    }

    console.log('[OpenAI Relay] Using workflowId:', workflowId);

    // 5. Call OpenAI Responses API
    try {
      // Build the Responses API request payload
      // The workflow_id tells OpenAI which Agent Builder workflow to use
      const responsesPayload: Record<string, unknown> = {
        model: workflowId, // Workflow ID acts as the model identifier
        input: message,
      };

      // Include previous_response_id for conversation continuity
      if (threadId) {
        responsesPayload.previous_response_id = threadId;
      }

      console.log('[OpenAI Relay] Calling Responses API with payload:', JSON.stringify(responsesPayload, null, 2));

      const response = await fetch(RESPONSES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(responsesPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenAI Relay] Responses API Error:', response.status, errorText);

        // Handle specific error codes
        if (response.status === 401) {
          return new NextResponse(
            JSON.stringify({ error: 'Invalid OpenAI API key' }),
            { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        if (response.status === 404) {
          return new NextResponse(
            JSON.stringify({ error: 'Workflow not found. Please check your Workflow ID.' }),
            { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        if (response.status === 429) {
          return new NextResponse(
            JSON.stringify({ error: 'OpenAI rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }

        // Try to parse error message from response
        try {
          const errorData = JSON.parse(errorText);
          return new NextResponse(
            JSON.stringify({ error: errorData.error?.message || 'Failed to process message' }),
            { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        } catch {
          return new NextResponse(
            JSON.stringify({ error: 'Failed to process message with OpenAI' }),
            { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }

      const data = await response.json();
      console.log('[OpenAI Relay] Responses API response received:', JSON.stringify(data, null, 2));

      // Extract the response text from the Responses API format
      // The response structure may vary, so we try multiple paths
      let responseText = 'No response generated';

      if (data.output_text) {
        responseText = data.output_text;
      } else if (data.output && typeof data.output === 'string') {
        responseText = data.output;
      } else if (data.output?.text) {
        responseText = data.output.text;
      } else if (data.choices?.[0]?.message?.content) {
        responseText = data.choices[0].message.content;
      } else if (data.content) {
        responseText = data.content;
      }

      return new NextResponse(
        JSON.stringify({
          message: responseText,
          output: responseText,
          threadId: data.id, // Use response ID for conversation continuity
          metadata: {
            workflowId,
            ...metadata,
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (fetchError) {
      console.error('[OpenAI Relay] Network Error:', fetchError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to connect to OpenAI ChatKit' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

  } catch (err) {
    console.error('[OpenAI Relay] Internal Server Error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

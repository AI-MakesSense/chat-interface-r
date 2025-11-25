import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById, getLicenseByKey } from '@/lib/db/queries';

/**
 * Interface for the expected incoming request body
 */
interface OpenAIRelayBody {
  widgetId: string;
  licenseKey: string;
  message: string;
  sessionId?: string;
  threadId?: string; // ChatKit thread ID for conversation continuity
  metadata?: Record<string, unknown>;
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
 * ChatKit Sessions API endpoint
 */
const CHATKIT_API_URL = 'https://api.openai.com/v1/chatkit/sessions';

/**
 * OpenAI ChatKit relay endpoint
 * Forwards chat messages to OpenAI ChatKit using the workflow ID
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: OpenAIRelayBody = await request.json();
    const { widgetId, licenseKey, message, threadId, metadata } = body;

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

    // 4. Get AgentKit Configuration
    const config = widget.config as Record<string, unknown>;
    const apiKey = config?.agentKitApiKey as string | undefined;
    const workflowId = config?.agentKitWorkflowId as string | undefined;

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

    console.log('[OpenAI Relay] Processing request for widget:', widgetId, 'workflowId:', workflowId);

    // 5. Call ChatKit Sessions API
    try {
      // Build the ChatKit request
      const chatKitPayload: Record<string, unknown> = {
        workflow_id: workflowId,
        input: {
          messages: [
            {
              role: 'user',
              content: message,
            }
          ]
        }
      };

      // Include thread_id if we have one (for conversation continuity)
      if (threadId) {
        chatKitPayload.thread_id = threadId;
      }

      const response = await fetch(CHATKIT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(chatKitPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenAI Relay] ChatKit API Error:', response.status, errorText);

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

        return new NextResponse(
          JSON.stringify({ error: 'Failed to process message with ChatKit' }),
          { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const data = await response.json();
      console.log('[OpenAI Relay] ChatKit response received');

      // Extract the assistant's response from ChatKit
      const assistantMessage = data.output?.messages?.find(
        (msg: { role: string }) => msg.role === 'assistant'
      );

      const responseText = assistantMessage?.content || data.output?.text || 'No response generated';

      return new NextResponse(
        JSON.stringify({
          message: responseText,
          output: responseText,
          threadId: data.thread_id, // Return thread ID for conversation continuity
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

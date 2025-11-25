import { NextRequest, NextResponse } from 'next/server';
import { Agent, run, setDefaultOpenAIClient } from '@openai/agents';
import OpenAI from 'openai';
import { getWidgetById, getLicenseByKey } from '@/lib/db/queries';

/**
 * Interface for the expected incoming request body
 */
interface OpenAIRelayBody {
  widgetId: string;
  licenseKey: string;
  message: string;
  sessionId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  metadata?: Record<string, unknown>;
  stream?: boolean;
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
 * OpenAI Agents SDK relay endpoint
 * Forwards chat messages to OpenAI using the Agents SDK with workflow configuration
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: OpenAIRelayBody = await request.json();
    const { widgetId, licenseKey, message, conversationHistory = [], metadata } = body;

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
    const systemPrompt = config?.agentKitSystemPrompt as string | undefined;

    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'OpenAI API key not configured for this widget' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('[OpenAI Relay] Processing request for widget:', widgetId, 'workflowId:', workflowId);

    // 5. Configure OpenAI Client with user's API key
    const openaiClient = new OpenAI({ apiKey });
    setDefaultOpenAIClient(openaiClient);

    // 6. Build conversation input for the agent
    // Convert conversation history to the format expected by the agent
    const previousMessages = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // 7. Create Agent with workflow configuration
    // If workflowId is provided, we could fetch workflow details from OpenAI
    // For now, we'll use the system prompt as instructions
    const agentInstructions = systemPrompt ||
      'You are a helpful assistant. Respond concisely and helpfully to user questions.';

    const agent = new Agent({
      name: 'WidgetAssistant',
      instructions: agentInstructions,
      model: 'gpt-4o-mini', // Default model, can be made configurable
    });

    // 8. Build the input with conversation context
    const fullInput = previousMessages.length > 0
      ? [...previousMessages, { role: 'user' as const, content: message }]
      : message;

    // 9. Run the agent (with optional streaming)
    try {
      if (body.stream) {
        // Streaming response via SSE
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const streamedResult = await run(agent, fullInput, { stream: true });

              for await (const event of streamedResult) {
                // Handle different event types from the agent
                if (event.type === 'raw_model_stream_event') {
                  const data = event.data as { delta?: { content?: string } };
                  if (data.delta?.content) {
                    const sseData = `data: ${JSON.stringify({ type: 'delta', content: data.delta.content })}\n\n`;
                    controller.enqueue(encoder.encode(sseData));
                  }
                }
              }

              // Get final result
              const finalResult = streamedResult.finalOutput;
              const doneData = `data: ${JSON.stringify({ type: 'done', content: finalResult })}\n\n`;
              controller.enqueue(encoder.encode(doneData));
              controller.close();
            } catch (streamError) {
              console.error('[OpenAI Relay] Stream Error:', streamError);
              const errorData = `data: ${JSON.stringify({ type: 'error', message: 'Stream error occurred' })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          }
        });

        return new NextResponse(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            ...corsHeaders
          }
        });
      }

      // Non-streaming response
      const result = await run(agent, fullInput);

      // Extract the final output
      const response = result.finalOutput || 'I apologize, but I was unable to generate a response.';

      console.log('[OpenAI Relay] Agent response received');

      return new NextResponse(
        JSON.stringify({
          message: response,
          output: response,
          metadata: {
            model: 'gpt-4o-mini',
            workflowId: workflowId || null,
            ...metadata,
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (agentError) {
      console.error('[OpenAI Relay] Agent Error:', agentError);

      // Check for specific OpenAI errors
      if (agentError instanceof Error) {
        if (agentError.message.includes('API key')) {
          return new NextResponse(
            JSON.stringify({ error: 'Invalid OpenAI API key' }),
            { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        if (agentError.message.includes('rate limit')) {
          return new NextResponse(
            JSON.stringify({ error: 'OpenAI rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
      }

      return new NextResponse(
        JSON.stringify({ error: 'Failed to process message with AI agent' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
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

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
  threadId?: string; // For AgentKit threading
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Relay endpoint that forwards chat messages to the configured backend.
 * Supports N8n webhooks and OpenAI AgentKit/Assistants.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RelayBody = await request.json();
    const { widgetId, licenseKey, message, sessionId, threadId, metadata } = body;

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
    } else if (provider === 'agentkit') {
      return handleAgentKitRelay(config, body, threadId);
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

/**
 * Handle AgentKit (OpenAI Assistants API) relay
 */
async function handleAgentKitRelay(
  config: any,
  body: RelayBody,
  threadId?: string
): Promise<NextResponse> {
  const workflowId = config?.connection?.agentKitWorkflowId;
  const apiKey = config?.connection?.agentKitApiKey;

  if (!workflowId || !apiKey) {
    return new NextResponse(
      JSON.stringify({ error: 'AgentKit Workflow ID or API Key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let currentThreadId = threadId;

    // Create thread if not provided
    if (!currentThreadId) {
      const threadResponse = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({})
      });

      if (!threadResponse.ok) {
        const error = await threadResponse.text();
        console.error('[Chat Relay] Thread creation failed:', error);
        return new NextResponse(
          JSON.stringify({ error: 'Failed to create conversation thread' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const threadData = await threadResponse.json();
      currentThreadId = threadData.id;
    }

    // Add user message to thread
    await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        role: 'user',
        content: body.message
      })
    });

    // Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: workflowId
      })
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error('[Chat Relay] Run creation failed:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to run assistant' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const runData = await runResponse.json();
    const runId = runData.id;

    // Poll for completion (simple polling, max 30 seconds)
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds with 500ms intervals
    let runStatus = runData.status;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );

      const statusData = await statusResponse.json();
      runStatus = statusData.status;
      attempts++;
    }

    if (runStatus === 'failed') {
      return new NextResponse(
        JSON.stringify({ error: 'Assistant run failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (runStatus !== 'completed') {
      return new NextResponse(
        JSON.stringify({ error: 'Assistant run timed out' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve messages
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${currentThreadId}/messages?order=desc&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    const messagesData = await messagesResponse.json();
    const lastMessage = messagesData.data[0];

    if (!lastMessage || lastMessage.role !== 'assistant') {
      return new NextResponse(
        JSON.stringify({ error: 'No assistant response found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract text content
    const textContent = lastMessage.content.find((c: any) => c.type === 'text');
    const responseText = textContent?.text?.value || 'No response';

    return new NextResponse(
      JSON.stringify({
        output: responseText,
        threadId: currentThreadId,
        message: responseText
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Chat Relay] AgentKit Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to process AgentKit request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
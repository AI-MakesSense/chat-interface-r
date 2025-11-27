import { NextRequest, NextResponse } from 'next/server';
import { getWidgetById } from '@/lib/db/queries';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { widgetId, previewMode, apiKey, workflowId } = body;

        let openaiApiKey = apiKey;
        let targetWorkflowId = workflowId;

        // 1. Determine Credentials
        if (previewMode) {
            // Preview Mode: Use provided credentials
            if (!apiKey || !workflowId) {
                return NextResponse.json(
                    { error: 'Preview mode requires apiKey and workflowId' },
                    { status: 400 }
                );
            }
        } else {
            // Production Mode: Fetch from Database
            if (!widgetId) {
                return NextResponse.json(
                    { error: 'Missing widgetId' },
                    { status: 400 }
                );
            }

            const widget = await getWidgetById(widgetId);
            if (!widget) {
                return NextResponse.json(
                    { error: 'Widget not found' },
                    { status: 404 }
                );
            }

            const config = widget.config as any;
            if (config.connection?.provider !== 'chatkit') {
                return NextResponse.json(
                    { error: 'Widget is not configured for ChatKit' },
                    { status: 400 }
                );
            }

            openaiApiKey = config.connection.apiKey;
            targetWorkflowId = config.connection.workflowId;

            if (!openaiApiKey || !targetWorkflowId) {
                return NextResponse.json(
                    { error: 'ChatKit not configured for this widget' },
                    { status: 500 }
                );
            }
        }

        // 2. Validate credentials
        console.log('ChatKit session creation:', {
            previewMode,
            hasApiKey: !!openaiApiKey,
            hasWorkflowId: !!targetWorkflowId,
            workflowIdLength: targetWorkflowId?.length,
        });

        // 3. Create ChatKit Session via direct API call
        // Note: The OpenAI SDK doesn't expose chatkit.sessions, so we use fetch
        const apiBase = process.env.CHATKIT_API_BASE ?? 'https://api.openai.com';
        const url = `${apiBase}/v1/chatkit/sessions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
                'OpenAI-Beta': 'chatkit_beta=v1',
            },
            body: JSON.stringify({
                workflow: { id: targetWorkflowId },
                user: 'user_' + Math.random().toString(36).substring(7),
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('ChatKit API error:', {
                status: response.status,
                statusText: response.statusText,
                errorData
            });
            return NextResponse.json(
                { error: `ChatKit API error: ${response.statusText}` },
                { status: response.status }
            );
        }

        const session = await response.json();

        // 4. Return Client Secret
        return NextResponse.json({
            client_secret: session.client_secret,
        });

    } catch (error: any) {
        console.error('Error creating ChatKit session:', {
            message: error.message,
            stack: error.stack,
            response: error.response?.data,
            status: error.response?.status,
            fullError: error
        });
        return NextResponse.json(
            { error: error.message || 'Failed to create session' },
            { status: 500 }
        );
    }
}

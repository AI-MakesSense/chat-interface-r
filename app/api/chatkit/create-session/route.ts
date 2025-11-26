import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
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

        // 2. Initialize OpenAI Client
        console.log('ChatKit session creation:', {
            previewMode,
            hasApiKey: !!openaiApiKey,
            hasWorkflowId: !!targetWorkflowId,
            workflowIdLength: targetWorkflowId?.length,
            apiKeyPrefix: openaiApiKey?.substring(0, 7) + '...'
        });

        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });

        // 3. Create ChatKit Session
        // Note: Using 'any' cast because types might not be fully updated for ChatKit beta yet
        const session = await (openai as any).chatkit.sessions.create({
            workflow: { id: targetWorkflowId },
            user: {
                id: 'user_' + Math.random().toString(36).substring(7), // TODO: Use real user ID if available
            },
        });

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

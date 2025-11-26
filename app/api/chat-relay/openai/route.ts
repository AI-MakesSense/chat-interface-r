import { NextRequest, NextResponse } from 'next/server';
import { processMessage } from '@/lib/services/openai-service';

/**
 * Interface for the expected incoming request body
 */
interface OpenAIRelayBody {
  message: string;
  threadId?: string; // ChatKit thread ID for conversation continuity
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
 * OpenAI Relay Endpoint (Preview Mode)
 * Forwards chat messages to OpenAI using the provided credentials.
 * This endpoint is primarily used by the Configurator Preview.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: OpenAIRelayBody = await request.json();
    const { message, threadId, previewMode, apiKey, workflowId } = body;

    // 1. Input Validation
    if (!previewMode) {
      return new NextResponse(
        JSON.stringify({ error: 'This endpoint is for preview mode only' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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

    console.log('[OpenAI Relay] Preview mode - processing request');

    // 2. Call OpenAI Service
    try {
      const result = await processMessage(apiKey, workflowId, message, threadId);

      return new NextResponse(
        JSON.stringify({
          output: result.message,
          threadId: result.threadId,
          message: result.message,
          runId: result.runId
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );

    } catch (serviceError) {
      console.error('[OpenAI Relay] Service Error:', serviceError);
      return new NextResponse(
        JSON.stringify({ error: serviceError instanceof Error ? serviceError.message : 'Failed to process message with OpenAI' }),
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

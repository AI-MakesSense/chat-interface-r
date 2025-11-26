import { OpenAI } from 'openai';

/**
 * Interface for OpenAI Service responses
 */
export interface OpenAIAssistantResponse {
    message: string;
    threadId: string;
    runId?: string;
    metadata?: Record<string, any>;
}

/**
 * Initialize OpenAI client with a specific API key
 */
const getClient = (apiKey: string) => {
    return new OpenAI({
        apiKey: apiKey,
    });
};

/**
 * Create a new thread
 */
export async function createThread(apiKey: string): Promise<string> {
    const client = getClient(apiKey);
    const thread = await client.beta.threads.create();
    return thread.id;
}

/**
 * Add a user message to a thread
 */
export async function addMessage(apiKey: string, threadId: string, content: string): Promise<void> {
    const client = getClient(apiKey);
    await client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: content,
    });
}

/**
 * Run the assistant on a thread
 */
export async function runAssistant(apiKey: string, threadId: string, assistantId: string): Promise<string> {
    const client = getClient(apiKey);
    const run = await client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
    });
    return run.id;
}

/**
 * Poll for run completion
 */
export async function pollRun(apiKey: string, threadId: string, runId: string): Promise<void> {
    const client = getClient(apiKey);
    let runStatus = 'queued';
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds (500ms * 60)

    while (runStatus !== 'completed' && runStatus !== 'failed' && runStatus !== 'cancelled' && runStatus !== 'expired' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const run = await client.beta.threads.runs.retrieve(threadId, runId as any);
        runStatus = run.status;
        attempts++;

        if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
            throw new Error(`Assistant run failed with status: ${runStatus}`);
        }
    }

    if (runStatus !== 'completed') {
        throw new Error('Assistant run timed out');
    }
}

/**
 * Get the latest assistant response from a thread
 */
export async function getAssistantResponse(apiKey: string, threadId: string): Promise<string> {
    const client = getClient(apiKey);
    const messages = await client.beta.threads.messages.list(threadId, {
        order: 'desc',
        limit: 1,
    });

    const lastMessage = messages.data[0];
    if (!lastMessage || lastMessage.role !== 'assistant') {
        throw new Error('No assistant response found');
    }

    const textContent = lastMessage.content.find((c: any) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
        return 'No text response generated';
    }

    return textContent.text.value;
}

/**
 * Orchestrate the full message flow:
 * 1. Create thread (if needed)
 * 2. Add message
 * 3. Run assistant
 * 4. Poll for completion
 * 5. Get response
 */
export async function processMessage(
    apiKey: string,
    assistantId: string,
    message: string,
    threadId?: string
): Promise<OpenAIAssistantResponse> {
    let currentThreadId = threadId;

    // 1. Create thread if not provided
    if (!currentThreadId) {
        currentThreadId = await createThread(apiKey);
    }

    // 2. Add message
    await addMessage(apiKey, currentThreadId, message);

    // 3. Run assistant
    const runId = await runAssistant(apiKey, currentThreadId, assistantId);

    // 4. Poll for completion
    await pollRun(apiKey, currentThreadId, runId);

    // 5. Get response
    const responseText = await getAssistantResponse(apiKey, currentThreadId);

    return {
        message: responseText,
        threadId: currentThreadId,
        runId: runId,
    };
}

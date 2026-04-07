import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMessage, createThread, addMessage, runAssistant, pollRun, getAssistantResponse } from '@/lib/services/openai-service';

// Mock the OpenAI SDK
const mockCreateThread = vi.fn();
const mockCreateMessage = vi.fn();
const mockCreateRun = vi.fn();
const mockRetrieveRun = vi.fn();
const mockListMessages = vi.fn();

vi.mock('openai', () => {
    return {
        OpenAI: class {
            beta = {
                threads: {
                    create: mockCreateThread,
                    messages: {
                        create: mockCreateMessage,
                        list: mockListMessages,
                    },
                    runs: {
                        create: mockCreateRun,
                        retrieve: mockRetrieveRun,
                    },
                },
            };
        },
    };
});

describe('OpenAI Service', () => {
    const apiKey = 'test-api-key';
    const threadId = 'thread_123';
    const assistantId = 'asst_123';
    const message = 'Hello world';
    const runId = 'run_123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createThread should call OpenAI API', async () => {
        mockCreateThread.mockResolvedValue({ id: threadId });
        const result = await createThread(apiKey);
        expect(result).toBe(threadId);
        expect(mockCreateThread).toHaveBeenCalled();
    });

    it('addMessage should call OpenAI API', async () => {
        await addMessage(apiKey, threadId, message);
        expect(mockCreateMessage).toHaveBeenCalledWith(threadId, {
            role: 'user',
            content: message,
        });
    });

    it('runAssistant should call OpenAI API', async () => {
        mockCreateRun.mockResolvedValue({ id: runId });
        const result = await runAssistant(apiKey, threadId, assistantId);
        expect(result).toBe(runId);
        expect(mockCreateRun).toHaveBeenCalledWith(threadId, {
            assistant_id: assistantId,
        });
    });

    it('pollRun should wait for completion', async () => {
        mockRetrieveRun
            .mockResolvedValueOnce({ status: 'queued' })
            .mockResolvedValueOnce({ status: 'in_progress' })
            .mockResolvedValueOnce({ status: 'completed' });

        await pollRun(apiKey, threadId, runId);
        expect(mockRetrieveRun).toHaveBeenCalledTimes(3);
    });

    it('pollRun should throw on failure', async () => {
        mockRetrieveRun.mockResolvedValue({ status: 'failed' });
        await expect(pollRun(apiKey, threadId, runId)).rejects.toThrow('Assistant run failed');
    });

    it('getAssistantResponse should return text content', async () => {
        mockListMessages.mockResolvedValue({
            data: [
                {
                    role: 'assistant',
                    content: [{ type: 'text', text: { value: 'Response text' } }],
                },
            ],
        });

        const result = await getAssistantResponse(apiKey, threadId);
        expect(result).toBe('Response text');
    });

    it('processMessage should orchestrate the flow correctly', async () => {
        // Setup mocks for full flow
        mockCreateThread.mockResolvedValue({ id: threadId });
        mockCreateRun.mockResolvedValue({ id: runId });
        mockRetrieveRun.mockResolvedValue({ status: 'completed' });
        mockListMessages.mockResolvedValue({
            data: [
                {
                    role: 'assistant',
                    content: [{ type: 'text', text: { value: 'Response text' } }],
                },
            ],
        });

        const result = await processMessage(apiKey, assistantId, message);

        expect(result).toEqual({
            message: 'Response text',
            threadId: threadId,
            runId: runId,
        });

        expect(mockCreateThread).toHaveBeenCalled();
        expect(mockCreateMessage).toHaveBeenCalledWith(threadId, { role: 'user', content: message });
        expect(mockCreateRun).toHaveBeenCalledWith(threadId, { assistant_id: assistantId });
        expect(mockRetrieveRun).toHaveBeenCalled();
        expect(mockListMessages).toHaveBeenCalled();
    });

    it('processMessage should reuse existing thread', async () => {
        // Setup mocks
        mockCreateRun.mockResolvedValue({ id: runId });
        mockRetrieveRun.mockResolvedValue({ status: 'completed' });
        mockListMessages.mockResolvedValue({
            data: [
                {
                    role: 'assistant',
                    content: [{ type: 'text', text: { value: 'Response text' } }],
                },
            ],
        });

        const existingThreadId = 'existing_thread_456';
        const result = await processMessage(apiKey, assistantId, message, existingThreadId);

        expect(result.threadId).toBe(existingThreadId);
        expect(mockCreateThread).not.toHaveBeenCalled();
        expect(mockCreateMessage).toHaveBeenCalledWith(existingThreadId, { role: 'user', content: message });
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, OPTIONS } from '@/app/api/chat-relay/openai/route';
import { NextRequest } from 'next/server';

// Mock dependencies
const { mockProcessMessage } = vi.hoisted(() => {
    return {
        mockProcessMessage: vi.fn(),
    };
});

vi.mock('@/lib/services/openai-service', () => ({
    processMessage: mockProcessMessage,
}));

describe('Preview Relay API (OpenAI)', () => {
    const apiKey = 'sk-test-key';
    const workflowId = 'asst_test';
    const message = 'Hello preview';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (body: any) => {
        return new NextRequest('http://localhost/api/chat-relay/openai', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    it('should handle OPTIONS preflight request', async () => {
        const res = await OPTIONS();
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should return 400 if not in preview mode', async () => {
        const req = createRequest({ message, apiKey, workflowId });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('This endpoint is for preview mode only');
    });

    it('should return 400 if message is missing', async () => {
        const req = createRequest({ previewMode: true, apiKey, workflowId });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Missing required field: message');
    });

    it('should return 400 if apiKey or workflowId is missing', async () => {
        const req = createRequest({ previewMode: true, message });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe('Preview mode requires apiKey and workflowId');
    });

    it('should process message successfully in preview mode', async () => {
        mockProcessMessage.mockResolvedValue({
            message: 'Preview response',
            threadId: 'thread_preview',
            runId: 'run_preview',
        });

        const req = createRequest({
            previewMode: true,
            message,
            apiKey,
            workflowId,
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.output).toBe('Preview response');
        expect(data.threadId).toBe('thread_preview');
        expect(data.runId).toBe('run_preview');
        expect(mockProcessMessage).toHaveBeenCalledWith(apiKey, workflowId, message, undefined);
    });

    it('should reuse threadId if provided', async () => {
        mockProcessMessage.mockResolvedValue({
            message: 'Continue response',
            threadId: 'thread_existing',
            runId: 'run_2',
        });

        const req = createRequest({
            previewMode: true,
            message,
            apiKey,
            workflowId,
            threadId: 'thread_existing',
        });

        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(mockProcessMessage).toHaveBeenCalledWith(apiKey, workflowId, message, 'thread_existing');
    });

    it('should handle service errors gracefully', async () => {
        mockProcessMessage.mockRejectedValue(new Error('OpenAI API error'));

        const req = createRequest({
            previewMode: true,
            message,
            apiKey,
            workflowId,
        });

        const res = await POST(req);

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toBe('OpenAI API error');
    });
});

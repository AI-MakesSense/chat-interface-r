import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/chat-relay/route';
import { NextRequest } from 'next/server';

// Mock dependencies
const { mockGetWidgetById, mockGetLicenseByKey, mockProcessMessage } = vi.hoisted(() => {
    return {
        mockGetWidgetById: vi.fn(),
        mockGetLicenseByKey: vi.fn(),
        mockProcessMessage: vi.fn(),
    };
});

vi.mock('@/lib/db/queries', () => ({
    getWidgetById: mockGetWidgetById,
    getLicenseByKey: mockGetLicenseByKey,
}));

vi.mock('@/lib/services/openai-service', () => ({
    processMessage: mockProcessMessage,
}));

// Mock fetch for N8n relay
global.fetch = vi.fn();

describe('Production Relay API', () => {
    const widgetId = 'widget_123';
    const licenseKey = 'license_abc';
    const message = 'Hello';
    const licenseId = 'lic_123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createRequest = (body: any) => {
        return new NextRequest('http://localhost/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    it('should return 400 if required fields are missing', async () => {
        const req = createRequest({ widgetId });
        const res = await POST(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain('Missing required fields');
    });

    it('should return 404 if widget not found', async () => {
        mockGetWidgetById.mockResolvedValue(null);
        const req = createRequest({ widgetId, licenseKey, message });
        const res = await POST(req);
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toBe('Widget not found');
    });

    it('should return 403 if license does not match widget', async () => {
        mockGetWidgetById.mockResolvedValue({ id: widgetId, licenseId: 'other_license' });
        mockGetLicenseByKey.mockResolvedValue({ id: licenseId });
        const req = createRequest({ widgetId, licenseKey, message });
        const res = await POST(req);
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toContain('Unauthorized');
    });

    it('should handle AgentKit provider correctly', async () => {
        mockGetWidgetById.mockResolvedValue({
            id: widgetId,
            licenseId: licenseId,
            config: {
                connection: {
                    provider: 'agentkit',
                    agentKitApiKey: 'sk-test',
                    agentKitWorkflowId: 'asst_test',
                },
            },
        });
        mockGetLicenseByKey.mockResolvedValue({ id: licenseId });
        mockProcessMessage.mockResolvedValue({
            message: 'Agent response',
            threadId: 'thread_1',
            runId: 'run_1',
        });

        const req = createRequest({ widgetId, licenseKey, message });
        const res = await POST(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.output).toBe('Agent response');
        expect(mockProcessMessage).toHaveBeenCalledWith('sk-test', 'asst_test', message, undefined);
    });

    it('should return error if AgentKit config is missing', async () => {
        mockGetWidgetById.mockResolvedValue({
            id: widgetId,
            licenseId: licenseId,
            config: {
                connection: {
                    provider: 'agentkit',
                    // Missing API key
                },
            },
        });
        mockGetLicenseByKey.mockResolvedValue({ id: licenseId });

        const req = createRequest({ widgetId, licenseKey, message });
        const res = await POST(req);

        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data.error).toContain('AgentKit Workflow ID or API Key not configured');
    });
});

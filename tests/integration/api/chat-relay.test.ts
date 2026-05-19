/**
 * @jest-environment node
 */
import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
const mockGetWidgetById = jest.fn();
const mockGetWidgetByKeyWithUser = jest.fn();
let POST: (request: NextRequest) => Promise<Response>;

jest.mock('@/lib/db/queries', () => ({
    getWidgetById: mockGetWidgetById,
    getWidgetByKeyWithUser: mockGetWidgetByKeyWithUser,
}));
// Mock fetch
global.fetch = jest.fn() as any;

describe('Chat Relay API', () => {
    const mockWidgetId = '123e4567-e89b-12d3-a456-426614174000';
    const mockLegacyLicenseKey = 'test-license-key-12345';
    const mockWidgetKey = 'A1B2C3D4E5F6G7H8';
    const mockWebhookUrl = 'https://n8n.example.com/webhook/test';
    const validLegacyPayload = {
        widgetId: mockWidgetId,
        licenseKey: mockLegacyLicenseKey,
        message: 'Hello',
        sessionId: 'session-123',
    };
    const widgetWithN8nConfig = {
        id: mockWidgetId,
        config: {
            connection: {
                webhookUrl: mockWebhookUrl,
            },
        },
    };

    beforeAll(async () => {
        const routeModule = await import('@/app/api/chat-relay/route');
        POST = routeModule.POST;
    });
    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            headers: { get: () => 'application/json' },
            text: async () => JSON.stringify({ response: 'Hello from N8n' }),
        });
    });

    it('relays a legacy payload by widgetId', async () => {
        mockGetWidgetById.mockResolvedValue(widgetWithN8nConfig as any);
        const req = new NextRequest('http://localhost:3000/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify(validLegacyPayload),
        });

        const res = await POST(req);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data).toEqual({ response: 'Hello from N8n' });
        expect(mockGetWidgetById).toHaveBeenCalledWith(mockWidgetId);
        expect(global.fetch).toHaveBeenCalledWith(mockWebhookUrl, expect.objectContaining({
            method: 'POST',
        }));

        const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(sentBody).toMatchObject({
            message: 'Hello',
            chatInput: 'Hello',
            widgetId: mockWidgetId,
            licenseKey: mockLegacyLicenseKey,
            metadata: { tier: 'free' },
        });
    });

    it('relays a schema v2 payload by widgetKey and includes user tier metadata', async () => {
        mockGetWidgetByKeyWithUser.mockResolvedValue({
            ...widgetWithN8nConfig,
            user: { tier: 'pro' },
        } as any);
        const req = new NextRequest('http://localhost:3000/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify({
                licenseKey: mockWidgetKey,
                message: 'Hello from widget key',
            }),
        });

        const res = await POST(req);
        expect(res.status).toBe(200);
        expect(mockGetWidgetByKeyWithUser).toHaveBeenCalledWith(mockWidgetKey);

        const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(sentBody.metadata).toMatchObject({ tier: 'pro' });
    });

    it('returns 404 when widget cannot be found', async () => {
        mockGetWidgetById.mockResolvedValue(null);
        const req = new NextRequest('http://localhost:3000/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify(validLegacyPayload),
        });

        const res = await POST(req);
        expect(res.status).toBe(404);
    });

    it('returns 400 when required fields are missing', async () => {
        const req = new NextRequest('http://localhost:3000/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify({ message: 'missing license key' }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
    });

    it('returns 500 when webhook url is missing from widget config', async () => {
        mockGetWidgetById.mockResolvedValue({
            ...widgetWithN8nConfig,
            config: { connection: {} },
        } as any);

        const req = new NextRequest('http://localhost:3000/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify(validLegacyPayload),
        });

        const res = await POST(req);
        expect(res.status).toBe(500);
    });
    it('returns 502 when n8n request fails due to network error', async () => {
        mockGetWidgetById.mockResolvedValue(widgetWithN8nConfig as any);
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network failure'));

        const req = new NextRequest('http://localhost:3000/api/chat-relay', {
            method: 'POST',
            body: JSON.stringify(validLegacyPayload),
        });

        const res = await POST(req);
        expect(res.status).toBe(502);
    });
});

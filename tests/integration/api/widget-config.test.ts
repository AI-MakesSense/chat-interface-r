/**
 * Widget Configuration API Integration Tests
 *
 * Endpoint: GET /api/widget/:license/config
 * Purpose: Validates license and returns widget configuration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { db } from '@/lib/db/client';
import { users, licenses, widgets } from '@/lib/db/schema';
import { GET } from '@/app/api/widget/[license]/config/route';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

describe('GET /api/widget/:license/config - Widget Configuration', () => {
    // Test data
    let testUser: any;
    let activeLicense: any;
    let widget: any;

    beforeAll(async () => {
        // Clean up any existing test data
        await db.delete(widgets).execute();
        await db.delete(licenses).execute();
        await db.delete(users).where(eq(users.email, 'widgetconfig@test.com')).execute();

        // Create test user
        const [user] = await db
            .insert(users)
            .values({
                email: 'widgetconfig@test.com',
                passwordHash: 'not-used-for-widget-config',
                name: 'Widget Config Tester',
                emailVerified: true,
            })
            .returning();
        testUser = user;

        // Create active license
        const [license] = await db
            .insert(licenses)
            .values({
                userId: testUser.id,
                licenseKey: crypto.randomBytes(16).toString('hex'),
                tier: 'pro',
                widgetLimit: 3,
                domains: ['example.com'],
                domainLimit: 1,
                brandingEnabled: false,
                status: 'active',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            })
            .returning();
        activeLicense = license;

        // Create widget
        const [w] = await db
            .insert(widgets)
            .values({
                licenseId: activeLicense.id,
                name: 'Test Widget',
                status: 'active',
                config: {
                    branding: {
                        companyName: 'Test Company',
                        welcomeText: 'Welcome!',
                    },
                    style: {
                        theme: 'light',
                        primaryColor: '#0066FF',
                        position: 'bottom-right',
                    },
                    features: {
                        fileAttachmentsEnabled: true,
                    },
                    connection: {
                        webhookUrl: 'https://n8n.example.com/webhook',
                    },
                },
            })
            .returning();
        widget = w;
    });

    afterAll(async () => {
        // Clean up test data
        await db.delete(widgets).execute();
        await db.delete(licenses).where(eq(licenses.userId, testUser.id)).execute();
        await db.delete(users).where(eq(users.id, testUser.id)).execute();
    });

    it('should return widget configuration for valid license', async () => {
        const request = new Request(
            `http://localhost:3000/api/widget/${activeLicense.licenseKey}/config`,
            {
                method: 'GET',
                headers: {
                    'Origin': 'https://example.com',
                },
            }
        );

        const response = await GET(request, { params: Promise.resolve({ license: activeLicense.licenseKey }) });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.license.key).toBe(activeLicense.licenseKey);
        expect(data.branding.companyName).toBe('Test Company');
        expect(data.style.primaryColor).toBe('#0066FF');
        // Webhook URL should NOT be exposed
        expect(data.connection.webhookUrl).toBe('');
        // Relay endpoint should be present
        expect(data.connection.relayEndpoint).toContain('/api/chat-relay');
    });

    it('should return 404 for invalid license', async () => {
        const request = new Request(
            'http://localhost:3000/api/widget/invalid-key/config',
            {
                method: 'GET',
            }
        );

        const response = await GET(request, { params: Promise.resolve({ license: 'invalid-key' }) });

        expect(response.status).toBe(404);
    });
});

/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/w/[widgetKey]/route';

describe('Widget Serve Fail-Closed Behavior', () => {
  it('rejects script request when both origin and referer are missing', async () => {
    const request = new NextRequest('https://chat-interface-r.vercel.app/w/ABCD1234EFGH5678.js', {
      method: 'GET',
    });

    const response = await GET(request, {
      params: Promise.resolve({ widgetKey: 'ABCD1234EFGH5678' }),
    });

    expect(response.status).toBe(403);
    const script = await response.text();
    expect(script).toContain("window.__CHAT_WIDGET_ERROR__ = 'REFERER_MISSING'");
  });
});

/**
 * @jest-environment jsdom
 */
import { ChatRenderer } from '@/widget/src/renderers/chat/chat-renderer';

jest.mock('@/widget/src/widget', () => ({
  createChatWidget: jest.fn(),
}));

import { createChatWidget } from '@/widget/src/widget';

describe('ChatRenderer', () => {
  beforeEach(() => {
    (createChatWidget as jest.Mock).mockClear();
  });

  it('forwards mount() to createChatWidget with the runtime config', async () => {
    const renderer = new ChatRenderer();
    const config = {
      uiConfig: { branding: { companyName: 'X' } },
      relay: { relayUrl: 'http://r', widgetId: 'w', licenseKey: 'k' },
      display: { mode: 'popup' as const },
    } as any;
    const container = document.createElement('div');

    await renderer.mount(config, container);

    expect(createChatWidget).toHaveBeenCalledTimes(1);
    expect(createChatWidget).toHaveBeenCalledWith(config);
  });

  it('dispose() resolves (chat lifecycle is owned by createChatWidget)', async () => {
    const renderer = new ChatRenderer();
    await expect(renderer.dispose()).resolves.toBeUndefined();
  });
});

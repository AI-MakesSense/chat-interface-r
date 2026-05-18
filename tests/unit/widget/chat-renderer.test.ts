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

  it('forwards mount() to createChatWidget with the runtime config (container is intentionally not passed — createChatWidget self-attaches)', async () => {
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

  it('accepts a fetcher option and still calls createChatWidget with the config (fetcher is ignored by chat renderer)', async () => {
    const renderer = new ChatRenderer();
    const config = {
      uiConfig: { branding: { companyName: 'Y' } },
      relay: { relayUrl: 'http://r', widgetId: 'w2', licenseKey: 'k2' },
    } as any;
    const container = document.createElement('div');
    const stubFetcher = async () => new Response('{}', { status: 200 });

    await renderer.mount(config, container, { fetcher: stubFetcher });

    expect(createChatWidget).toHaveBeenCalledTimes(1);
    expect(createChatWidget).toHaveBeenCalledWith(config);
  });

  it('dispose() invokes destroy() on the cleanup handle returned by createChatWidget', async () => {
    const destroy = jest.fn();
    (createChatWidget as jest.Mock).mockReturnValue({ destroy });

    const renderer = new ChatRenderer();
    await renderer.mount({} as any, document.createElement('div'));
    await renderer.dispose();

    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('dispose() is safe to call before mount (no cleanup handle yet)', async () => {
    const renderer = new ChatRenderer();
    await expect(renderer.dispose()).resolves.toBeUndefined();
  });

  it('dispose() is idempotent — second call does not re-invoke destroy', async () => {
    const destroy = jest.fn();
    (createChatWidget as jest.Mock).mockReturnValue({ destroy });

    const renderer = new ChatRenderer();
    await renderer.mount({} as any, document.createElement('div'));
    await renderer.dispose();
    await renderer.dispose();

    expect(destroy).toHaveBeenCalledTimes(1);
  });
});

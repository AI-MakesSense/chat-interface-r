/**
 * Preview Bridge Tests (jsdom)
 *
 * Verifies the configurator preview bridge:
 *  - returns false (inert) when the page URL has no ?preview flag, AND adds no
 *    message listener / posts nothing
 *  - returns true and announces readiness when ?preview=1
 *  - mounts the real renderer on a widget:config message (a [data-n8n-widget-root]
 *    element appears) and posts widget:mounted to the parent
 *  - on a mount error: posts widget:error, stops the ready-interval, and leaves no
 *    orphan [data-n8n-widget-root] in the DOM
 *
 * window.parent.postMessage is mocked. window.location.search is set by redefining
 * window.location (jsdom). createRenderer is mocked so the error test can inject a
 * renderer whose mount() rejects, while other tests use the real implementation.
 */

import { createRenderer } from '@/widget/src/core/create-renderer';
import { initPreviewBridge } from '@/widget/src/preview/preview-bridge';

// Mock createRenderer as a jest.fn that delegates to the real implementation by
// default; the error-path test overrides it with mockReturnValueOnce.
jest.mock('@/widget/src/core/create-renderer', () => {
  const actual = jest.requireActual('@/widget/src/core/create-renderer');
  return { createRenderer: jest.fn(actual.createRenderer) };
});

const mockCreateRenderer = createRenderer as jest.MockedFunction<typeof createRenderer>;

function setSearch(search: string): void {
  // jsdom: redefine window.location.search without a full navigation.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, search, href: `http://localhost/${search}` },
  });
}

describe('initPreviewBridge', () => {
  let parentPostMessage: jest.Mock;
  // Track message listeners the bridge registers so we can detach them between tests —
  // each initPreviewBridge() call adds a permanent listener, and a stale one from a
  // prior test would otherwise re-handle a dispatched widget:config (cross-test bleed).
  let registeredMessageListeners: EventListenerOrEventListenerObject[];
  const realAddEventListener = window.addEventListener.bind(window);

  beforeEach(() => {
    document.body.innerHTML = '';
    parentPostMessage = jest.fn();
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: parentPostMessage },
    });
    delete (window as any).N8N_LICENSE_FLAGS;

    registeredMessageListeners = [];
    jest.spyOn(window, 'addEventListener').mockImplementation((type, listener, opts) => {
      if (type === 'message' && listener) registeredMessageListeners.push(listener);
      return realAddEventListener(type, listener as EventListener, opts);
    });
  });

  afterEach(() => {
    for (const l of registeredMessageListeners) {
      window.removeEventListener('message', l);
    }
    jest.restoreAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('is inert without ?preview — adds no message listener and posts nothing', () => {
    setSearch('');

    expect(initPreviewBridge()).toBe(false);

    // The addEventListener spy (installed in beforeEach) records message listeners.
    expect(registeredMessageListeners).toHaveLength(0);
    expect(parentPostMessage).not.toHaveBeenCalled();
  });

  it('returns true and announces widget:ready when ?preview=1', () => {
    jest.useFakeTimers();
    setSearch('?preview=1');

    expect(initPreviewBridge()).toBe(true);
    // Immediate ready announcement.
    expect(parentPostMessage).toHaveBeenCalledWith(
      { type: 'widget:ready' },
      '*'
    );
  });

  it('mounts the real renderer on a widget:config message and sets license flags', async () => {
    setSearch('?preview=1');
    expect(initPreviewBridge()).toBe(true);

    // A minimal translated runtime uiConfig (the shape the renderers consume).
    const config = {
      kind: 'chat',
      branding: {
        companyName: 'Preview Co',
        welcomeText: 'Hi',
        firstMessage: 'Hello!',
      },
      features: {
        fileAttachmentsEnabled: false,
        allowedExtensions: [],
        maxFileSizeKB: 10240,
      },
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'widget:config', kind: 'chat', config, tier: 'pro' },
      })
    );

    // The message handler is async; allow microtasks/await to flush.
    await new Promise((r) => setTimeout(r, 0));

    expect(document.querySelector('[data-n8n-widget-root]')).not.toBeNull();
    expect(parentPostMessage).toHaveBeenCalledWith(
      { type: 'widget:mounted' },
      '*'
    );
    // pro tier removes branding; flags global is set for the renderers to read.
    expect((window as any).N8N_LICENSE_FLAGS).toEqual({
      tier: 'pro',
      brandingEnabled: false,
    });
  });

  it('on mount error: posts widget:error, stops the ready-interval, and leaves no orphan root', async () => {
    jest.useFakeTimers();
    setSearch('?preview=1');

    // Inject a renderer whose mount() rejects.
    mockCreateRenderer.mockReturnValueOnce({
      mount: jest.fn().mockRejectedValue(new Error('boom')),
      dispose: jest.fn().mockResolvedValue(undefined),
    });

    expect(initPreviewBridge()).toBe(true);
    parentPostMessage.mockClear(); // ignore the initial widget:ready

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'widget:config', kind: 'chat', config: {}, tier: 'agency' },
      })
    );

    // Flush the async handler's microtasks (real timers for the await chain).
    jest.useRealTimers();
    await new Promise((r) => setTimeout(r, 0));

    expect(parentPostMessage).toHaveBeenCalledWith(
      { type: 'widget:error', message: 'boom' },
      '*'
    );
    // No orphan container left behind.
    expect(document.querySelector('[data-n8n-widget-root]')).toBeNull();

    // Ready-interval must have stopped: no further widget:ready after the error.
    parentPostMessage.mockClear();
    jest.useFakeTimers();
    jest.advanceTimersByTime(1000);
    const readyAfterError = parentPostMessage.mock.calls.some(
      (c) => c[0] && c[0].type === 'widget:ready'
    );
    expect(readyAfterError).toBe(false);
  });
});

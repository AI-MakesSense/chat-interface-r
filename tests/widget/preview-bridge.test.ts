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
 *  - ignores widget:config from any source other than window.parent (the iframe is
 *    sandboxed/null-origin, so source identity is the strongest available check)
 *  - serializes concurrent configs: a config arriving while a mount is in flight is
 *    queued (newest wins) and mounted only after the in-flight mount settles
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

// Flush the async message-handler chain (multiple awaits) — a macrotask runs only
// after the entire microtask queue has drained.
function flushAsync(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
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
        // The bridge only accepts configs whose source is the embedding parent.
        source: window.parent,
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
        source: window.parent,
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

  it('ignores widget:config from a non-parent source', async () => {
    setSearch('?preview=1');
    expect(initPreviewBridge()).toBe(true);
    mockCreateRenderer.mockClear();
    parentPostMessage.mockClear();

    // source defaults to null when omitted (jsdom) — not the parent.
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'widget:config', kind: 'chat', config: {}, tier: 'agency' },
      })
    );
    // An explicit non-parent source (window.parent is a distinct fake object here,
    // so window !== window.parent and the guard is exercised in both directions:
    // the parent-sourced mount test above passes it, this one must be rejected).
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'widget:config', kind: 'chat', config: {}, tier: 'agency' },
        source: window,
      })
    );
    await flushAsync();

    expect(document.querySelector('[data-n8n-widget-root]')).toBeNull();
    expect(mockCreateRenderer).not.toHaveBeenCalled();
    expect(parentPostMessage).not.toHaveBeenCalledWith(
      { type: 'widget:mounted' },
      '*'
    );
  });

  it('serializes concurrent configs: latest pending config mounts after the in-flight mount settles', async () => {
    setSearch('?preview=1');

    const mount1 = deferred();
    const mount2 = deferred();
    const order: string[] = [];
    const renderer1 = {
      mount: jest.fn().mockImplementation(() => {
        order.push('mount1');
        return mount1.promise;
      }),
      dispose: jest.fn().mockImplementation(() => {
        order.push('dispose1');
      }),
    };
    const renderer2 = {
      mount: jest.fn().mockImplementation(() => {
        order.push('mount2');
        return mount2.promise;
      }),
      dispose: jest.fn(),
    };
    mockCreateRenderer.mockClear();
    mockCreateRenderer
      .mockReturnValueOnce(renderer1 as any)
      .mockReturnValueOnce(renderer2 as any);

    expect(initPreviewBridge()).toBe(true);

    const post = (id: string) =>
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'widget:config', kind: 'chat', config: { id }, tier: 'agency' },
          source: window.parent,
        })
      );

    post('A');
    post('B'); // arrives while mount A is in flight — superseded by C below
    post('C');
    await flushAsync();

    // While mount A is unresolved, B and C must NOT interleave a teardown/mount.
    expect(mockCreateRenderer).toHaveBeenCalledTimes(1);
    expect(renderer1.mount).toHaveBeenCalledTimes(1);
    expect((renderer1.mount.mock.calls[0][0] as any).uiConfig).toEqual({ id: 'A' });

    mount1.resolve();
    await flushAsync();

    // After mount A settles: renderer1 disposed, then ONLY the latest config (C)
    // mounts — the intermediate config B is dropped.
    expect(renderer1.dispose).toHaveBeenCalledTimes(1);
    expect(mockCreateRenderer).toHaveBeenCalledTimes(2);
    expect(renderer2.mount).toHaveBeenCalledTimes(1);
    expect((renderer2.mount.mock.calls[0][0] as any).uiConfig).toEqual({ id: 'C' });
    expect(order).toEqual(['mount1', 'dispose1', 'mount2']);

    mount2.resolve();
    await flushAsync();
    // B never produced a mount of its own.
    expect(mockCreateRenderer).toHaveBeenCalledTimes(2);
    expect(parentPostMessage).toHaveBeenCalledWith({ type: 'widget:mounted' }, '*');
  });
});

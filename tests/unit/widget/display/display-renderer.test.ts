/**
 * @jest-environment jsdom
 */
import { DisplayRenderer } from '@/widget/src/renderers/display/display-renderer';

const baseConfig: any = {
  uiConfig: {
    kind: 'display',
    branding: { companyName: 'Acme', brandingEnabled: true },
    theme: { colorScheme: 'light', radius: 'medium', density: 'normal',
             color: { accent: '#06f', surface: '#fff', text: '#111', subText: '#666', border: '#eee' } },
    display: { position: 'right', defaultOpen: true,
               header: { title: 'Required documents', showCount: true },
               emptyMessage: 'Nothing here yet.' },
    connection: { provider: 'n8n', relayEndpoint: 'http://relay', triggerMessage: 'find docs',
                  captureContext: true, customContext: {} },
  },
  relay: { relayUrl: 'http://relay', widgetId: 'wid1', licenseKey: 'k1' },
};

describe('DisplayRenderer', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    fetchSpy = jest.spyOn(global, 'fetch' as any).mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] }), { status: 200 })
    ) as any);
  });

  afterEach(() => { fetchSpy.mockRestore(); });

  it('mounts a sidebar into the container', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    expect(document.body.querySelector('.cw-display-sidebar')).not.toBeNull();
  });

  it('POSTs to the relay endpoint with the auto-fire payload shape', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));

    expect(fetchSpy).toHaveBeenCalledWith('http://relay', expect.objectContaining({ method: 'POST' }));
    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call[1] as any).body as string);
    expect(body).toMatchObject({
      widgetId: 'wid1',
      licenseKey: 'k1',
      message: 'find docs',
      chatInput: 'find docs',
    });
    expect(body.context.pageUrl).toBeDefined();
    expect(body.metadata.tier).toBeDefined();
  });

  it('renders a doc card per document in the response', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(1);
  });

  it('renders the empty state when documents array is empty', async () => {
    fetchSpy.mockImplementation((async () => new Response(JSON.stringify({ documents: [] }), { status: 200 })) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.textContent).toContain('Nothing here yet.');
  });

  it('renders the error state when relay returns non-2xx', async () => {
    fetchSpy.mockImplementation((async () => new Response('boom', { status: 500 })) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelector('.cw-display-error')).not.toBeNull();
  });

  it('renders the error state when documents is missing/malformed', async () => {
    fetchSpy.mockImplementation((async () => new Response(JSON.stringify({ other: 'shape' }), { status: 200 })) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelector('.cw-display-error')).not.toBeNull();
  });

  it('dispose() removes the sidebar from the DOM', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await r.dispose();
    expect(document.body.querySelector('.cw-display-sidebar')).toBeNull();
  });

  // ── Scheme-validation tests (P0 XSS fix) ─────────────────────────────────

  it('drops a javascript: URL and renders 0 cards', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'X', url: 'javascript:alert(1)' }] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(0);
  });

  it('drops a data: URL and renders 0 cards', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'X', url: 'data:text/html,<script>alert(1)</script>' }] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(0);
  });

  it('drops a vbscript: URL and renders 0 cards', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'X', url: 'vbscript:msgbox' }] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(0);
  });

  it('drops a blob: URL and renders 0 cards', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'X', url: 'blob:https://x/abc-123' }] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(0);
  });

  it('drops a malformed URL string and renders 0 cards', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'X', url: 'not-a-url' }] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(0);
  });

  it('renders only the valid doc when array contains one valid and one malicious URL', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({
        documents: [
          { title: 'Safe', url: 'https://example.com/doc.pdf' },
          { title: 'Evil', url: 'javascript:alert(1)' },
        ],
      }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    const cards = document.body.querySelectorAll('.cw-display-card');
    expect(cards.length).toBe(1);
    expect((cards[0] as HTMLAnchorElement).href).toBe('https://example.com/doc.pdf');
  });

  it('accepts an http: URL (not just https:)', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'PDF', url: 'http://example.com/a.pdf' }] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(1);
  });

  // ── Injected-fetcher tests (U5) ───────────────────────────────────────────

  it('uses the stub fetcher passed via options instead of globalThis.fetch', async () => {
    const stubDocs = [{ title: 'Stub doc', url: 'https://stub.example.com/doc.pdf' }];
    const stubFetcher = jest.fn(async () =>
      new Response(JSON.stringify({ documents: stubDocs }), { status: 200 })
    );

    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body, { fetcher: stubFetcher });
    await new Promise((res) => setTimeout(res, 0));

    // The injected stub was used
    expect(stubFetcher).toHaveBeenCalledTimes(1);
    expect(stubFetcher).toHaveBeenCalledWith('http://relay', expect.objectContaining({ method: 'POST' }));
    // globalThis.fetch (the spy) was NOT called
    expect(fetchSpy).not.toHaveBeenCalled();
    // The doc card rendered from the stub response
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(1);
  });

  it('falls back to globalThis.fetch when no fetcher option is provided', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT modify globalThis.fetch — identity is preserved before and after mount', async () => {
    const fetchBefore = globalThis.fetch;
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    const fetchAfter = globalThis.fetch;

    expect(fetchAfter).toBe(fetchBefore);
  });

  // ── Theme injection tests (U8 #10) ────────────────────────────────────────

  it('injects --cw-color-accent on the sidebar root from theme.color.accent', async () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.uiConfig.theme.color.accent = '#ff00ff';
    const r = new DisplayRenderer();
    await r.mount(cfg, document.body);
    const root = document.body.querySelector('.cw-display-sidebar') as HTMLElement;
    expect(root.style.getPropertyValue('--cw-color-accent')).toBe('#ff00ff');
  });

  it('injects --cw-color-surface on the sidebar root from theme.color.surface', async () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.uiConfig.theme.color.surface = '#abcdef';
    const r = new DisplayRenderer();
    await r.mount(cfg, document.body);
    const root = document.body.querySelector('.cw-display-sidebar') as HTMLElement;
    expect(root.style.getPropertyValue('--cw-color-surface')).toBe('#abcdef');
  });

  it('injects --cw-color-text, --cw-color-subText, --cw-color-border on the sidebar root', async () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.uiConfig.theme.color.text = '#101010';
    cfg.uiConfig.theme.color.subText = '#202020';
    cfg.uiConfig.theme.color.border = '#303030';
    const r = new DisplayRenderer();
    await r.mount(cfg, document.body);
    const root = document.body.querySelector('.cw-display-sidebar') as HTMLElement;
    expect(root.style.getPropertyValue('--cw-color-text')).toBe('#101010');
    expect(root.style.getPropertyValue('--cw-color-subText')).toBe('#202020');
    expect(root.style.getPropertyValue('--cw-color-border')).toBe('#303030');
  });

  // ── Fetch timeout tests (U8 #9) ───────────────────────────────────────────

  it('renders an error state with timeout message when the fetcher stalls past 8s', async () => {
    jest.useFakeTimers();
    try {
      // Fetcher that never resolves on its own — it only rejects when aborted.
      const stallFetcher = jest.fn(
        (_url: any, init?: any) =>
          new Promise<Response>((_resolve, reject) => {
            const sig: AbortSignal | undefined = init?.signal;
            if (sig) {
              sig.addEventListener('abort', () => {
                const err: any = new Error('aborted');
                err.name = 'AbortError';
                reject(err);
              });
            }
          })
      );

      const r = new DisplayRenderer();
      const mountPromise = r.mount(baseConfig, document.body, { fetcher: stallFetcher });

      // Advance past the 8s timeout. Then drain microtasks so the catch handler
      // can run after the AbortError rejects.
      jest.advanceTimersByTime(8001);
      await Promise.resolve();
      await Promise.resolve();
      await mountPromise;

      const errEl = document.body.querySelector('.cw-display-error');
      expect(errEl).not.toBeNull();
      expect(errEl?.textContent).toContain('timed out');
    } finally {
      jest.useRealTimers();
    }
  });

  // ── Retry race guard test (U8 #11) ────────────────────────────────────────

  it('isFiring guard prevents two synchronous fire() calls from both running', async () => {
    // Hold the first fetch open until we release it, so the second sync
    // call sees isFiring === true and returns early.
    let release!: (value: Response) => void;
    const heldFetcher = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        })
    );

    const r = new DisplayRenderer();
    // mount() awaits fire(), but fire() is paused on the held promise — so the
    // mount promise also hangs. We don't await mount; we observe state below.
    const mountPromise = r.mount(baseConfig, document.body, { fetcher: heldFetcher });

    // Synchronously trigger a second fire() by calling the retry path.
    // Since we can't easily reach the retry button while in loading state,
    // we exercise the guard directly via the private member. The behavior we're
    // asserting is the call-count invariant.
    await Promise.resolve();
    // At this point the first fetcher call has been made, and isFiring === true.
    // A second invocation of the private fire() must early-return without
    // calling the fetcher again.
    // @ts-expect-error — accessing private for guard test
    await (r as any).fire();
    expect(heldFetcher).toHaveBeenCalledTimes(1);

    // Release the first fetch so mount() resolves and we can clean up.
    release(new Response(JSON.stringify({ documents: [] }), { status: 200 }));
    await mountPromise;
  });

  // ── captureContext toggle tests (U8 #12) ──────────────────────────────────

  it('sends empty context when uiConfig.connection.captureContext === false', async () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.uiConfig.connection.captureContext = false;

    const r = new DisplayRenderer();
    await r.mount(cfg, document.body);
    await new Promise((res) => setTimeout(res, 0));

    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call[1] as any).body as string);
    expect(body.context).toEqual({});
  });

  it('sends captured page context when captureContext === true', async () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    cfg.uiConfig.connection.captureContext = true;

    const r = new DisplayRenderer();
    await r.mount(cfg, document.body);
    await new Promise((res) => setTimeout(res, 0));

    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call[1] as any).body as string);
    expect(body.context.pageUrl).toBeDefined();
    expect(body.context.domain).toBeDefined();
  });

  it('sends captured page context when captureContext is unset (defaults to capture)', async () => {
    const cfg = JSON.parse(JSON.stringify(baseConfig));
    delete cfg.uiConfig.connection.captureContext;

    const r = new DisplayRenderer();
    await r.mount(cfg, document.body);
    await new Promise((res) => setTimeout(res, 0));

    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call[1] as any).body as string);
    expect(body.context.pageUrl).toBeDefined();
  });

  // ── parseDocuments hardening tests (U9 #14) ──────────────────────────────

  it('renders error state when all documents have malicious URLs (all-dropped → error)', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({
        documents: [
          { title: 'a', url: 'javascript:alert(1)' },
          { title: 'b', url: 'javascript:void(0)' },
        ],
      }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    // All items dropped → parseDocuments returns null → error state
    expect(document.body.querySelector('.cw-display-error')).not.toBeNull();
    expect(document.body.querySelector('.cw-display-empty')).toBeNull();
  });

  it('renders empty state (not error) when documents array is empty []', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [] }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    // Empty-by-design: parseDocuments returns [] → empty state
    expect(document.body.querySelector('.cw-display-empty')).not.toBeNull();
    expect(document.body.querySelector('.cw-display-error')).toBeNull();
  });

  it('renders only the valid card when array contains one valid and one javascript: URL', async () => {
    fetchSpy.mockImplementation((async () =>
      new Response(JSON.stringify({
        documents: [
          { title: 'Good', url: 'https://example.com/doc.pdf' },
          { title: 'Bad', url: 'javascript:alert(1)' },
        ],
      }), { status: 200 })
    ) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((res) => setTimeout(res, 0));
    const cards = document.body.querySelectorAll('.cw-display-card');
    expect(cards.length).toBe(1);
    expect((cards[0] as HTMLAnchorElement).href).toBe('https://example.com/doc.pdf');
  });

  it('calls console.warn once with drop count when an invalid item is dropped', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      fetchSpy.mockImplementation((async () =>
        new Response(JSON.stringify({
          documents: [
            { title: 'Safe', url: 'https://example.com/safe.pdf' },
            { title: 'Malicious', url: 'javascript:alert(1)' },
          ],
        }), { status: 200 })
      ) as any);
      const r = new DisplayRenderer();
      await r.mount(baseConfig, document.body);
      await new Promise((res) => setTimeout(res, 0));

      const warnCalls = warnSpy.mock.calls.filter((args) =>
        typeof args[0] === 'string' && args[0].includes('Dropped')
      );
      expect(warnCalls.length).toBe(1);
      expect(warnCalls[0][0]).toMatch(/Dropped 1 invalid document/);
    } finally {
      warnSpy.mockRestore();
    }
  });

  // ── NPE guard test (U8 #13) ───────────────────────────────────────────────

  it('does not throw when dispose() runs before the fetch resolves', async () => {
    let release!: (value: Response) => void;
    const heldFetcher = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        })
    );

    const r = new DisplayRenderer();
    const mountPromise = r.mount(baseConfig, document.body, { fetcher: heldFetcher });
    await Promise.resolve();

    // Dispose while the fetch is still in flight — this nulls this.sidebar
    // and this.runtimeConfig, then aborts the in-flight controller.
    await r.dispose();

    // Now release the fetch. The renderer's catch handler should receive an
    // AbortError and bail silently; the success path (if it ran) would be
    // protected by the `?.` guards on updateCount.
    release(new Response(JSON.stringify({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] }), { status: 200 }));

    await expect(mountPromise).resolves.toBeUndefined();
    expect(document.body.querySelector('.cw-display-sidebar')).toBeNull();
  });
});

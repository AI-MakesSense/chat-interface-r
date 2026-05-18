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
});

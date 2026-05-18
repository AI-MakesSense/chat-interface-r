import type { Renderer, RendererMountOptions, WidgetFetcher } from '../../core/renderer';
import type { WidgetRuntimeConfig } from '../../types';
import { Sidebar } from './sidebar';
import { renderDocList } from './doc-list';
import { DISPLAY_WIDGET_CSS } from './styles';
import { resolveTriggerMessage, buildDisplayPayload } from '../../services/messaging/display-payload';
import { generateSessionId } from '../../utils/session-id-generator';
import type { DisplayDocument, DisplayRendererState } from './types';

const STYLE_ID = 'cw-display-styles';
const FETCH_TIMEOUT_MS = 8000;

/**
 * Display widget renderer. Mounts a floating sidebar, fires a single request
 * to the chat-relay on mount (with the same payload shape as the chat widget),
 * and renders the response as a list of clickable document cards.
 *
 * No SSE, no user interaction. One auto-fire per mount. dispose() aborts the
 * in-flight request and removes the sidebar from the DOM.
 */
export class DisplayRenderer implements Renderer {
  private sidebar: Sidebar | null = null;
  private abort: AbortController | null = null;
  private runtimeConfig: WidgetRuntimeConfig | null = null;
  private container: HTMLElement | null = null;
  private fetcher: WidgetFetcher = globalThis.fetch.bind(globalThis);
  private isFiring = false;

  async mount(
    runtimeConfig: WidgetRuntimeConfig,
    container: HTMLElement,
    options?: RendererMountOptions
  ): Promise<void> {
    this.fetcher = options?.fetcher ?? globalThis.fetch.bind(globalThis);
    this.runtimeConfig = runtimeConfig;
    this.container = container;

    this.injectStyles();

    const ui = runtimeConfig.uiConfig;
    this.sidebar = new Sidebar({
      widgetKey: runtimeConfig.relay.licenseKey,
      title: ui.display?.header?.title ?? 'Documents',
      position: ui.display?.position ?? 'right',
      defaultOpen: ui.display?.defaultOpen ?? true,
      showCount: ui.display?.header?.showCount ?? true,
    });
    this.sidebar.mount(container);

    // Apply theme color variables to the sidebar root so the display widget
    // visually reflects the user's configured theme (#10). Variable names
    // match those read by widget/src/renderers/display/styles.ts.
    this.applyThemeVariables();

    this.setState({ kind: 'loading' });

    await this.fire();
  }

  async dispose(): Promise<void> {
    this.abort?.abort();
    this.abort = null;
    this.sidebar?.dispose();
    this.sidebar = null;
    this.container = null;
    this.runtimeConfig = null;
  }

  private async fire(): Promise<void> {
    if (!this.runtimeConfig || !this.sidebar) return;
    // Retry race guard (#11): two synchronous calls won't both enter the body.
    // The AbortController dance still happens for retry-during-stall flows
    // because `isFiring` is only true *between* sync entry and the finally —
    // a fresh click after the first fire returns/throws will be allowed in.
    if (this.isFiring) return;
    this.isFiring = true;

    try {
      const ui = this.runtimeConfig.uiConfig;

      this.abort?.abort();
      this.abort = new AbortController();
      const userAbort = this.abort;

      const winCustom = (typeof window !== 'undefined' ? (window as any).ChatWidgetConfig?.customContext : undefined);
      const customContext = winCustom && typeof winCustom === 'object' ? winCustom : (ui.connection?.customContext ?? {});

      const tier = (typeof window !== 'undefined' ? (window as any).N8N_LICENSE_FLAGS?.tier : undefined) ?? 'unknown';

      // captureContext toggle (#12): when explicitly disabled, send an empty
      // context object instead of the captured page metadata.
      const context = ui.connection?.captureContext === false ? {} : this.capturePageContext();

      const payload = buildDisplayPayload({
        widgetId: this.runtimeConfig.relay.widgetId,
        licenseKey: this.runtimeConfig.relay.licenseKey,
        message: resolveTriggerMessage(ui.connection?.triggerMessage),
        sessionId: generateSessionId(),
        context,
        customContext,
        tier,
      });

      // Fetch timeout (#9): combine user/dispose abort with an 8s timeout so
      // a stalled relay surfaces an error rather than spinning forever. We
      // manage the timeout manually (rather than AbortSignal.timeout()) so
      // jest fake timers can drive it deterministically in tests.
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        userAbort.abort();
      }, FETCH_TIMEOUT_MS);

      try {
        const res = await this.fetcher(this.runtimeConfig.relay.relayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: userAbort.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          this.setState({ kind: 'error', message: `Request failed (${res.status}).` });
          return;
        }
        const data = await res.json();
        const docs = this.parseDocuments(data);
        if (!docs) {
          this.setState({ kind: 'error', message: 'Unexpected response shape.' });
          return;
        }
        if (docs.length === 0) {
          this.setState({ kind: 'empty' });
          // NPE guard (#13): dispose() may have nulled sidebar between the
          // await and here.
          this.sidebar?.updateCount(0);
          return;
        }
        this.setState({ kind: 'success', documents: docs });
        this.sidebar?.updateCount(docs.length);
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err?.name === 'AbortError') {
          if (timedOut) {
            this.setState({ kind: 'error', message: 'Request timed out.' });
            return;
          }
          // User- or dispose-initiated abort: silent.
          return;
        }
        this.setState({ kind: 'error', message: 'Network error. Please try again.' });
      }
    } finally {
      this.isFiring = false;
    }
  }

  private setState(state: DisplayRendererState): void {
    // NPE guard tightening (#13): no implicit non-null assertions.
    if (!this.sidebar || !this.runtimeConfig) return;
    const ui = this.runtimeConfig.uiConfig;
    renderDocList(this.sidebar.getBodyElement(), state, {
      emptyMessage: ui.display?.emptyMessage ?? 'No documents available.',
      onRetry: () => {
        this.setState({ kind: 'loading' });
        void this.fire();
      },
    });
  }

  private parseDocuments(data: unknown): DisplayDocument[] | null {
    if (!data || typeof data !== 'object') return null;
    const docs = (data as any).documents;
    if (!Array.isArray(docs)) return null;
    const out: DisplayDocument[] = [];
    for (const d of docs) {
      if (d && typeof d.title === 'string' && typeof d.url === 'string') {
        let parsed: URL;
        try {
          parsed = new URL(d.url);
        } catch {
          continue; // invalid URL — drop
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          continue; // disallowed scheme — drop
        }
        out.push({ title: d.title, url: d.url });
      }
    }
    return out;
  }

  private capturePageContext(): Record<string, unknown> {
    try {
      const u = new URL(window.location.href);
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: Object.fromEntries(u.searchParams),
        domain: window.location.hostname,
      };
    } catch {
      return {};
    }
  }

  /**
   * Theme injection (#10): set CSS variables on the sidebar root from
   * `runtimeConfig.uiConfig.theme.color`. Variable names match those read
   * by `widget/src/renderers/display/styles.ts`. Only the five color
   * variables consumed by the display widget's CSS are set here; radius
   * is left to the existing fallback values in styles.ts since the display
   * widget currently has no per-theme radius mapping wired (the CSS already
   * defaults --cw-radius-card and --cw-radius-button to sensible values).
   */
  private applyThemeVariables(): void {
    if (!this.sidebar || !this.runtimeConfig) return;
    const root = this.sidebar.getRootElement();
    const color = (this.runtimeConfig.uiConfig as any).theme?.color;
    if (!color || typeof color !== 'object') return;
    const map: Array<[string, unknown]> = [
      ['--cw-color-accent', color.accent],
      ['--cw-color-surface', color.surface],
      ['--cw-color-text', color.text],
      ['--cw-color-subText', color.subText],
      ['--cw-color-border', color.border],
    ];
    for (const [name, value] of map) {
      if (typeof value === 'string' && value.length > 0) {
        root.style.setProperty(name, value);
      }
    }
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = DISPLAY_WIDGET_CSS;
    document.head.appendChild(tag);
  }
}

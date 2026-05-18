import type { Renderer, RendererMountOptions, WidgetFetcher } from '../../core/renderer';
import type { WidgetRuntimeConfig } from '../../types';
import { Sidebar } from './sidebar';
import { renderDocList } from './doc-list';
import { DISPLAY_WIDGET_CSS } from './styles';
import { resolveTriggerMessage, buildDisplayPayload } from '../../services/messaging/display-payload';
import { generateSessionId } from '../../utils/session-id-generator';
import type { DisplayDocument, DisplayRendererState } from './types';

const STYLE_ID = 'cw-display-styles';

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
    const ui = this.runtimeConfig.uiConfig;

    this.abort?.abort();
    this.abort = new AbortController();

    const winCustom = (typeof window !== 'undefined' ? (window as any).ChatWidgetConfig?.customContext : undefined);
    const customContext = winCustom && typeof winCustom === 'object' ? winCustom : (ui.connection?.customContext ?? {});

    const tier = (typeof window !== 'undefined' ? (window as any).N8N_LICENSE_FLAGS?.tier : undefined) ?? 'unknown';

    const payload = buildDisplayPayload({
      widgetId: this.runtimeConfig.relay.widgetId,
      licenseKey: this.runtimeConfig.relay.licenseKey,
      message: resolveTriggerMessage(ui.connection?.triggerMessage),
      sessionId: generateSessionId(),
      context: this.capturePageContext(),
      customContext,
      tier,
    });

    try {
      const res = await this.fetcher(this.runtimeConfig.relay.relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: this.abort.signal,
      });
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
        this.sidebar.updateCount(0);
        return;
      }
      this.setState({ kind: 'success', documents: docs });
      this.sidebar.updateCount(docs.length);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      this.setState({ kind: 'error', message: 'Network error. Please try again.' });
    }
  }

  private setState(state: DisplayRendererState): void {
    if (!this.sidebar) return;
    const ui = this.runtimeConfig!.uiConfig;
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

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = DISPLAY_WIDGET_CSS;
    document.head.appendChild(tag);
  }
}

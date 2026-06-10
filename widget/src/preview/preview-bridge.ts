/**
 * Configurator preview bridge. Active ONLY when the page URL has ?preview=1.
 * Listens for config from the parent frame and (re)mounts the real renderer with mockFetcher.
 *
 * Protocol:
 *   parent → child  { type: 'widget:config', kind, config, tier }
 *   child  → parent { type: 'widget:ready' }    (repeated until first config arrives)
 *                   { type: 'widget:mounted' }
 *                   { type: 'widget:error', message }
 *
 * CONFIG SHAPE CONTRACT (the crux of Phase 5):
 *   `msg.config` MUST be the TRANSLATED runtime uiConfig (the WidgetConfig shape the
 *   renderers consume — branding/style/theme/features/...), NOT the canonical
 *   ChatWidgetConfig the configurator edits. The configurator is responsible for
 *   running translateConfig (shared module: lib/widget/translate-config.ts) before
 *   posting. The widget bundle stays Zod-free and never translates, so the bridge
 *   assigns msg.config straight to runtimeConfig.uiConfig.
 */
import { mockFetcher } from './mock-fetcher';
import { createRenderer } from '../core/create-renderer';
import type { WidgetRuntimeConfig } from '../types';

export function initPreviewBridge(): boolean {
  if (typeof window === 'undefined') return false;
  if (!new URLSearchParams(window.location.search).has('preview')) return false;

  let container: HTMLElement | null = null;
  let dispose: (() => Promise<void> | void) | null = null;
  let mounted = false;

  window.addEventListener('message', async (event: MessageEvent) => {
    const msg = event.data;
    if (!msg || msg.type !== 'widget:config') return;
    try {
      // Tear down any previous mount before remounting with the new config.
      if (dispose) {
        await dispose();
        dispose = null;
      }
      if (container) {
        container.remove();
        container = null;
      }

      container = document.createElement('div');
      container.setAttribute('data-n8n-widget-root', '');
      document.body.appendChild(container);

      const kind: 'chat' | 'display' = msg.kind === 'display' ? 'display' : 'chat';
      const renderer = createRenderer(kind);

      const runtimeConfig: WidgetRuntimeConfig = {
        // msg.config is the already-translated runtime uiConfig (see contract above).
        uiConfig: msg.config,
        relay: {
          relayUrl: 'preview://relay',
          widgetId: 'preview',
          licenseKey: 'preview',
        },
        flags: {
          tier: msg.tier ?? 'agency',
          brandingEnabled: msg.config?.branding?.brandingEnabled !== false,
        },
      } as unknown as WidgetRuntimeConfig;

      await renderer.mount(runtimeConfig, container, { fetcher: mockFetcher });
      dispose = () => renderer.dispose();
      mounted = true;
      window.parent.postMessage({ type: 'widget:mounted' }, '*');
    } catch (err) {
      window.parent.postMessage(
        { type: 'widget:error', message: (err as Error).message },
        '*'
      );
    }
  });

  // Announce readiness repeatedly until the first config arrives (the parent may
  // attach its message listener after the iframe has already loaded).
  const readyTimer = setInterval(() => {
    if (mounted) {
      clearInterval(readyTimer);
      return;
    }
    window.parent.postMessage({ type: 'widget:ready' }, '*');
  }, 250);
  window.parent.postMessage({ type: 'widget:ready' }, '*');

  return true;
}

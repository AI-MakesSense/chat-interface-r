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
 *
 * TIER / BRANDING: the bridge derives brandingEnabled from msg.tier (pro/agency may
 *   remove the "Powered by" footer; basic/free cannot) and writes both into
 *   window.N8N_LICENSE_FLAGS before mount, since the renderers read tier/branding from
 *   that global (the same one the production loader sets).
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
  // Assigned just below; declared here so the (async) message handler can clear it.
  // No TDZ risk in practice: readyTimer is assigned before the first 'widget:ready' is
  // ever posted, so any 'widget:config' the parent sends back arrives strictly after the
  // assignment — the handler's clearInterval(readyTimer) always sees a defined value.
  let readyTimer: ReturnType<typeof setInterval>;

  // Serialize mounts: a second widget:config arriving while a mount is in
  // flight must not interleave teardown/mount (double-mount race). We keep
  // only the LATEST pending config — intermediate configs are obsolete.
  let mountInFlight = false;
  let pendingMsg: any = null;

  async function mountFromMessage(msg: any): Promise<void> {
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

      // Tier drives branding: pro/agency may remove the "Powered by" footer, basic/free
      // cannot. The renderers read these from window.N8N_LICENSE_FLAGS (the global the
      // production loader sets), so populate it BEFORE mount — otherwise DisplayRenderer
      // reads tier 'unknown' and branding is wrong in preview.
      const tier = msg.tier ?? 'agency';
      const brandingEnabled = !(tier === 'pro' || tier === 'agency');
      (window as any).N8N_LICENSE_FLAGS = { tier, brandingEnabled };

      const runtimeConfig: WidgetRuntimeConfig = {
        // msg.config is the already-translated runtime uiConfig (see contract above).
        uiConfig: msg.config,
        relay: {
          relayUrl: 'preview://relay',
          widgetId: 'preview',
          licenseKey: 'preview',
        },
        flags: { tier, brandingEnabled },
      } as unknown as WidgetRuntimeConfig;

      await renderer.mount(runtimeConfig, container, { fetcher: mockFetcher });
      dispose = () => renderer.dispose();
      mounted = true;
      // Stop announcing readiness now that a mount has succeeded.
      clearInterval(readyTimer);
      window.parent.postMessage({ type: 'widget:mounted' }, '*');
    } catch (err) {
      // Mount failed: stop the ready-interval (it would otherwise fire forever, since
      // `mounted` never flips) and remove the orphaned container we just created.
      clearInterval(readyTimer);
      if (container) {
        container.remove();
        container = null;
      }
      window.parent.postMessage(
        { type: 'widget:error', message: (err as Error).message },
        '*'
      );
    }
  }

  window.addEventListener('message', (event: MessageEvent) => {
    // Only the embedding parent may drive the preview. The iframe is sandboxed
    // (null origin), so origin checks are unavailable — source identity is the
    // strongest available check.
    if (event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || msg.type !== 'widget:config') return;

    if (mountInFlight) {
      pendingMsg = msg; // coalesce: newest config wins
      return;
    }
    void (async () => {
      mountInFlight = true;
      try {
        // mountFromMessage never rethrows (its catch posts widget:error), so one
        // failed mount cannot break the pending-config drain loop below.
        await mountFromMessage(msg);
        while (pendingMsg) {
          const next = pendingMsg;
          pendingMsg = null;
          await mountFromMessage(next);
        }
      } finally {
        mountInFlight = false;
      }
    })();
  });

  // Announce readiness repeatedly until the first config arrives (the parent may
  // attach its message listener after the iframe has already loaded).
  readyTimer = setInterval(() => {
    if (mounted) {
      clearInterval(readyTimer);
      return;
    }
    window.parent.postMessage({ type: 'widget:ready' }, '*');
  }, 250);
  window.parent.postMessage({ type: 'widget:ready' }, '*');

  return true;
}

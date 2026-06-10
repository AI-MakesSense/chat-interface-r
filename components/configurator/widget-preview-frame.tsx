'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { translateConfig } from '@/lib/widget/translate-config';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';

/**
 * Configurator live preview (Phase 5, Task 20).
 *
 * Renders the REAL widget bundle inside a sandboxed iframe pointed at
 * `/preview/widget?preview=1`. The bundle's preview bridge boots, posts `widget:ready`,
 * and this component responds by posting the TRANSLATED runtime config. The bridge then
 * mounts the actual renderer with a mock fetcher — so the configurator shows the shipped
 * widget rather than a hand-maintained re-implementation.
 *
 * MESSAGE PROTOCOL (mirror of preview-bridge.ts):
 *   child → parent : widget:ready (repeated until first config) | widget:mounted | widget:error
 *   parent → child : widget:config { kind, config: <TRANSLATED WidgetConfig>, tier }
 *
 * CONFIG SHAPE: the bridge expects the already-translated runtime `WidgetConfig`, NOT the
 * canonical `ChatWidgetConfig` the configurator edits. translateConfig() is pure and
 * client-safe (zod + pure schema modules only — no fs/server-only imports), so we run it
 * here before posting.
 *
 * SANDBOX: `allow-scripts` WITHOUT `allow-same-origin`. The bundle is a single IIFE
 * (esbuild bundle:true, no code-splitting), so Prism/markdown-it dynamic imports are
 * inlined — there are no runtime same-origin chunk fetches. The mock fetcher intercepts
 * all network. Cross-origin postMessage between parent and the sandboxed (opaque-origin)
 * iframe still works. Keeping same-origin OFF is the tighter, correct choice here.
 */

interface WidgetPreviewFrameProps {
  kind: 'chat' | 'display';
  /** Canonical config the configurator edits; translated before posting. */
  config: ChatWidgetConfig;
  tier: string;
}

const PREVIEW_SRC = '/preview/widget?preview=1';

export const WidgetPreviewFrame: React.FC<WidgetPreviewFrameProps> = ({
  kind,
  config,
  tier,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep latest props in a ref so the (stable) ready handler always posts current state.
  const latest = useRef({ kind, config, tier });
  latest.current = { kind, config, tier };

  const postConfig = useCallback(() => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    const { kind: k, config: c, tier: t } = latest.current;
    const translated = translateConfig(
      c,
      window.location.origin,
      'preview',
      t,
      CHATKIT_UI_ENABLED
    );
    // targetOrigin MUST be '*': the iframe uses sandbox="allow-scripts" without
    // allow-same-origin, so its document origin is `null`. A specific targetOrigin
    // (e.g. our own origin) would never match `null`, and the browser would silently
    // DROP the message — the bridge would never receive config and the preview would
    // stay permanently blank. Inbound is still safe: the message listener guards on
    // event.source === iframeRef.current?.contentWindow.
    frame.contentWindow.postMessage(
      { type: 'widget:config', kind: k, config: translated, tier: t },
      '*'
    );
  }, []);

  // Debounce config re-posts so rapid field edits don't thrash the remount.
  const debouncedPostConfig = useDebouncedCallback(postConfig, 150);

  // Listen for the bridge's lifecycle messages.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // Only trust messages from our own iframe's content window.
      if (event.source !== iframeRef.current?.contentWindow) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      switch (msg.type) {
        case 'widget:ready':
          setReady(true);
          // Post immediately on first ready (no debounce — the user is waiting).
          postConfig();
          break;
        case 'widget:mounted':
          setError(null);
          break;
        case 'widget:error':
          setError(typeof msg.message === 'string' ? msg.message : 'Preview failed to render');
          break;
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postConfig]);

  // Re-post (debounced) on every config/kind/tier change once the bridge is ready.
  useEffect(() => {
    if (!ready) return;
    debouncedPostConfig();
  }, [ready, kind, config, tier, debouncedPostConfig]);

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={iframeRef}
        src={PREVIEW_SRC}
        sandbox="allow-scripts"
        title="Widget preview"
        className="h-full w-full border-0"
        style={{ background: 'transparent' }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/95 p-4 text-center text-sm text-red-700">
          <div>
            <p className="font-semibold">Preview error</p>
            <p className="mt-1 text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

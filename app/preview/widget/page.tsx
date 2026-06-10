import Script from 'next/script';
import { getBundlePath } from '@/lib/widget/manifest';
import { TransparentBody } from './transparent-body';

/**
 * Configurator preview HOST page (Phase 5, Task 20).
 *
 * Loaded inside the configurator's sandboxed iframe at `/preview/widget?preview=1`.
 * The `?preview` flag on THIS page's URL is what activates the widget bundle's preview
 * bridge (widget/src/preview/preview-bridge.ts reads `window.location.search`). The
 * bridge then waits for a `widget:config` postMessage from the parent frame and mounts
 * the REAL renderer with a mock fetcher — so the configurator preview is the actual
 * shipped widget, not a re-implementation.
 *
 * ROOT-LAYOUT ISOLATION: this page intentionally does NOT render its own <html>/<body>.
 * In the Next.js App Router every route is wrapped by the single root layout
 * (app/layout.tsx), which already renders <html><body>. Rendering another <html> here
 * would nest <html> inside <html> (invalid). Instead we render a minimal transparent
 * wrapper and let the bundle's bridge inject its own widget root into document.body.
 * The root layout's extras (Toaster, font links, optional ChatKit script) are inert in
 * this context and do not interfere with the mounted widget.
 *
 * `force-dynamic` ensures the current build manifest (hashed bundle path) is read on
 * every request rather than baked in at build time.
 */
export const dynamic = 'force-dynamic';

export default function WidgetPreviewPage() {
  return (
    <div
      style={{
        margin: 0,
        background: 'transparent',
        width: '100%',
        height: '100%',
      }}
    >
      <TransparentBody />
      <Script src={getBundlePath()} strategy="afterInteractive" />
    </div>
  );
}

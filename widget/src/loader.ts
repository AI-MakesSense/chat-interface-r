/**
 * Embed loader — the ONLY url customers reference. Stays tiny and stable.
 * Reads data-widget-key, fetches config JSON, then injects the content-hashed bundle.
 */
(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script) {
    console.error('[n8n-widget] loader: could not find script element');
    return;
  }
  // Compat adapter (Task 9) bridges legacy embeds here with ?key=...
  let key = script.dataset.widgetKey || new URL(script.src || '', location.href).searchParams.get('key');
  // Defense-in-depth: if a legacy /w/KEY.js embed somehow reaches the loader with
  // its original src preserved (e.g. a redirect the browser didn't rewrite),
  // recover the 16-char key from the path so the widget still mounts.
  if (!key) {
    const m = new URL(script.src || '', location.href).pathname.match(/\/w\/([A-Za-z0-9]{16})/);
    if (m) key = m[1];
  }
  if (!key) {
    console.error('[n8n-widget] loader: missing data-widget-key attribute');
    return;
  }
  const origin = new URL(script.src).origin;
  fetch(`${origin}/api/w/${encodeURIComponent(key)}/config`, { mode: 'cors' })
    .then((res) => {
      if (!res.ok) throw new Error(`config fetch failed: HTTP ${res.status}`);
      return res.json();
    })
    .then((data: { bundlePath: string; runtime: unknown }) => {
      (window as any).ChatWidgetConfig = data.runtime;
      const bundle = document.createElement('script');
      bundle.src = origin + data.bundlePath;
      bundle.async = true;
      // Forward display-mode attributes so inline/portal embeds reach the bundle.
      // The bundle reads data-mode / data-container off its own <script> tag; the
      // loader is that tag's stand-in, so copy them through. Popup (no attrs) is
      // unaffected.
      const mode = script.getAttribute('data-mode');
      if (mode) bundle.setAttribute('data-mode', mode);
      const container = script.getAttribute('data-container');
      if (container) bundle.setAttribute('data-container', container);
      bundle.onerror = () => console.error('[n8n-widget] loader: bundle failed to load', bundle.src);
      document.head.appendChild(bundle);
    })
    .catch((err) => console.error('[n8n-widget] loader:', err));
})();

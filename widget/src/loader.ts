/**
 * Embed loader — the ONLY url customers reference. Stays tiny and stable.
 * Reads data-widget-key, fetches config JSON, then injects the content-hashed bundle.
 */
(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  // Compat adapter (Task 9) redirects legacy embeds here with ?key=...
  const key = script?.dataset.widgetKey || new URL(script?.src || '', location.href).searchParams.get('key');
  if (!script || !key) {
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
      bundle.onerror = () => console.error('[n8n-widget] loader: bundle failed to load', bundle.src);
      document.head.appendChild(bundle);
    })
    .catch((err) => console.error('[n8n-widget] loader:', err));
})();

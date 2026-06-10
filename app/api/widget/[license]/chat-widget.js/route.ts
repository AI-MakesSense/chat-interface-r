/**
 * Legacy Widget Compat Adapter
 *
 * Route: GET /api/widget/[license]/chat-widget.js
 *
 * Purpose: Bridge old license-key-based embed URLs to the new widgetKey loader.
 * This supports un-migrated embeds that were installed before Task 8 shipped the
 * widgetKey embed format.
 *
 * Behavior:
 *   1. Look up the license by key (getLicenseByKey).
 *   2. If valid and active, resolve the owner's single active widget
 *      (getActiveWidgetsForUser); ambiguous (2+ active widgets) fails closed.
 *   3. Serve an inline bootstrap (Content-Type: application/javascript) that
 *      injects /widget/loader.js with data-widget-key={widgetKey}. A 302 would be
 *      invisible to the loader (the browser keeps the original currentScript.src),
 *      so the legacy embed would silently never mount — hence the inline bootstrap.
 *   4. If the license is invalid/inactive or no active widget exists, return a
 *      JS comment 404 so the browser does not crash the embedding page's script.
 *
 * What was removed vs the old full serving implementation:
 *   - No more widget bundle injection/serving (serveWidgetBundle, inject.ts, serve.ts).
 *     Task 18 deletes those files entirely; this route no longer imports them.
 *   - No more IP/license rate limiting (removed with the serving path).
 *   - No more domain authorization (the redirect target enforces its own checks).
 *   - No more ChatKit iframe injection.
 *
 * Security: we intentionally do NOT perform domain checks here — the compat
 * adapter's only job is to bridge the old URL format to the new one. Authorization
 * is enforced by the resolved endpoint (/api/w/[widgetKey]/config) that the
 * loader will call at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLicenseByKey, getActiveWidgetsForUser } from '@/lib/db/queries';

/**
 * Build an inline bootstrap that injects the stable loader with the resolved
 * widgetKey baked in. A 302 to /widget/loader.js?key=KEY would be invisible to the
 * loader — the browser keeps the original currentScript.src across redirects — so
 * we serve JS that creates the loader <script> with data-widget-key set.
 */
function buildLoaderBootstrap(origin: string, widgetKey: string): string {
  const loaderSrc = JSON.stringify(`${origin}/widget/loader.js`);
  const keyLiteral = JSON.stringify(widgetKey);
  return `(function(){var s=document.createElement('script');s.src=${loaderSrc};s.async=true;s.setAttribute('data-widget-key',${keyLiteral});document.head.appendChild(s);})();`;
}

/** Fresh Response per call — a shared NextResponse's body is one-shot and
 *  would fail on the second 404 served by a warm instance. */
const jsUnavailable = () =>
  new NextResponse('// widget unavailable', {
    status: 404,
    headers: { 'Content-Type': 'application/javascript' },
  });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ license: string }> }
): Promise<NextResponse> {
  try {
    const { license: licenseKey } = await params;

    if (!licenseKey) {
      return jsUnavailable();
    }

    // Step 1: Look up the license.
    const license = await getLicenseByKey(licenseKey);
    if (!license || license.status !== 'active') {
      return jsUnavailable();
    }

    // Step 2: Find the owner's active widgets. The legacy URL carries no widget
    // identity, so we can only resolve it safely when the user has EXACTLY ONE
    // active widget. With 2+ widgets, serving the first would silently render
    // the wrong widget on the customer's site — fail closed and log instead.
    const activeWidgets = await getActiveWidgetsForUser(license.userId, 2);
    if (activeWidgets.length !== 1 || !activeWidgets[0].widgetKey) {
      if (activeWidgets.length > 1) {
        console.warn(
          `[Widget Compat Adapter] License ${licenseKey.slice(0, 8)}... has ${activeWidgets.length}+ active widgets — ambiguous legacy embed, refusing to guess. Re-embed with the widgetKey snippet.`
        );
      }
      return jsUnavailable();
    }
    const widget = activeWidgets[0];

    // Step 3: Serve an inline bootstrap that injects the loader with the resolved
    // widgetKey. We CANNOT 302 to /widget/loader.js?key=KEY: the browser keeps the
    // original <script src> (/api/widget/LICENSE/chat-widget.js) as currentScript.src
    // across the redirect, so the loader never sees the ?key= and bails.
    const origin = new URL(request.url).origin;
    const bootstrap = buildLoaderBootstrap(origin, widget.widgetKey);

    return new NextResponse(bootstrap, {
      status: 200,
      headers: { 'Content-Type': 'application/javascript' },
    });

  } catch (error) {
    console.error('[Widget Compat Adapter] Error:', error);
    return jsUnavailable();
  }
}

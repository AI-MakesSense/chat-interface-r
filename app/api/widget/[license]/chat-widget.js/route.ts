/**
 * Legacy Widget Compat Adapter
 *
 * Route: GET /api/widget/[license]/chat-widget.js
 *
 * Purpose: Redirect old license-key-based embed URLs to the new widgetKey loader.
 * This supports un-migrated embeds that were installed before Task 8 shipped the
 * widgetKey embed format.
 *
 * Behavior:
 *   1. Look up the license by key (getLicenseByKey).
 *   2. If valid and active, find the owner's first active widget
 *      (getFirstActiveWidgetForUser).
 *   3. 302-redirect to /widget/loader.js?key={widgetKey}.
 *      NOTE: /widget/loader.js is created in Task 16. Until that route exists,
 *      the redirect 302s but the target 404s at runtime — this is acceptable for
 *      un-migrated legacy embeds. Dashboard users should re-copy their embed code.
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
import { getLicenseByKey, getFirstActiveWidgetForUser } from '@/lib/db/queries';

const JS_UNAVAILABLE = new NextResponse(
  '// widget unavailable',
  {
    status: 404,
    headers: { 'Content-Type': 'application/javascript' },
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ license: string }> }
): Promise<NextResponse> {
  try {
    const { license: licenseKey } = await params;

    if (!licenseKey) {
      return JS_UNAVAILABLE;
    }

    // Step 1: Look up the license.
    const license = await getLicenseByKey(licenseKey);
    if (!license || license.status !== 'active') {
      return JS_UNAVAILABLE;
    }

    // Step 2: Find the owner's first active widget.
    const widget = await getFirstActiveWidgetForUser(license.userId);
    if (!widget || !widget.widgetKey) {
      return JS_UNAVAILABLE;
    }

    // Step 3: Redirect to the new loader URL.
    // /widget/loader.js is created in Task 16; until then, this 404s at runtime.
    const origin = new URL(request.url).origin;
    const loaderUrl = `${origin}/widget/loader.js?key=${widget.widgetKey}`;

    return NextResponse.redirect(loaderUrl, { status: 302 });

  } catch (error) {
    console.error('[Widget Compat Adapter] Error:', error);
    return JS_UNAVAILABLE;
  }
}

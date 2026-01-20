/**
 * Widget License Flag Injection
 *
 * Purpose: Create license flags JSON and inject them into widget bundle
 * Responsibility: Flag generation and bundle modification
 */

import { License } from '@/lib/db/schema';

/**
 * Create JSON string containing license flags
 *
 * @param license - License object from database
 * @returns JSON string with tier, branding, and domain limit info
 */
export function createFlagsJSON(license: License): string {
  const flags = {
    tier: license.tier,
    brandingEnabled: license.brandingEnabled,
    domainLimit: license.domainLimit
  };

  return JSON.stringify(flags);
}

/**
 * Inject license flags and relay configuration into widget bundle
 *
 * @param bundleContent - The widget bundle JavaScript content
 * @param license - License object from database
 * @param widgetId - Widget ID for relay authentication (optional, will skip relay if not provided)
 * @param widgetKey - Widget key for secure relay authentication (preferred over license key)
 * @returns Modified bundle with injected license flags and relay config
 *
 * Strategy:
 * We prepend the configuration variables to the top of the bundle.
 * Since the widget is an IIFE (Immediately Invoked Function Expression),
 * these variables will be available on the 'window' object before the widget executes.
 *
 * Security:
 * When widgetKey is provided, it is used instead of licenseKey for relay authentication.
 * This is more secure because:
 * - Widget keys are scoped to a single widget (not all widgets under a license)
 * - Widget keys can be rotated without affecting other widgets
 * - License keys control multiple resources and should not be exposed in client JS
 */
export function injectLicenseFlags(
  bundleContent: string,
  license: License,
  widgetId?: string,
  widgetKey?: string
): string {
  // 1. Generate the Flags configuration
  const flagsJSON = createFlagsJSON(license);

  // 2. Build the configuration script
  // We use a safe property assignment on window to ensure it exists
  let injectionCode = `
/** N8n Widget Configuration (Injected) */
window.N8N_LICENSE_FLAGS = ${flagsJSON};`;

  // 3. Add relay configuration if widgetId is provided
  // Use production URL for relay endpoint to ensure cross-domain requests work
  // The widget may be embedded on any domain but must call back to our server
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app';

  if (widgetId) {
    // SECURITY: Use widgetKey when available, fall back to licenseKey for backward compatibility
    // widgetKey is preferred because:
    // 1. It's scoped to a single widget, not all widgets under a license
    // 2. It can be rotated without affecting other widgets
    // 3. License keys should not be exposed in client-side JavaScript
    const relayConfig = {
      relayUrl: `${baseUrl}/api/chat-relay`,
      widgetId: widgetId,
      // Use widgetKey for authentication when available
      ...(widgetKey ? { widgetKey } : { licenseKey: license.licenseKey })
    };

    // We ensure ChatWidgetConfig exists, then assign the relay property
    injectionCode += `
window.ChatWidgetConfig = window.ChatWidgetConfig || {};
window.ChatWidgetConfig.relay = ${JSON.stringify(relayConfig)};`;
  }

  // 4. Prepend configuration to the bundle
  // Newline ensures separation from the banner or bundle code
  return injectionCode + '\n\n' + bundleContent;
}
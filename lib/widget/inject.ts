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
 * @returns Modified bundle with injected license flags and relay config
 * * Strategy:
 * We prepend the configuration variables to the top of the bundle.
 * Since the widget is an IIFE (Immediately Invoked Function Expression),
 * these variables will be available on the 'window' object before the widget executes.
 */
export function injectLicenseFlags(
  bundleContent: string,
  license: License,
  widgetId?: string,
  baseUrlOverride?: string
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
  const vercelProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? (process.env.VERCEL_PROJECT_PRODUCTION_URL.startsWith('http')
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : undefined;
  const baseUrl =
    baseUrlOverride ||
    process.env.NEXT_PUBLIC_APP_URL ||
    vercelProdUrl ||
    'https://chat-interface-r.vercel.app';

  if (widgetId) {
    const relayConfig = {
      relayUrl: `${baseUrl}/api/chat-relay`,
      widgetId: widgetId,
      licenseKey: license.licenseKey
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

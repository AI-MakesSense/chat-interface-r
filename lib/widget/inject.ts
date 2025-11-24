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
  widgetId?: string
): string {
  // 1. Generate the Flags configuration
  const flagsJSON = createFlagsJSON(license);

  // 2. Build the configuration script
  // We use a safe property assignment on window to ensure it exists
  let injectionCode = `
/** N8n Widget Configuration (Injected) */
window.N8N_LICENSE_FLAGS = ${flagsJSON};`;

  // 3. Add relay configuration if widgetId is provided
  if (widgetId) {
    const relayConfig = {
      relayUrl: '/api/chat-relay',
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
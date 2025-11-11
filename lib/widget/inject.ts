/**
 * Widget License Flag Injection
 *
 * Purpose: Create license flags JSON and inject them into widget bundle
 * Responsibility: Flag generation and bundle modification
 * Assumptions: Widget bundle contains specific markers for flag injection
 */

import { License } from '@/lib/db/schema';

// Markers used in the widget bundle to identify injection point
const START_MARKER = '__START_LICENSE_FLAGS__';
const END_MARKER = '__END_LICENSE_FLAGS__';

/**
 * Create JSON string containing license flags
 *
 * @param license - License object from database
 * @returns JSON string with tier, branding, and domain limit info
 *
 * Included flags:
 * - tier: 'basic' | 'pro' | 'agency'
 * - brandingEnabled: boolean (true for basic, false for pro/agency)
 * - domainLimit: number (1 for basic/pro, 999 for agency)
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
 * Inject license flags into widget bundle
 *
 * @param bundleContent - The widget bundle JavaScript content
 * @param license - License object from database
 * @returns Modified bundle with injected license flags
 * @throws Error if markers are not found in bundle
 *
 * The function looks for comment markers in the bundle:
 * // __START_LICENSE_FLAGS__
 * // __END_LICENSE_FLAGS__
 *
 * And replaces the content between them with:
 * window.N8N_LICENSE_FLAGS = {tier, brandingEnabled, domainLimit};
 */
export function injectLicenseFlags(bundleContent: string, license: License): string {
  // Find start marker - try with different whitespace variations
  let startIdx = bundleContent.indexOf(START_MARKER);
  if (startIdx === -1) {
    throw new Error('License flags start marker not found in bundle');
  }

  // Find end marker
  let endIdx = bundleContent.indexOf(END_MARKER);
  if (endIdx === -1) {
    throw new Error('License flags end marker not found in bundle');
  }

  // Find the beginning of the line containing the start marker
  let startLineBegin = bundleContent.lastIndexOf('\n', startIdx);
  startLineBegin = startLineBegin === -1 ? 0 : startLineBegin;

  // Find the end of the line containing the end marker
  let endLineEnd = bundleContent.indexOf('\n', endIdx + END_MARKER.length);
  endLineEnd = endLineEnd === -1 ? bundleContent.length : endLineEnd;

  // Create the flags JSON
  const flagsJSON = createFlagsJSON(license);

  // Create the injection code
  const injectionCode = `\n  window.N8N_LICENSE_FLAGS = ${flagsJSON};`;

  // Build the new bundle
  const before = bundleContent.slice(0, startLineBegin);
  const after = bundleContent.slice(endLineEnd);

  return before + injectionCode + after;
}
/**
 * Widget Bundle Serving
 *
 * Purpose: Serve widget bundle with injected license flags and caching
 * Responsibility: Bundle loading, caching, and flag injection
 * Assumptions: Widget bundle exists at public/widget/chat-widget.js
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { License } from '@/lib/db/schema';
import { injectLicenseFlags } from '@/lib/widget/inject';

/**
 * Cache entry for widget bundles
 */
interface BundleCache {
  bundle: string;
  timestamp: number;
}

/**
 * In-memory cache for widget bundle
 * TTL: 60 seconds (for development, longer in production)
 */
const bundleCache = new Map<string, BundleCache>();
const CACHE_TTL = 60000; // 60 seconds

/**
 * Read widget bundle from filesystem
 *
 * @returns Raw widget bundle content
 */
async function readWidgetBundle(): Promise<string> {
  const bundlePath = join(process.cwd(), 'public', 'widget', 'chat-widget.iife.js');
  const content = await readFile(bundlePath, 'utf-8');
  return content;
}

/**
 * Get cache key for an injected bundle
 * Includes license/widget identity and serving origin to prevent cross-origin cache bleed.
 */
function getCacheKey(license: License, widgetId?: string, baseUrl?: string): string {
  return [
    license.id,
    widgetId || 'no-widget',
    license.tier,
    String(license.brandingEnabled),
    String(license.domainLimit),
    baseUrl || 'no-base-url',
  ].join(':');
}

/**
 * Serve widget bundle with injected license flags
 *
 * @param license - License object from database
 * @param widgetId - Optional widget ID for relay configuration
 * @param baseUrl - Optional origin for relay URL injection
 * @returns Widget bundle JavaScript with injected flags
 */

export async function serveWidgetBundle(
  license: License,
  widgetId?: string,
  baseUrl?: string
): Promise<string> {
  const cacheKey = getCacheKey(license, widgetId, baseUrl);
  const now = Date.now();

  // Check cache
  const cached = bundleCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.bundle;
  }

  // Read bundle from filesystem
  const rawBundle = await readWidgetBundle();

  // Inject license flags and relay config
  const bundleWithFlags = injectLicenseFlags(rawBundle, license, widgetId, baseUrl);

  // Update cache
  bundleCache.set(cacheKey, {
    bundle: bundleWithFlags,
    timestamp: now
  });

  return bundleWithFlags;
}

/**
 * Clear the bundle cache
 *
 * Used for:
 * - Testing
 * - Development hot-reload
 * - Manual cache invalidation
 */
export function clearBundleCache(): void {
  bundleCache.clear();
}

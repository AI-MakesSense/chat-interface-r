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
  const bundlePath = join(process.cwd(), 'public', 'widget', 'chat-widget.js');
  const content = await readFile(bundlePath, 'utf-8');
  return content;
}

/**
 * Get cache key for a license
 * Uses tier, branding, and domain limit to differentiate cached bundles
 *
 * @param license - License object
 * @returns Cache key string
 */
function getCacheKey(license: License): string {
  return `${license.tier}-${license.brandingEnabled}-${license.domainLimit}`;
}

/**
 * Serve widget bundle with injected license flags
 *
 * @param license - License object from database
 * @param widgetId - Optional widget ID for relay configuration
 * @returns Widget bundle JavaScript with injected flags
 *
 * Features:
 * - Caches bundles in memory for performance (60s TTL)
 * - Injects license-specific flags
 * - Injects relay configuration if widgetId is provided
 * - Different bundles for different license configurations
 */
export async function serveWidgetBundle(license: License, widgetId?: string): Promise<string> {
  const cacheKey = getCacheKey(license);
  const now = Date.now();

  // Check cache
  const cached = bundleCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.bundle;
  }

  // Read bundle from filesystem
  const rawBundle = await readWidgetBundle();

  // Inject license flags and relay config
  const bundleWithFlags = injectLicenseFlags(rawBundle, license, widgetId);

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
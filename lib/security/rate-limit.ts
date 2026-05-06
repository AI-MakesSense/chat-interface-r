/**
 * Generic in-memory rate limiting utility for API routes.
 *
 * Note: This is process-local memory and should be replaced with shared storage
 * (e.g., Redis) for multi-instance production deployments.
 */

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
}

interface RateEntry {
  count: number;
  windowStart: number;
}

const stores = new Map<string, Map<string, RateEntry>>();

function getStore(namespace: string): Map<string, RateEntry> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map<string, RateEntry>();
    stores.set(namespace, store);
  }
  return store;
}

export function checkRateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = identifier || 'unknown';
  const store = getStore(namespace);
  const now = Date.now();
  const current = store.get(key);

  if (!current || now - current.windowStart >= config.windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: Math.max(config.limit - 1, 0) };
  }

  if (current.count >= config.limit) {
    const retryAfterMs = current.windowStart + config.windowMs - now;
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(config.limit - current.count, 0),
  };
}

export function resetRateLimit(namespace?: string): void {
  if (namespace) {
    stores.delete(namespace);
    return;
  }
  stores.clear();
}

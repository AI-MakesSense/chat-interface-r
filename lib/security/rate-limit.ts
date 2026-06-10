/**
 * Distributed rate limiting.
 * Backend: Upstash Redis (sliding window) when UPSTASH_REDIS_REST_URL is set;
 * otherwise process-local memory (dev/test only — logs a warning once in prod).
 * Policy: fails OPEN on Redis errors (a broken limiter must not take down chat).
 *
 * The @upstash/redis and @upstash/ratelimit packages are imported lazily so
 * that Jest test environments (which have no Redis env vars) never load the
 * ESM-only crypto internals from those packages.
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

// ---------------------------------------------------------------------------
// Memory fallback (dev/test)
// ---------------------------------------------------------------------------
interface RateEntry {
  count: number;
  windowStart: number;
}

const memoryStores = new Map<string, Map<string, RateEntry>>();

// Cap per-namespace entries on the memory fallback path to bound growth under
// unique-identifier load (e.g. many distinct IPs). Only relevant when running
// without Redis; production should use Redis.
const MEMORY_STORE_CAP = 10_000;

/**
 * Sweep expired entries from a store, then drop overflow if still over cap.
 * Cheap: only runs when a store is about to exceed the cap.
 */
function pruneStore(store: Map<string, RateEntry>, windowMs: number, now: number): void {
  for (const [id, entry] of store) {
    if (entry.windowStart + windowMs < now) {
      store.delete(id);
    }
  }
}

function memoryCheck(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  let store = memoryStores.get(namespace);
  if (!store) {
    store = new Map();
    memoryStores.set(namespace, store);
  }
  const now = Date.now();
  const current = store.get(identifier);

  if (!current || now - current.windowStart >= config.windowMs) {
    // Bound growth before inserting a new identifier: sweep expired entries.
    if (!current && store.size >= MEMORY_STORE_CAP) {
      pruneStore(store, config.windowMs, now);
    }
    store.set(identifier, { count: 1, windowStart: now });
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

// ---------------------------------------------------------------------------
// Redis backend (production) — lazy-loaded so Jest never hits the ESM imports
// ---------------------------------------------------------------------------

// Cache Ratelimit instances per (namespace, limit, window) to avoid
// creating a new instance on every request.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const limiters = new Map<string, any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any | null = null;
let redisInitialized = false;

/**
 * Lazily initialize and return the Redis client, or null if env vars are absent.
 * Importing @upstash/redis lazily means the ESM crypto internals are never
 * loaded in Jest (which has no UPSTASH_* env vars).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRedis(): Promise<any> {
  if (redisInitialized) return redisClient;
  redisInitialized = true;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error('[rate-limit] Failed to initialize Redis client, falling back to memory:', err);
    redisClient = null;
  }
  return redisClient;
}

let warnedProdMemory = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the given identifier is within rate limits for a namespace.
 *
 * Uses Upstash Redis sliding window when env vars are configured; falls back
 * to per-process memory in dev/test. Fails OPEN on Redis errors so a broken
 * limiter never takes down the chat path.
 */
export async function checkRateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const safeId = identifier || 'unknown';

  const redis = await getRedis();

  if (!redis) {
    if (process.env.NODE_ENV === 'production' && !warnedProdMemory) {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL not set — falling back to per-instance memory limiting. ' +
          'Configure Upstash Redis via the Vercel Marketplace for distributed rate limiting.'
      );
      warnedProdMemory = true;
    }
    return memoryCheck(namespace, safeId, config);
  }

  const limiterKey = `${namespace}:${config.limit}:${config.windowMs}`;
  let limiter = limiters.get(limiterKey);

  // The whole construction + limit() call is wrapped so ANY failure (dynamic
  // import, constructor, slidingWindow duration parse, or the limit() request)
  // fails OPEN — a broken limiter must never take down chat/auth with a 500.
  try {
    if (!limiter) {
      const { Ratelimit } = await import('@upstash/ratelimit');
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs} ms`),
        prefix: `rl:${namespace}`,
      });
      // Cold-start race: concurrent requests may each build a limiter for the
      // same key before the first set() lands. Acceptable — the clients are
      // stateless REST wrappers, the last write wins, and counting is in Redis.
      limiters.set(limiterKey, limiter);
    }
    const r = await limiter.limit(safeId);
    return {
      allowed: r.success,
      remaining: r.remaining,
      retryAfter: r.success
        ? undefined
        : Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error('[rate-limit] Redis error, failing open:', err);
    return { allowed: true, remaining: 0 };
  }
}

/**
 * Reset the in-memory store (used for tests and maintenance).
 * Also resets the lazy Redis initialization state so tests can re-init.
 * Has no effect on the Redis store.
 */
export function resetRateLimit(namespace?: string): void {
  if (namespace) {
    memoryStores.delete(namespace);
  } else {
    memoryStores.clear();
  }
  // Reset lazy init state so tests that change env vars get a fresh client
  redisInitialized = false;
  redisClient = null;
  limiters.clear();
  warnedProdMemory = false;
}

/**
 * Test-only: number of live entries in a namespace's memory store.
 * Used to assert the fallback path stays bounded under unique-id load.
 */
export function __getMemoryStoreSize(namespace: string): number {
  return memoryStores.get(namespace)?.size ?? 0;
}

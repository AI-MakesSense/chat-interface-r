/**
 * Widget Rate Limiting
 *
 * Purpose: Implement rate limiting for widget serving and chat relay
 * Responsibility: Track and enforce request limits per IP and license
 *
 * Storage Strategy:
 * - Uses Redis (Upstash) when UPSTASH_REDIS_REST_URL is configured
 * - Falls back to in-memory storage for development/testing
 * - Redis enables distributed rate limiting across serverless instances
 */

import { Redis } from '@upstash/redis';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limit entry tracking
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;      // Requests remaining in window
  resetAt?: number;        // Timestamp when window resets
  retryAfter?: number;     // Seconds until next request allowed (if blocked)
}

/**
 * Rate limit configurations by type
 */
const RATE_CONFIGS: Record<string, RateLimitConfig> = {
  ip: {
    maxRequests: 10,
    windowMs: 1000, // 1 second - prevent burst abuse
  },
  license: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  relay: {
    maxRequests: 30,
    windowMs: 60000, // 30 messages per minute per license
  },
  'relay-ip': {
    maxRequests: 60,
    windowMs: 60000, // 60 messages per minute per IP
  },
};

/**
 * Redis client singleton (lazy initialized)
 */
let redisClient: Redis | null = null;

/**
 * Check if Redis is configured and available
 */
function isRedisConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  return redisClient;
}

/**
 * In-memory fallback storage
 */
class InMemoryRateLimiter {
  private stores = new Map<string, Map<string, RateLimitEntry>>();

  check(identifier: string, type: string): RateLimitResult {
    const config = RATE_CONFIGS[type];
    if (!config) {
      console.warn(`[Rate Limit] Unknown type: ${type}`);
      return { allowed: true };
    }

    // Get or create store for this type
    if (!this.stores.has(type)) {
      this.stores.set(type, new Map());
    }
    const store = this.stores.get(type)!;

    const now = Date.now();
    let entry = store.get(identifier);

    // If no entry or window expired, create new
    if (!entry || now - entry.windowStart >= config.windowMs) {
      entry = { count: 1, windowStart: now };
      store.set(identifier, entry);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + config.windowMs,
      };
    }

    // Check if within limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetAt: entry.windowStart + config.windowMs,
      };
    }

    // Rate limit exceeded
    const windowEnd = entry.windowStart + config.windowMs;
    const retryAfterMs = windowEnd - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd,
      retryAfter: retryAfterSeconds,
    };
  }

  reset(): void {
    this.stores.clear();
  }

  // Cleanup old entries to prevent memory leaks
  cleanup(): void {
    const now = Date.now();
    for (const [type, store] of this.stores) {
      const config = RATE_CONFIGS[type];
      if (!config) continue;

      for (const [key, entry] of store) {
        if (now - entry.windowStart >= config.windowMs * 2) {
          store.delete(key);
        }
      }
    }
  }
}

// In-memory fallback instance
const inMemoryLimiter = new InMemoryRateLimiter();

// Periodic cleanup for in-memory store (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => inMemoryLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Check rate limit using Redis (sliding window counter)
 */
async function checkRateLimitRedis(
  redis: Redis,
  identifier: string,
  type: string
): Promise<RateLimitResult> {
  const config = RATE_CONFIGS[type];
  if (!config) {
    console.warn(`[Rate Limit] Unknown type: ${type}`);
    return { allowed: true };
  }

  const key = `ratelimit:${type}:${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const windowKey = `${key}:${windowStart}`;

  try {
    // Use Redis MULTI for atomic increment and expire
    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.pexpire(windowKey, config.windowMs * 2); // Keep for 2 windows
    const results = await pipeline.exec();

    const count = results[0] as number;
    const resetAt = windowStart + config.windowMs;

    if (count <= config.maxRequests) {
      return {
        allowed: true,
        remaining: config.maxRequests - count,
        resetAt,
      };
    }

    // Rate limit exceeded
    const retryAfterMs = resetAt - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.max(1, retryAfterSeconds),
    };
  } catch (error) {
    // Log error but don't block requests if Redis fails
    console.error('[Rate Limit] Redis error, falling back to allow:', error);
    return { allowed: true };
  }
}

/**
 * Check if a request is within rate limits
 *
 * @param identifier - IP address, license key, or other identifier
 * @param type - Type of rate limit to check ('ip', 'license', 'relay', 'relay-ip')
 * @returns Object indicating if request is allowed and rate limit info
 *
 * Rate limits:
 * - ip: 10 requests per second (burst protection)
 * - license: 100 requests per minute (widget serving)
 * - relay: 30 messages per minute per license
 * - relay-ip: 60 messages per minute per IP
 */
export async function checkRateLimit(
  identifier: string,
  type: 'ip' | 'license' | 'relay' | 'relay-ip'
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (redis) {
    return checkRateLimitRedis(redis, identifier, type);
  }

  // Fall back to in-memory (development or Redis not configured)
  if (process.env.NODE_ENV === 'production' && !isRedisConfigured()) {
    // Log warning once per startup
    console.warn(
      '[Rate Limit] Redis not configured in production. ' +
      'Rate limiting will not work correctly across serverless instances. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
    );
  }

  return inMemoryLimiter.check(identifier, type);
}

/**
 * Synchronous rate limit check for backward compatibility
 * Uses in-memory limiter only (for existing code that expects sync)
 */
export function checkRateLimitSync(
  identifier: string,
  type: 'ip' | 'license'
): RateLimitResult {
  return inMemoryLimiter.check(identifier, type);
}

/**
 * Build rate limit headers for HTTP response
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {};

  if (result.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = String(result.remaining);
  }

  if (result.resetAt !== undefined) {
    headers['X-RateLimit-Reset'] = String(Math.ceil(result.resetAt / 1000));
  }

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Reset the rate limiter (clear all stored data)
 * Only affects in-memory store; Redis data expires automatically
 */
export function resetRateLimiter(): void {
  inMemoryLimiter.reset();
}

/**
 * Get rate limit configuration for a type
 */
export function getRateLimitConfig(type: string): RateLimitConfig | undefined {
  return RATE_CONFIGS[type];
}

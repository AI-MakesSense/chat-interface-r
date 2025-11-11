/**
 * Widget Rate Limiting
 *
 * Purpose: Implement rate limiting for widget serving to prevent abuse
 * Responsibility: Track and enforce request limits per IP and license
 * Assumptions: In-memory storage for MVP (can be replaced with Redis later)
 */

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
interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // Time in seconds until next request allowed
}

/**
 * Rate limit configurations
 */
const RATE_CONFIGS: Record<'ip' | 'license', RateLimitConfig> = {
  ip: {
    maxRequests: 10,
    windowMs: 1000 // 1 second
  },
  license: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
};

/**
 * In-memory storage for rate limit tracking
 * In production, this should be Redis or similar
 */
class RateLimiter {
  private ipStore = new Map<string, RateLimitEntry>();
  private licenseStore = new Map<string, RateLimitEntry>();

  /**
   * Check if request is allowed based on rate limits
   */
  check(identifier: string, type: 'ip' | 'license'): RateLimitResult {
    const config = RATE_CONFIGS[type];
    const store = type === 'ip' ? this.ipStore : this.licenseStore;
    const now = Date.now();

    // Get or create entry
    let entry = store.get(identifier);

    // If no entry or window expired, create new
    if (!entry || now - entry.windowStart >= config.windowMs) {
      entry = { count: 1, windowStart: now };
      store.set(identifier, entry);
      return { allowed: true };
    }

    // Check if within limit
    if (entry.count < config.maxRequests) {
      entry.count++;
      return { allowed: true };
    }

    // Calculate retry after (remaining time in window)
    const windowEnd = entry.windowStart + config.windowMs;
    const retryAfterMs = windowEnd - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      retryAfter: retryAfterSeconds
    };
  }

  /**
   * Reset all rate limit data
   */
  reset(): void {
    this.ipStore.clear();
    this.licenseStore.clear();
  }
}

// Global rate limiter instance
let rateLimiter = new RateLimiter();

/**
 * Check if a request is within rate limits
 *
 * @param identifier - IP address or license key
 * @param type - Type of rate limit to check ('ip' or 'license')
 * @returns Object indicating if request is allowed and retry-after if blocked
 *
 * Rate limits:
 * - IP: 10 requests per second
 * - License: 100 requests per minute
 */
export function checkRateLimit(identifier: string, type: 'ip' | 'license'): RateLimitResult {
  return rateLimiter.check(identifier, type);
}

/**
 * Reset the rate limiter (clear all stored data)
 *
 * Used for testing and maintenance
 */
export function resetRateLimiter(): void {
  rateLimiter.reset();
}
# Rate Limiting Implementation TODO

**Priority:** P1 - MUST FIX BEFORE PRODUCTION
**Status:** Not Implemented
**Created:** 2025-11-12
**Security Issue:** High - Enables brute force attacks on authentication endpoints

---

## Overview

Rate limiting is currently **missing** from all authentication endpoints. This creates a critical security vulnerability that allows attackers to:

1. **Brute force password attacks** - Unlimited login attempts
2. **Account enumeration** - Test if email addresses exist in the system
3. **DoS attacks** - Overwhelm auth endpoints with requests
4. **Credential stuffing** - Test large lists of compromised credentials

## Required Rate Limits

### Authentication Endpoints (CRITICAL)

**Endpoints:**
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/reset-password` (when implemented)

**Recommended Limits:**
- **5 attempts per 15 minutes per IP address** for login/signup
- **3 attempts per hour per email** for password reset (when implemented)
- **10 attempts per minute per IP** for email verification (when implemented)

**Rationale:**
- Allows legitimate users to retry failed logins (typos, password manager issues)
- Prevents automated brute force attacks
- Stops account enumeration attempts
- Industry standard for authentication rate limiting

### Widget API Endpoints (MEDIUM PRIORITY)

**Endpoints:**
- `GET /api/widget/:license/chat-widget.js`
- `POST /api/widget/:license/chat` (when implemented)

**Recommended Limits:**
- **100 requests per minute per license key**
- **1000 requests per hour per IP address**

**Rationale:**
- Prevents abuse of widget serving infrastructure
- Protects against license key theft/sharing
- Normal usage: <10 loads per minute per site

### API Endpoints (MEDIUM PRIORITY)

**Endpoints:**
- `GET /api/licenses`
- `PUT /api/licenses/:id`
- `GET /api/config/:licenseId`
- `PUT /api/config/:licenseId`

**Recommended Limits:**
- **100 requests per minute per authenticated user**

---

## Implementation Options

### Option 1: Vercel Rate Limiting (RECOMMENDED)

**Best for:** Production deployment on Vercel

**Pros:**
- Built into Vercel Edge Network
- No additional infrastructure required
- Works at CDN level (blocks before hitting app)
- Low latency
- Free tier available

**Cons:**
- Requires Vercel Pro plan for advanced features
- Limited customization

**Implementation:**
```typescript
// app/api/auth/login/route.ts
import { rateLimit } from '@vercel/edge';

const limiter = rateLimit({
  interval: '15m',
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  const { success, remaining } = await limiter.check(ip, 5);

  if (!success) {
    return Response.json(
      { error: 'Too many login attempts. Please try again in 15 minutes.' },
      { status: 429 }
    );
  }

  // Continue with login logic...
}
```

**Documentation:** https://vercel.com/docs/edge-network/rate-limiting

**Estimated Implementation Time:** 2-3 hours

---

### Option 2: Upstash Redis (RECOMMENDED FOR COMPLEX NEEDS)

**Best for:** Multi-region deployment, complex rate limiting rules

**Pros:**
- Full control over rate limiting logic
- Persistent storage (survives deploys)
- Works with any hosting provider
- Generous free tier (10,000 requests/day)
- Multi-region support

**Cons:**
- Requires external service setup
- Additional API calls (slight latency)
- More complex implementation

**Setup:**
1. Create Upstash account: https://upstash.com/
2. Create Redis database
3. Install package: `npm install @upstash/redis @upstash/ratelimit`

**Implementation:**
```typescript
// lib/auth/rate-limit.ts
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Login rate limiter: 5 attempts per 15 minutes
export const loginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:login',
});

// Signup rate limiter: 3 attempts per hour
export const signupLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  prefix: 'ratelimit:signup',
});

// API rate limiter: 100 requests per minute
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});
```

**Usage:**
```typescript
// app/api/auth/login/route.ts
import { loginLimiter } from '@/lib/auth/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  const { success, limit, remaining, reset } = await loginLimiter.limit(ip);

  if (!success) {
    const resetDate = new Date(reset);
    return Response.json(
      {
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetDate.toISOString(),
        },
      }
    );
  }

  // Continue with login logic...
}
```

**Documentation:** https://upstash.com/docs/redis/features/ratelimiting

**Estimated Implementation Time:** 4-6 hours

---

### Option 3: In-Memory LRU Cache (NOT RECOMMENDED FOR PRODUCTION)

**Best for:** Development/testing only

**Pros:**
- No external dependencies
- Fast (in-memory)
- Easy to implement

**Cons:**
- ⚠️ **NOT SUITABLE FOR PRODUCTION**
- Resets on every deploy
- Doesn't work with multiple server instances
- No persistence
- Memory intensive

**Implementation:**
```typescript
// lib/auth/rate-limit.ts
import { LRUCache } from 'lru-cache';

type RateLimitConfig = {
  uniqueTokenPerInterval: number;
  interval: number;
};

export function createRateLimiter(config: RateLimitConfig) {
  const tokenCache = new LRUCache({
    max: config.uniqueTokenPerInterval,
    ttl: config.interval,
  });

  return {
    check: (identifier: string, limit: number): boolean => {
      const tokenCount = (tokenCache.get(identifier) as number) || 0;

      if (tokenCount >= limit) {
        return false; // Rate limit exceeded
      }

      tokenCache.set(identifier, tokenCount + 1);
      return true; // Within limit
    },
  };
}

// Usage
const loginLimiter = createRateLimiter({
  uniqueTokenPerInterval: 500,
  interval: 60000 * 15, // 15 minutes
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  if (!loginLimiter.check(ip, 5)) {
    return Response.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429 }
    );
  }

  // Continue...
}
```

**Use Case:** Local development and testing only

**Estimated Implementation Time:** 1-2 hours

---

## Recommended Approach

**For this project:** Use **Upstash Redis** (Option 2)

**Reasons:**
1. **Production-ready** - Persistent, survives deploys
2. **Vercel-compatible** - Works perfectly with Vercel hosting
3. **Free tier sufficient** - 10,000 requests/day is enough for MVP
4. **Future-proof** - Can add complex rules (per-user, per-email, etc.)
5. **Analytics** - Built-in monitoring of rate limit hits
6. **Multi-region** - Low latency worldwide

**Timeline:**
- **Setup (30 min):** Create Upstash account, create database, add env vars
- **Implementation (3 hours):** Add rate limiting to auth routes
- **Testing (1 hour):** Test rate limiting with automated requests
- **Documentation (30 min):** Update API docs with rate limit headers

**Total:** ~5 hours

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/auth/rate-limit.test.ts
describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const limiter = /* ... */;

    for (let i = 0; i < 5; i++) {
      const result = await limiter.limit('test-ip');
      expect(result.success).toBe(true);
    }
  });

  it('should block requests exceeding limit', async () => {
    const limiter = /* ... */;

    // Make 5 successful requests
    for (let i = 0; i < 5; i++) {
      await limiter.limit('test-ip');
    }

    // 6th request should be blocked
    const result = await limiter.limit('test-ip');
    expect(result.success).toBe(false);
  });

  it('should reset after interval', async () => {
    // Test time-based reset logic
  });
});
```

### Integration Tests

```bash
# Test login rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done

# Expected: First 5 return 401, remaining return 429
```

### Load Tests (Artillery)

```yaml
# artillery-rate-limit.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: 'Login rate limit test'
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'wrongpassword'
```

---

## Response Headers (Standard)

All rate-limited endpoints should return these headers:

```
X-RateLimit-Limit: 5          # Max requests in window
X-RateLimit-Remaining: 2      # Remaining requests
X-RateLimit-Reset: 1699999999 # Unix timestamp when limit resets
Retry-After: 900              # Seconds until retry allowed
```

**Implementation:**
```typescript
return Response.json(
  { error: 'Too many requests' },
  {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
      'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
    },
  }
);
```

---

## User Experience Considerations

### Error Messages

**Good:**
- "Too many login attempts. Please try again in 15 minutes."
- "Rate limit exceeded. You can retry in 14 minutes."

**Bad:**
- "429 Too Many Requests" (too technical)
- "You are being rate limited" (sounds hostile)

### Frontend Handling

```typescript
// stores/auth-store.ts
if (response.status === 429) {
  const data = await response.json();
  const retryAfter = response.headers.get('Retry-After');

  throw new Error(
    data.error || `Too many attempts. Please wait ${retryAfter} seconds.`
  );
}
```

### Progressive Delays (Enhancement)

Instead of hard blocking at 5 attempts, add progressive delays:

1. Attempts 1-3: Instant response
2. Attempts 4-5: 2-second delay
3. Attempts 6+: Blocked for 15 minutes

**Implementation:**
```typescript
const delayMs = Math.min(2000, Math.max(0, (attempts - 3) * 1000));
await new Promise(resolve => setTimeout(resolve, delayMs));
```

---

## Monitoring & Alerts

### Metrics to Track

1. **Rate limit hits per endpoint** - High hits = potential attack
2. **Most rate-limited IPs** - Block persistent attackers
3. **False positives** - Legitimate users being blocked

### Upstash Analytics Dashboard

Upstash provides built-in analytics:
- Request volume by time
- Rate limit violations
- Top violating IPs

**Access:** https://console.upstash.com/

### Custom Alerts (Future)

```typescript
// Send alert if rate limit violations exceed threshold
if (rateLimitViolations > 100 in last 5 minutes) {
  sendSlackAlert('Potential brute force attack detected');
  // Consider blocking IP at firewall level
}
```

---

## Security Considerations

### IP Spoofing Prevention

**Problem:** Attackers can spoof `X-Forwarded-For` header

**Solution:**
```typescript
// Prefer Vercel's real IP header
const ip =
  request.headers.get('x-real-ip') ||         // Vercel's real IP
  request.ip ||                                // Next.js IP
  request.headers.get('x-forwarded-for')?.split(',')[0] ||
  'unknown';
```

### Per-Email Rate Limiting (Enhanced)

For signup/password reset, also rate limit by email:

```typescript
// Rate limit by both IP and email
const ipLimit = await loginLimiter.limit(ip);
const emailLimit = await loginLimiter.limit(email);

if (!ipLimit.success || !emailLimit.success) {
  return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

**Prevents:**
- Distributed attacks (multiple IPs, same email)
- Account enumeration

### Allowlist for Admins

Allow admins to bypass rate limits (for testing):

```typescript
const ADMIN_IPS = process.env.ADMIN_IP_ALLOWLIST?.split(',') || [];

if (ADMIN_IPS.includes(ip)) {
  // Skip rate limiting
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-secret-token

# Optional: Admin IPs to bypass rate limits (comma-separated)
ADMIN_IP_ALLOWLIST=127.0.0.1,::1
```

---

## Deployment Checklist

- [ ] Create Upstash Redis database
- [ ] Add environment variables to Vercel
- [ ] Implement rate limiting on `/api/auth/login`
- [ ] Implement rate limiting on `/api/auth/signup`
- [ ] Add rate limit headers to responses
- [ ] Update frontend error handling
- [ ] Write unit tests for rate limiting logic
- [ ] Write integration tests for auth endpoints
- [ ] Test with load testing tool (Artillery)
- [ ] Document rate limits in API docs
- [ ] Set up monitoring/alerts
- [ ] Test in staging environment
- [ ] Deploy to production

---

## References

- **OWASP Authentication Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#login-throttling
- **Upstash Rate Limiting Docs:** https://upstash.com/docs/redis/features/ratelimiting
- **Vercel Rate Limiting:** https://vercel.com/docs/edge-network/rate-limiting
- **IETF Rate Limiting Headers:** https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-ratelimit-headers

---

## Next Steps

1. **Create Upstash account** and Redis database (30 min)
2. **Implement rate limiting** on auth endpoints (3 hours)
3. **Add tests** for rate limiting logic (1 hour)
4. **Update documentation** with rate limit info (30 min)
5. **Deploy to staging** and test (1 hour)

**Total Estimated Time:** ~6 hours

**Blocked By:** None - can start immediately

**Owner:** Security/Safety Agent

**Due Date:** Before production launch (CRITICAL)

---

**Status:** 🔴 NOT IMPLEMENTED - BLOCKS PRODUCTION LAUNCH

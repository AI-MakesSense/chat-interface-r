# CRITICAL SECURITY FIXES REQUIRED

**Date:** 2025-11-11
**Status:** 🔴 BLOCKING DEPLOYMENT

---

## ⚠️ CRITICAL (P0) - FIX IMMEDIATELY

### 1. PostMessage Origin Validation Missing

**File:** `components/configurator/preview-frame.tsx` (lines 69-98)

**Current Code:**
```typescript
const handleMessage = (event: MessageEvent) => {
  // In production, verify event.origin for security
  // For now, accept all messages during development  // ⚠️ DANGEROUS
```

**Security Issue:**
- Any malicious iframe can send fake messages
- Attacker can inject false "PREVIEW_READY" or "PREVIEW_ERROR" messages
- Enables phishing and social engineering attacks

**Required Fix:**
```typescript
const handleMessage = (event: MessageEvent) => {
  // CRITICAL: Validate origin
  const allowedOrigins = [window.location.origin];

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
  }

  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Rejected postMessage from unauthorized origin:', event.origin);
    return;
  }

  // Validate message is from our iframe
  if (event.source !== iframeRef.current?.contentWindow) {
    console.warn('Message not from expected iframe');
    return;
  }

  const message = event.data as PreviewMessage;

  if (!message || !message.type) {
    return;
  }

  // Validate message type
  if (!Object.values(PreviewMessageType).includes(message.type)) {
    console.warn('Invalid message type:', message.type);
    return;
  }

  switch (message.type) {
    case PreviewMessageType.PREVIEW_READY:
      setPreviewReady(true);
      setIsLoading(false);
      if (iframeRef.current) {
        sendConfigUpdate(config);
      }
      break;

    case PreviewMessageType.PREVIEW_ERROR:
      // Sanitize error message
      const sanitizedError = message.payload?.error
        ?.toString()
        .substring(0, 200)
        .replace(/<[^>]*>/g, '') || 'Unknown preview error';
      setPreviewError(sanitizedError);
      setIsLoading(false);
      break;

    default:
      break;
  }
};
```

**Time Estimate:** 30 minutes
**Severity:** CRITICAL

---

### 2. Cookie Name Mismatch

**File:** `lib/auth/jwt.ts` (line 88)

**Current Code:**
```typescript
export function extractTokenFromCookie(
  cookieHeader: string | null,
  cookieName = 'auth_token'  // ⚠️ WRONG - should be 'auth-token'
): string | null {
```

**Security Issue:**
- Cookie is set as `auth-token` but default parameter looks for `auth_token`
- Authentication will fail if default parameter is used anywhere
- Silent authentication failures

**Required Fix:**
```typescript
export function extractTokenFromCookie(
  cookieHeader: string | null,
  cookieName = 'auth-token'  // ✅ Fixed
): string | null {
```

**Verification Needed:**
```bash
# Search for all uses of extractTokenFromCookie
grep -r "extractTokenFromCookie" --include="*.ts" --include="*.tsx"

# Ensure all calls explicitly pass 'auth-token' or use default
```

**Time Estimate:** 5 minutes
**Severity:** CRITICAL

---

## 🔴 HIGH PRIORITY (P1) - FIX BEFORE PRODUCTION

### 3. JWT Secret Fallback

**File:** `middleware.ts` (lines 31-33)

**Current Code:**
```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'  // ⚠️ DANGEROUS
);
```

**Security Issue:**
- If JWT_SECRET env var is missing, uses predictable fallback
- Attacker can forge tokens with fallback secret
- Complete authentication bypass

**Required Fix:**
```typescript
const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET_STRING.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
```

**Time Estimate:** 10 minutes
**Severity:** HIGH

---

### 4. User Data in LocalStorage (GDPR Violation)

**File:** `stores/auth-store.ts` (lines 262-269)

**Current Code:**
```typescript
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: 'auth-storage', // localStorage key
    partialize: (state) => ({
      // Only persist user data (not loading/error states)
      user: state.user,  // ⚠️ Contains PII (email, name, ID)
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

**Security Issue:**
- User email, name, ID stored in localStorage
- Accessible to XSS attacks and malicious browser extensions
- GDPR privacy violation (PII stored without explicit consent)
- Data persists after logout

**Required Fix:**

**Option 1 (Recommended):** Remove persistence entirely
```typescript
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // State will be restored on mount via checkAuth()
  // No persistence needed

  // ... rest of actions
}));
```

**Update logout to clear localStorage:**
```typescript
logout: async () => {
  set({ isLoading: true, error: null });

  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear any persisted data
    localStorage.removeItem('auth-storage');

  } catch (error) {
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    });

    // Clear even on error
    localStorage.removeItem('auth-storage');
  }
},
```

**Time Estimate:** 20 minutes
**Severity:** HIGH (Privacy/GDPR)

---

### 5. Rate Limiting Missing

**Files:** All authentication routes

**Security Issue:**
- No rate limiting on login/signup endpoints
- Enables brute force password attacks
- Account enumeration possible
- DoS attacks on auth endpoints

**Required Fix:**

Create rate limiting utility:
```typescript
// File: lib/auth/rate-limit.ts
import { LRUCache } from 'lru-cache';

type RateLimitConfig = {
  uniqueTokenPerInterval: number;
  interval: number;
};

export function rateLimit(config: RateLimitConfig) {
  const tokenCache = new LRUCache({
    max: config.uniqueTokenPerInterval,
    ttl: config.interval,
  });

  return {
    check: (identifier: string, limit: number): boolean => {
      const tokenCount = (tokenCache.get(identifier) as number) || 0;

      if (tokenCount >= limit) {
        return false;
      }

      tokenCache.set(identifier, tokenCount + 1);
      return true;
    },
  };
}
```

Apply to auth routes:
```typescript
// File: app/api/auth/login/route.ts
import { rateLimit } from '@/lib/auth/rate-limit';

const loginLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
});

export async function POST(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

  // Check rate limit: 5 attempts per minute per IP
  if (!loginLimiter.check(ip, 5)) {
    return errorResponse('Too many login attempts. Please try again later.', 429);
  }

  // Continue with login logic...
}
```

Apply same to signup route with limit of 3 per minute.

**Time Estimate:** 2 hours
**Severity:** HIGH

---

## 📋 Quick Checklist

Before deploying to production:

- [ ] Fix postMessage origin validation (30 min)
- [ ] Fix cookie name mismatch (5 min)
- [ ] Fix JWT secret fallback (10 min)
- [ ] Remove localStorage persistence (20 min)
- [ ] Implement rate limiting (2 hours)
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Add security test suite
- [ ] Review full audit report: `docs/reviews/PHASE4_SECURITY_AUDIT.md`

**Total Time for Critical Fixes:** ~3 hours

---

## Testing Required

After implementing fixes, run:

```bash
# 1. Cookie authentication test
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Verify cookie name is 'auth-token'
cat cookies.txt | grep auth-token

# 2. PostMessage origin test
# Open browser console on configurator page
# Try sending fake message from console:
window.postMessage({ type: 'PREVIEW_READY' }, '*');
# Should be rejected with console warning

# 3. Rate limiting test
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' &
done
# At least one request should return 429 status

# 4. JWT secret validation test
# Stop server, unset JWT_SECRET, try to start
unset JWT_SECRET
npm run dev
# Should fail with error message about JWT_SECRET required
```

---

## Additional Resources

- Full Security Audit Report: `docs/reviews/PHASE4_SECURITY_AUDIT.md`
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Next.js Security Best Practices: https://nextjs.org/docs/security

---

**BLOCKING:** These fixes must be completed before any production deployment.

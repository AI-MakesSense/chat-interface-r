# Phase 4 Frontend Security Audit Report

**Date:** 2025-11-11
**Auditor:** Security/Safety Agent
**Scope:** Phase 4 Frontend Implementation (Authentication UI, Dashboard, Widget Configurator, Preview System)

---

## Executive Summary

This security audit reviewed the Phase 4 frontend implementation for security vulnerabilities. The audit covered authentication flows, input validation, client-side storage, iframe security, API request security, and common web vulnerabilities.

**Overall Security Posture:** GOOD with CRITICAL and HIGH severity issues requiring immediate attention.

**Key Findings:**
- ✅ Strong authentication implementation with HTTP-only cookies
- ✅ Good password validation and strength requirements
- ✅ Proper iframe sandboxing in place
- ⚠️ **CRITICAL:** PostMessage origin validation missing (P0)
- ⚠️ **CRITICAL:** Cookie name mismatch bug fixed but needs verification (P0)
- ⚠️ **HIGH:** JWT secret fallback in middleware creates security risk (P1)
- ⚠️ **HIGH:** User data persisted to localStorage (privacy concern) (P1)
- ⚠️ **MEDIUM:** Missing CSRF token validation (P2)
- ⚠️ **MEDIUM:** Console logging in production code (P2)

---

## 1. Authentication Security

### 1.1 Cookie Configuration ✅ GOOD

**File:** `lib/auth/middleware.ts` (lines 65-66)

```typescript
export function createAuthCookie(token: string, maxAge = 60 * 60 * 24 * 7): string {
  return `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
```

**Assessment:** SECURE
- ✅ HttpOnly flag prevents XSS access
- ✅ Secure flag requires HTTPS
- ✅ SameSite=Strict prevents CSRF
- ✅ 7-day expiration is reasonable
- ✅ Path=/ is appropriate

**Recommendation:** No changes needed.

---

### 1.2 Cookie Name Consistency ⚠️ CRITICAL (P0)

**Issue:** Cookie name mismatch between different parts of the codebase was recently fixed.

**Files:**
- `lib/auth/jwt.ts` line 88: `cookieName = 'auth_token'` (default parameter)
- `lib/auth/middleware.ts` line 66: Cookie set as `auth-token`
- `middleware.ts` line 72: Cookie read as `auth-token`

**Current State:** The bug report indicates this was fixed to use consistent `auth-token`, but the default parameter in `extractTokenFromCookie()` still shows `auth_token`.

**Impact:** Authentication will fail silently if the default parameter is used anywhere.

**Exploit Scenario:**
1. User logs in successfully
2. Cookie is set as `auth-token`
3. Some code path calls `extractTokenFromCookie()` without specifying cookie name
4. Default `auth_token` is used, cookie not found
5. User appears unauthenticated despite valid session

**Fix Required:**
```typescript
// File: lib/auth/jwt.ts, line 88
export function extractTokenFromCookie(
  cookieHeader: string | null,
  cookieName = 'auth-token' // Changed from 'auth_token'
): string | null {
```

**Priority:** P0 - Fix immediately and verify all cookie operations use `auth-token`.

---

### 1.3 JWT Secret Configuration ⚠️ HIGH (P1)

**File:** `middleware.ts` (lines 31-33)

```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-change-in-production'
);
```

**Issue:** Fallback secret defeats security if environment variable is missing.

**Impact:**
- In production, if JWT_SECRET is not set, uses weak predictable fallback
- Attacker can forge tokens if they know the fallback value
- Silent failure - no error thrown, just insecure operation

**Exploit Scenario:**
1. Deployment misconfiguration leaves JWT_SECRET unset
2. Application uses fallback secret
3. Attacker discovers fallback value from source code (public GitHub)
4. Attacker generates valid JWT tokens for any user
5. Complete authentication bypass

**Recommended Fix:**
```typescript
// middleware.ts
const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET_STRING.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
```

**Note:** The proper validation exists in `lib/auth/jwt.ts` (lines 17-25) but NOT in `middleware.ts`.

**Priority:** P1 - Fix before production deployment.

---

### 1.4 Password Validation ✅ GOOD

**File:** `components/auth/signup-form.tsx` (lines 51-57)

```typescript
password: z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number'),
```

**Assessment:** SECURE
- ✅ Minimum 8 characters
- ✅ Requires uppercase, lowercase, number
- ✅ Maximum length prevents DoS
- ✅ Client-side validation matches server-side (`lib/auth/password.ts`)

**Recommendation:** Consider adding special character requirement for enhanced security (optional).

---

### 1.5 Email Validation ✅ GOOD

**Files:**
- `components/auth/login-form.tsx` (line 35-36)
- `components/auth/signup-form.tsx` (line 47-50)

```typescript
email: z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters'),
```

**Assessment:** SECURE
- ✅ Uses Zod email validator (prevents basic injection)
- ✅ Maximum length prevents DoS
- ✅ Required field validation

**Recommendation:** No changes needed.

---

### 1.6 Session Management ✅ GOOD

**File:** `stores/auth-store.ts` (lines 204-239)

**Assessment:**
- ✅ `checkAuth()` validates existing session on mount
- ✅ Graceful handling of expired tokens
- ✅ No error shown to user for failed auth check (correct UX)
- ✅ Token verification handled server-side

**Recommendation:** No changes needed.

---

## 2. Client-Side Storage Security

### 2.1 LocalStorage Usage ⚠️ HIGH (P1)

**File:** `stores/auth-store.ts` (lines 262-269)

```typescript
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: 'auth-storage', // localStorage key
    partialize: (state) => ({
      // Only persist user data (not loading/error states)
      user: state.user,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

**Issue:** User data (email, name, ID) persisted to localStorage.

**Security Analysis:**
- ✅ JWT token NOT stored in localStorage (stored in HTTP-only cookie)
- ✅ Password NOT stored
- ⚠️ User email, name, and ID ARE stored in localStorage

**Privacy Concerns:**
1. **XSS Vulnerability:** If XSS occurs, attacker can read user email/name
2. **Browser Extensions:** Malicious extensions can access localStorage
3. **Shared Computers:** User data persists after logout until browser cache cleared
4. **GDPR/Privacy:** User PII stored client-side without explicit consent

**Impact Assessment:**
- Low-Medium severity (no credentials leaked)
- Privacy violation, not authentication bypass
- User email can be harvested by XSS or malicious extensions

**Recommended Actions:**

**Option 1 (Minimal - P2):** Document and accept risk
- Add comment explaining why user data is in localStorage
- Ensure users understand in privacy policy
- Clear localStorage on logout

**Option 2 (Better - P1):** Remove persistence
```typescript
// Remove persist middleware entirely
export const useAuthStore = create<AuthState>((set, get) => ({
  // State will be re-fetched on mount via checkAuth()
}));
```

**Option 3 (Best - P1):** Encrypt sensitive data
```typescript
// Use Zustand persist with encryption
import { createJSONStorage } from 'zustand/middleware';
import { encrypt, decrypt } from '@/lib/crypto'; // Implement encryption

persist(
  /* ... */,
  {
    name: 'auth-storage',
    storage: createJSONStorage(() => ({
      getItem: (key) => {
        const encrypted = localStorage.getItem(key);
        return encrypted ? decrypt(encrypted) : null;
      },
      setItem: (key, value) => {
        localStorage.setItem(key, encrypt(value));
      },
      removeItem: (key) => localStorage.removeItem(key),
    })),
  }
)
```

**Recommendation:** Implement Option 2 (remove persistence) for Phase 4. Session restoration via `checkAuth()` on mount is sufficient.

**Priority:** P1 - Fix before production for GDPR compliance.

---

### 2.2 LocalStorage Cleanup on Logout ⚠️ MEDIUM (P2)

**File:** `stores/auth-store.ts` (lines 168-196)

**Issue:** Logout clears Zustand state but localStorage may not be cleared immediately.

**Recommended Fix:**
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

    // NEW: Explicitly clear localStorage
    localStorage.removeItem('auth-storage');

  } catch (error) {
    // Even if logout fails, clear local state and storage
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    });

    // NEW: Clear localStorage even on error
    localStorage.removeItem('auth-storage');
  }
},
```

**Priority:** P2 - Implement alongside localStorage persistence fix.

---

## 3. Input Validation & Injection Prevention

### 3.1 Domain Validation ✅ GOOD

**File:** `lib/license/domain.ts`

**Assessment:**
- ✅ Comprehensive domain normalization (lines 11-45)
- ✅ Validates domain structure (lines 52-120)
- ✅ Prevents subdomain takeover (rejects localhost, IPs)
- ✅ Length limits prevent ReDoS (1-253 chars)
- ✅ Label validation prevents DNS rebinding

**Recommendation:** No changes needed. Excellent implementation.

---

### 3.2 Webhook URL Validation ✅ GOOD

**File:** `lib/validation/widget-schema.ts` (lines 194-203)

```typescript
const webhookUrlSchema = z
  .string()
  .refine(
    (url) => url === '' || (url.startsWith('https://') || url.includes('localhost')),
    'Must be a valid HTTPS URL (or empty for configuration)'
  )
  .refine(
    (url) => url === '' || z.string().url().safeParse(url).success,
    'Must be a valid URL format or empty'
  );
```

**Assessment:** SECURE
- ✅ Enforces HTTPS (prevents MITM)
- ✅ Allows localhost for development
- ✅ Validates URL structure
- ✅ Prevents SSRF (no file://, javascript:, data: schemes)

**Recommendation:** No changes needed.

---

### 3.3 Hex Color Validation ✅ GOOD

**File:** `lib/validation/widget-schema.ts` (lines 26-28)

```typescript
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');
```

**Assessment:** SECURE
- ✅ Strict format prevents injection
- ✅ No CSS injection possible
- ✅ Fixed length prevents DoS

**Recommendation:** No changes needed.

---

### 3.4 XSS Prevention in Forms ✅ GOOD

**Files:**
- `components/auth/login-form.tsx`
- `components/auth/signup-form.tsx`
- `components/dashboard/domain-input.tsx`

**Assessment:**
- ✅ All form inputs use React controlled components
- ✅ No `dangerouslySetInnerHTML` usage found (grep confirmed)
- ✅ Error messages rendered safely with `{error}` syntax
- ✅ No direct DOM manipulation

**Recommendation:** No changes needed.

---

## 4. Iframe Security

### 4.1 Iframe Sandbox ✅ GOOD

**File:** `components/configurator/preview-frame.tsx` (line 460)

```typescript
sandbox="allow-scripts allow-same-origin allow-forms"
```

**Assessment:** SECURE
- ✅ `allow-scripts` - Required for widget functionality
- ✅ `allow-same-origin` - Required for postMessage
- ✅ `allow-forms` - Required for input fields
- ✅ Missing `allow-top-navigation` - Prevents frame-busting (correct)
- ✅ Missing `allow-popups` - Prevents popup spam (correct)
- ✅ Missing `allow-modals` - Prevents alert() spam (correct)

**Recommendation:** No changes needed. Minimal required permissions granted.

---

### 4.2 PostMessage Origin Validation ⚠️ CRITICAL (P0)

**File:** `components/configurator/preview-frame.tsx` (lines 69-98)

```typescript
// Message listener for iframe communication
const handleMessage = (event: MessageEvent) => {
  // In production, verify event.origin for security
  // For now, accept all messages during development

  const message = event.data as PreviewMessage;

  if (!message || !message.type) {
    return;
  }

  switch (message.type) {
    case PreviewMessageType.PREVIEW_READY:
      setPreviewReady(true);
      setIsLoading(false);
      // Send initial config
      if (iframeRef.current) {
        sendConfigUpdate(config);
      }
      break;

    case PreviewMessageType.PREVIEW_ERROR:
      setPreviewError(message.payload?.error || 'Unknown preview error');
      setIsLoading(false);
      break;

    default:
      break;
  }
};
```

**Issue:** **CRITICAL** - Origin validation disabled with TODO comment.

**Impact:**
- **CRITICAL SEVERITY** - Malicious iframes can impersonate widget preview
- Attacker can inject false "PREVIEW_READY" messages
- Attacker can trigger error states with malicious payloads
- Open door for clickjacking and UI redressing attacks

**Exploit Scenario:**
1. Attacker creates malicious website with iframe to victim's configurator
2. Attacker's page sends postMessage with type "PREVIEW_ERROR"
3. Victim sees fake error messages controlled by attacker
4. Social engineering: "Your account has been suspended, click here..."
5. Phishing attack successful

**Required Fix:**
```typescript
const handleMessage = (event: MessageEvent) => {
  // CRITICAL: Validate origin
  const allowedOrigins = [
    window.location.origin, // Same origin (for srcDoc iframes)
  ];

  // For development, also allow localhost variants
  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://127.0.0.1:3000');
  }

  // Validate origin
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Rejected postMessage from unauthorized origin:', event.origin);
    return;
  }

  // Additional validation: Ensure message is from our iframe
  if (event.source !== iframeRef.current?.contentWindow) {
    console.warn('Message not from expected iframe');
    return;
  }

  const message = event.data as PreviewMessage;

  if (!message || !message.type) {
    return;
  }

  // Type guard: Validate message type
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
      // Sanitize error message (limit length, remove HTML)
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

**Testing Strategy:**
```typescript
// Add unit test for origin validation
describe('PreviewFrame postMessage security', () => {
  it('should reject messages from unauthorized origins', () => {
    const handleMessage = /* ... */;
    const fakeEvent = {
      origin: 'https://evil.com',
      data: { type: 'PREVIEW_READY' },
    };

    handleMessage(fakeEvent as MessageEvent);

    // Assert: setPreviewReady should NOT be called
    expect(setPreviewReady).not.toHaveBeenCalled();
  });

  it('should accept messages from same origin', () => {
    const handleMessage = /* ... */;
    const validEvent = {
      origin: window.location.origin,
      source: iframeRef.current?.contentWindow,
      data: { type: 'PREVIEW_READY' },
    };

    handleMessage(validEvent as MessageEvent);

    // Assert: setPreviewReady SHOULD be called
    expect(setPreviewReady).toHaveBeenCalledWith(true);
  });
});
```

**Priority:** P0 - CRITICAL - Fix immediately before any deployment.

---

### 4.3 PostMessage Sending Security ⚠️ MEDIUM (P2)

**File:** `stores/preview-store.ts` (line 175)

```typescript
// Send message to iframe
iframeRef.contentWindow.postMessage(message, '*');
```

**Issue:** Target origin is wildcard `'*'` - allows any origin to receive messages.

**Impact:**
- Medium severity - Config data could be intercepted if iframe is compromised
- If attacker somehow controls iframe source, they receive config updates
- Widget config contains webhook URLs (sensitive data)

**Recommended Fix:**
```typescript
// Send message to iframe
iframeRef.contentWindow.postMessage(message, window.location.origin);
```

**For srcDoc iframes:** Origin should be same as parent, so `window.location.origin` is correct.

**Priority:** P2 - Fix in next security update.

---

## 5. API Request Security

### 5.1 Credentials Handling ✅ GOOD

**Files:**
- `stores/auth-store.ts` (lines 87-91, 131-135, 172-174, 208-209)
- `stores/widget-store.ts` (lines 167-169, 200-204, 241-243, etc.)

**Assessment:**
- ✅ All fetch calls use `credentials: 'include'`
- ✅ Ensures cookies sent with cross-origin requests
- ✅ Works with HTTP-only cookies

**Example:**
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ✅ Correct
  body: JSON.stringify({ email, password }),
});
```

**Recommendation:** No changes needed.

---

### 5.2 Error Message Leakage ⚠️ MEDIUM (P2)

**Files:** Multiple store files and components

**Issue:** Error messages returned from API are displayed directly to users.

**Example:** `stores/auth-store.ts` (lines 95-96)
```typescript
const error = await response.json();
throw new Error(error.error || 'Login failed');
```

**Potential Information Disclosure:**
- Database error messages (e.g., "user with email X does not exist")
- Stack traces (if API is misconfigured)
- Internal service names

**Recommended Fix:**
```typescript
// API route side (backend)
// File: app/api/auth/login/route.ts
if (!user) {
  return errorResponse('Invalid email or password', 401); // ✅ Generic message
}

// Client side
const error = await response.json();
// Sanitize error message before displaying
const sanitizedError = sanitizeErrorMessage(error.error) || 'Login failed';
throw new Error(sanitizedError);

// Utility function
function sanitizeErrorMessage(msg: string | undefined): string | undefined {
  if (!msg) return undefined;

  // Remove sensitive patterns
  const sanitized = msg
    .replace(/database/gi, 'system')
    .replace(/user with email .+ does/gi, 'user')
    .replace(/at \w+\.\w+:\d+/g, ''); // Remove stack trace lines

  return sanitized;
}
```

**Priority:** P2 - Implement before production.

---

### 5.3 Token Exposure in Response ⚠️ LOW (P3)

**Files:**
- `app/api/auth/login/route.ts` (line 50)
- `app/api/auth/signup/route.ts` (line 62)

```typescript
const response = Response.json({
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
  token, // ⚠️ Token included in response body
});
```

**Issue:** JWT token returned in JSON response body AND set as cookie.

**Analysis:**
- ✅ Token is also set as HTTP-only cookie (correct)
- ⚠️ Token is ALSO returned in response body (unnecessary)
- ⚠️ If client-side code ever stores this token, it defeats HTTP-only protection

**Current Usage:**
- `stores/auth-store.ts` does NOT store the token (good)
- Only user object is extracted from response

**Recommendation:**
```typescript
// Remove token from response body
const response = Response.json({
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
  },
  // token field removed - only in HTTP-only cookie
});
```

**Rationale:**
- Defense in depth: Even if client code is compromised, token not accessible
- Reduces attack surface for XSS
- Cookie is sufficient for authentication

**Priority:** P3 - Nice to have, not critical since client doesn't use it.

---

## 6. CSRF Protection

### 6.1 SameSite Cookie Protection ✅ GOOD

**File:** `lib/auth/middleware.ts` (line 66)

```typescript
return `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
```

**Assessment:**
- ✅ `SameSite=Strict` prevents CSRF attacks
- ✅ Cookie not sent on cross-origin requests
- ✅ No CSRF token needed for same-origin requests

**Recommendation:** No changes needed for Phase 4.

---

### 6.2 CSRF Token for State-Changing Operations ⚠️ MEDIUM (P2)

**Current State:** No CSRF token implementation.

**Analysis:**
- ✅ SameSite=Strict cookie provides strong CSRF protection
- ⚠️ Defense in depth: CSRF token would add extra layer
- ⚠️ Required for browser compatibility (some old browsers don't support SameSite)

**Recommended Enhancement (Post-MVP):**
```typescript
// Generate CSRF token on login
// Store in separate cookie (not HTTP-only, so JS can read it)
// Require X-CSRF-Token header on all state-changing requests

// Example implementation:
// 1. Server sets csrf_token cookie (not HTTP-only)
// 2. Client reads cookie and includes in X-CSRF-Token header
// 3. Server validates token matches cookie

// File: lib/auth/csrf.ts
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(
  cookieToken: string,
  headerToken: string
): boolean {
  return cookieToken === headerToken;
}
```

**Priority:** P2 - Not critical due to SameSite=Strict, but good defense-in-depth.

---

## 7. Content Security Policy (CSP)

### 7.1 CSP Headers ❌ MISSING (P2)

**Current State:** No CSP headers detected.

**Recommendation:**
```typescript
// File: middleware.ts or next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.stripe.com;
  frame-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

// Add to response headers
response.headers.set('Content-Security-Policy', cspHeader);
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

**Note:** `'unsafe-inline'` and `'unsafe-eval'` needed for:
- Next.js requires inline scripts for hydration
- React devtools
- Consider using nonce-based CSP for production

**Priority:** P2 - Implement before production launch.

---

## 8. Rate Limiting

### 8.1 Authentication Rate Limiting ❌ MISSING (P1)

**Current State:** No rate limiting on auth endpoints.

**Risk:**
- Brute force password attacks
- Account enumeration (test if email exists)
- DoS attacks on auth endpoints

**Recommended Implementation:**
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
        return false; // Rate limit exceeded
      }

      tokenCache.set(identifier, tokenCount + 1);
      return true; // Within limit
    },
  };
}

// Usage in auth routes
const loginLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60000, // 1 minute
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  // Check rate limit: 5 attempts per minute
  if (!loginLimiter.check(ip, 5)) {
    return errorResponse('Too many login attempts. Try again later.', 429);
  }

  // Continue with login logic...
}
```

**Priority:** P1 - Implement before production.

---

## 9. Console Logging

### 9.1 Console Logs in Production ⚠️ MEDIUM (P2)

**Issue:** 20+ files contain console.log/warn/error statements.

**Examples:**
- `stores/preview-store.ts` (lines 160, 165)
- `lib/auth/jwt.ts` (line 57)
- `lib/auth/password.ts` (likely)

**Security Concerns:**
1. Information disclosure (internal paths, error details)
2. Performance impact in production
3. Cluttered browser console for users

**Recommended Fix:**
```typescript
// File: lib/utils/logger.ts
export const logger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[INFO]', ...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // TODO: Send to Sentry in production
  },
};

// Replace all console.log with logger.debug
// Replace all console.warn with logger.warn
// Replace all console.error with logger.error
```

**Priority:** P2 - Clean up before production.

---

## 10. Dependency Security

### 10.1 Dependency Audit Recommendation

**Action Required:**
```bash
cd n8n-widget-designer
npm audit
# or
pnpm audit
```

**Check for:**
- Known vulnerabilities in dependencies
- Outdated packages with security patches
- Transitive dependency vulnerabilities

**Priority:** P1 - Run audit and update packages before production.

---

## 11. Environment Variables

### 11.1 Environment Variable Validation ⚠️ MEDIUM (P2)

**File:** `.env.example`

**Current State:**
```env
JWT_SECRET=generate-with-openssl-rand-base64-32
DATABASE_URL=postgresql://user:password@localhost:5432/n8n_widget_designer
```

**Issues:**
1. No runtime validation of required env vars
2. No type checking for env vars
3. Weak example values (should not be copy-pasteable)

**Recommended Enhancement:**
```typescript
// File: lib/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NEXT_PUBLIC_URL: z.string().url(),

  // Optional (with defaults)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Stripe (optional for development)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Usage: import { env } from '@/lib/config/env'
```

**Priority:** P2 - Implement before production.

---

## 12. Testing Recommendations

### 12.1 Security Test Coverage

**Required Tests:**

1. **Authentication Tests**
   - ✅ Existing: Basic auth flow tests
   - ❌ Missing: Session expiration tests
   - ❌ Missing: Concurrent login tests
   - ❌ Missing: Cookie tampering tests

2. **Authorization Tests**
   - ❌ Missing: User can only access own licenses
   - ❌ Missing: User can only edit own widgets
   - ❌ Missing: License domain validation bypass attempts

3. **Input Validation Tests**
   - ✅ Existing: Some validation tests
   - ❌ Missing: XSS payload tests
   - ❌ Missing: SQL injection tests (paranoid, should be blocked by ORM)
   - ❌ Missing: ReDoS tests for regex validators

4. **CSRF Tests**
   - ❌ Missing: Cross-origin request tests
   - ❌ Missing: SameSite cookie enforcement tests

**Recommended Test Suite:**
```typescript
// File: tests/security/auth.security.test.ts
describe('Authentication Security', () => {
  it('should reject login with SQL injection payload', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: "admin' OR '1'='1",
        password: "anything",
      }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'Invalid email or password',
    });
  });

  it('should reject login with XSS payload', async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '<script>alert("xss")</script>@example.com',
        password: 'password123',
      }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: expect.stringContaining('Invalid email'),
    });
  });

  it('should enforce rate limiting on login', async () => {
    const requests = Array(10).fill(null).map(() =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      })
    );

    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status);

    // At least one request should be rate limited (429)
    expect(statusCodes).toContain(429);
  });
});
```

**Priority:** P1 - Add critical security tests before production.

---

## Summary of Findings

### Critical Vulnerabilities (P0) - FIX IMMEDIATELY

1. **PostMessage Origin Validation Missing** (Section 4.2)
   - File: `components/configurator/preview-frame.tsx`
   - Impact: Malicious iframes can send fake messages
   - Fix: Add origin validation to message handler
   - Estimated time: 30 minutes

2. **Cookie Name Mismatch** (Section 1.2)
   - File: `lib/auth/jwt.ts` line 88
   - Impact: Authentication may fail if default parameter used
   - Fix: Change default from `auth_token` to `auth-token`
   - Estimated time: 5 minutes

### High Severity (P1) - FIX BEFORE PRODUCTION

3. **JWT Secret Fallback in Middleware** (Section 1.3)
   - File: `middleware.ts` lines 31-33
   - Impact: Weak secret if env var missing
   - Fix: Throw error if JWT_SECRET not set
   - Estimated time: 10 minutes

4. **User Data in LocalStorage** (Section 2.1)
   - File: `stores/auth-store.ts`
   - Impact: Privacy violation, GDPR concern
   - Fix: Remove persist middleware
   - Estimated time: 20 minutes

5. **Rate Limiting Missing** (Section 8.1)
   - Files: All auth routes
   - Impact: Brute force attacks possible
   - Fix: Implement rate limiting middleware
   - Estimated time: 2 hours

### Medium Severity (P2) - FIX IN NEXT SPRINT

6. **PostMessage Target Origin Wildcard** (Section 4.3)
   - File: `stores/preview-store.ts` line 175
   - Impact: Config data could be intercepted
   - Fix: Use specific origin instead of '*'
   - Estimated time: 10 minutes

7. **LocalStorage Not Cleared on Logout** (Section 2.2)
   - File: `stores/auth-store.ts`
   - Impact: User data persists after logout
   - Fix: Explicitly clear localStorage
   - Estimated time: 10 minutes

8. **Error Message Leakage** (Section 5.2)
   - Files: Multiple store files
   - Impact: Information disclosure
   - Fix: Sanitize error messages
   - Estimated time: 1 hour

9. **Console Logging in Production** (Section 9.1)
   - Files: 20+ files
   - Impact: Information disclosure
   - Fix: Implement logger utility
   - Estimated time: 2 hours

10. **CSP Headers Missing** (Section 7.1)
    - Impact: XSS protection weakened
    - Fix: Add CSP headers in middleware
    - Estimated time: 1 hour

11. **Environment Variable Validation** (Section 11.1)
    - Impact: Runtime errors if misconfigured
    - Fix: Add Zod schema for env vars
    - Estimated time: 30 minutes

### Low Severity (P3) - NICE TO HAVE

12. **Token in Response Body** (Section 5.3)
    - Files: Auth routes
    - Impact: Unnecessary token exposure
    - Fix: Remove token from JSON response
    - Estimated time: 10 minutes

---

## Recommended Action Plan

### Phase 1 (Immediate - 1 hour)
1. Fix PostMessage origin validation (P0)
2. Fix cookie name mismatch (P0)
3. Fix JWT secret fallback (P1)
4. Add tests for critical fixes

### Phase 2 (Before Production - 1 day)
5. Remove localStorage persistence (P1)
6. Implement rate limiting (P1)
7. Run dependency audit and update (P1)
8. Add security test suite (P1)

### Phase 3 (Next Sprint - 2 days)
9. Fix postMessage target origin (P2)
10. Implement console logging cleanup (P2)
11. Add CSP headers (P2)
12. Sanitize error messages (P2)
13. Add environment validation (P2)

### Phase 4 (Post-Launch - Optional)
14. Remove token from response body (P3)
15. Implement CSRF tokens (P2, defense-in-depth)
16. Add password special character requirement (P3)

---

## Conclusion

The Phase 4 frontend implementation demonstrates **good security practices** overall, with proper use of HTTP-only cookies, password validation, and input sanitization. However, **two critical vulnerabilities** require immediate attention:

1. **PostMessage origin validation** is missing, creating a significant security hole
2. **Cookie name inconsistency** could cause authentication failures

Additionally, several **high-priority improvements** should be implemented before production:
- Rate limiting on authentication endpoints
- Removal of user data from localStorage (GDPR)
- JWT secret validation in middleware

The remaining issues are **medium to low severity** and can be addressed in subsequent sprints.

**Overall Assessment:** GOOD with critical fixes needed before deployment.

---

**Report Generated:** 2025-11-11
**Next Review:** After critical fixes implemented

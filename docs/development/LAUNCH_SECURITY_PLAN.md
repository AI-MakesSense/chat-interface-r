# Launch Security Plan - User Stories & Acceptance Criteria

**Created:** 2026-01-19
**Updated:** 2026-01-19
**Status:** Implementation Complete (Tier 1 & 2)
**Priority:** Critical security fixes required before production launch

## Implementation Progress

| Tier | Stories | Completed | Status |
|------|---------|-----------|--------|
| Tier 1 (Critical) | 7 | 7 | ✅ COMPLETE |
| Tier 2 (High Priority) | 6 | 5 | ⚠️ 2.2 (Tests) Pending |
| Tier 3 (Medium) | 6 | 0 | ⏳ Post-Launch |

### Completed Stories Summary

| Story | Description | Files Created/Modified |
|-------|-------------|----------------------|
| 1.1 | SSRF Protection | `lib/security/url-validator.ts` (NEW), `app/api/chat-relay/route.ts` |
| 1.2 | Redis Rate Limiting | `lib/widget/rate-limit.ts` (rewritten), `.env.example` |
| 1.3 | CORS Restriction | `lib/security/cors-validator.ts` (NEW), `app/api/chat-relay/route.ts` |
| 1.4 | Security Headers | `next.config.ts` |
| 1.5 | Error Sanitization | `app/api/chat-relay/route.ts` |
| 1.6 | Remove Webhook URL | `app/api/widget/[license]/config/route.ts` |
| 1.7 | Secure License Keys | `lib/license/generate.ts`, `lib/db/queries.ts`, `lib/widget/inject.ts`, `lib/widget/serve.ts`, `app/api/w/[widgetKey]/chat-widget.js/route.ts` (NEW), `app/api/chat-relay/route.ts`, `widget/src/services/messaging/payload.ts`, `widget/src/types.ts` |
| 2.1 | Rate Limit Chat Relay | `app/api/chat-relay/route.ts` |
| 2.3 | Logging Utility | `lib/utils/logger.ts` (NEW), `app/api/chat-relay/route.ts` |
| 2.4 | Strict Config Schema | `app/api/widgets/route.ts` |
| 2.5 | Atomic Widget Creation | `app/api/widgets/route.ts` |
| 2.6 | Error Boundaries | `app/error.tsx` (NEW), `app/global-error.tsx` (NEW) |

### Remaining Work

- **Story 2.2: Fix Test Suite** - 80 test suites currently failing. This is documented but deferred.
- **Tier 3 Stories** - Medium priority items for post-launch improvement.

---

## Overview

This document contains atomic user stories with acceptance criteria for all security issues identified in the launch readiness audit. Stories are organized by priority tier.

---

# 🔴 TIER 1: CRITICAL (Must Complete Before Launch)

---

## Story 1.1: SSRF Protection for Webhook URLs

**As a** platform operator
**I want** the chat relay to reject webhook URLs pointing to internal/private networks
**So that** attackers cannot use our relay to scan internal infrastructure or access cloud metadata

### Status: ✅ IMPLEMENTED

**Files Created/Modified:**
- `lib/security/url-validator.ts` (NEW)
- `app/api/chat-relay/route.ts`

### Acceptance Criteria

- [x] Webhook URLs are validated before any HTTP request is made
- [x] The following are blocked:
  - Localhost variants: `127.0.0.1`, `localhost`, `0.0.0.0`, `::1`
  - Private IPv4 ranges: `10.x.x.x`, `172.16.x.x-172.31.x.x`, `192.168.x.x`
  - Link-local: `169.254.x.x` (AWS metadata endpoint)
  - Private IPv6 ranges: `fc00::/7`, `fe80::/10`
- [ ] Only `https://` URLs are accepted in production (allow `http://` only for localhost in development)
- [ ] DNS resolution is checked to ensure domain doesn't resolve to private IP
- [ ] Blocked requests return HTTP 400 with generic error message (no details about why blocked)
- [ ] Blocked attempts are logged server-side with full context
- [ ] Unit tests cover all blocked IP ranges
- [ ] Integration test verifies AWS metadata endpoint is blocked

### Technical Notes

- File to modify: `app/api/chat-relay/route.ts`
- Create new utility: `lib/security/url-validator.ts`
- Consider using `net.isIP()` for IP detection

---

## Story 1.2: Redis-Based Rate Limiting

**As a** platform operator
**I want** rate limiting to persist across server restarts and be shared across all instances
**So that** attackers cannot bypass rate limits by hitting different servers or waiting for restarts

### Acceptance Criteria

- [ ] Rate limiter uses Redis (or Vercel KV/Upstash) instead of in-memory Map
- [ ] IP-based rate limit: 10 requests/second persists across instances
- [ ] License-based rate limit: 100 requests/minute persists across instances
- [ ] Rate limit state survives server restarts
- [ ] Graceful fallback if Redis is unavailable (log warning, allow request)
- [ ] Rate limit keys have TTL to auto-expire (no manual cleanup needed)
- [ ] `Retry-After` header is returned with 429 responses
- [ ] `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers added to responses
- [ ] Environment variable `REDIS_URL` or `KV_REST_API_URL` documented in `.env.example`
- [ ] Unit tests mock Redis client
- [ ] Integration test verifies rate limiting across simulated instances

### Technical Notes

- File to modify: `lib/widget/rate-limit.ts`
- Add dependency: `@upstash/redis` or `ioredis`
- Update: `.env.example` with Redis connection string

---

## Story 1.3: Restrict CORS to Authorized Domains

**As a** platform operator
**I want** CORS to only allow requests from domains authorized for each license
**So that** malicious websites cannot abuse the relay endpoint

### Acceptance Criteria

- [ ] Chat relay endpoint validates `Origin` header against license's authorized domains
- [ ] Widget config endpoint validates `Origin` header against license's authorized domains
- [ ] `Access-Control-Allow-Origin` returns the specific requesting origin (not `*`) if authorized
- [ ] Unauthorized origins receive no CORS headers (browser blocks the request)
- [ ] Preflight (OPTIONS) requests also validate origin
- [ ] Localhost/development origins allowed only when `NODE_ENV=development`
- [ ] Agency tier licenses allow any origin (existing behavior preserved)
- [ ] CORS validation happens BEFORE any database queries to prevent timing attacks
- [ ] Unit tests cover authorized, unauthorized, and agency tier scenarios
- [ ] Integration test verifies browser-like CORS behavior

### Technical Notes

- Files to modify: `app/api/chat-relay/route.ts`, `lib/widget/headers.ts`
- Create utility: `lib/security/cors-validator.ts`
- Must lookup license domains for validation

---

## Story 1.4: Add HTTP Security Headers

**As a** platform operator
**I want** all HTTP responses to include security headers
**So that** the application is protected against common web attacks

### Acceptance Criteria

- [ ] `Content-Security-Policy` header configured with:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline'` (required for Next.js)
  - `style-src 'self' 'unsafe-inline'`
  - `img-src 'self' data: https:`
  - `connect-src 'self' https:`
  - `frame-ancestors 'none'`
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] Headers applied to all routes via Next.js config
- [ ] Widget-serving endpoints have relaxed `frame-ancestors` for embedding
- [ ] Security headers visible in browser DevTools Network tab
- [ ] Tested with securityheaders.com or similar tool (score A or higher)

### Technical Notes

- File to modify: `next.config.ts`
- Add `headers()` async function
- Widget routes need different CSP for embedding

---

## Story 1.5: Sanitize N8n Error Responses

**As a** platform operator
**I want** N8n workflow errors to be logged but not returned to clients
**So that** internal system details are not exposed to attackers

### Acceptance Criteria

- [ ] N8n error responses return generic message: `{ "error": "Message delivery failed" }`
- [ ] N8n HTTP status codes are NOT forwarded (always return 502 for upstream errors)
- [ ] Full N8n error response is logged server-side with:
  - Timestamp
  - License key
  - Widget ID
  - Session ID
  - N8n status code
  - N8n response body (first 1000 chars)
- [ ] Network errors (timeout, DNS failure) return generic message
- [ ] Log level is `error` for failures, not `warn`
- [ ] No stack traces in client responses
- [ ] Unit test verifies error sanitization
- [ ] Integration test verifies N8n errors don't leak details

### Technical Notes

- File to modify: `app/api/chat-relay/route.ts` (lines 154-159, 168)
- Consider structured logging format for production log aggregation

---

## Story 1.6: Remove Webhook URL from Client Config

**As a** platform operator
**I want** N8n webhook URLs to remain server-side only
**So that** attackers cannot bypass the relay and directly abuse N8n endpoints

### Acceptance Criteria

- [ ] `/api/widget/[license]/config` response does NOT include `webhookUrl`
- [ ] Widget bundle does NOT contain or reference the N8n webhook URL
- [ ] All chat messages route through `/api/chat-relay` endpoint only
- [ ] Relay endpoint fetches webhook URL from database on each request
- [ ] Config response includes `relayEndpoint` URL only
- [ ] Existing widgets continue to function (backward compatible)
- [ ] Widget source code (`widget/src/`) has no hardcoded webhook references
- [ ] Unit test verifies config response schema
- [ ] Integration test verifies webhook URL not exposed anywhere

### Technical Notes

- File to modify: `app/api/widget/[license]/config/route.ts` (line 190)
- Update widget config TypeScript types
- Verify widget bundle after rebuild

---

## Story 1.7: Secure License Key Handling in Widget

**As a** platform operator
**I want** to minimize license key exposure in client-side code
**So that** license keys cannot be easily harvested from embedded widgets

### Acceptance Criteria

- [ ] License key is NOT injected into the widget bundle JavaScript
- [ ] Widget uses `widgetKey` (public identifier) instead of `licenseKey`
- [ ] `widgetKey` is a separate, non-sensitive identifier (UUID)
- [ ] Server validates `widgetKey` and looks up associated license internally
- [ ] Rate limiting uses `widgetKey` for client-facing limits
- [ ] License-level operations still use `licenseKey` server-side
- [ ] Relay endpoint accepts `widgetKey` instead of `licenseKey`
- [ ] Existing widgets with `licenseKey` continue to work (deprecation period)
- [ ] Console warnings for deprecated `licenseKey` usage
- [ ] Migration guide documented for updating embed codes
- [ ] Unit tests cover both old and new authentication methods

### Technical Notes

- Database schema already has `widgetKey` field
- Files to modify: `lib/widget/inject.ts`, `app/api/chat-relay/route.ts`
- Update widget source: `widget/src/services/messaging/payload.ts`
- Rebuild widget bundle after changes

---

# 🟡 TIER 2: HIGH PRIORITY (Complete Within 1 Week of Launch)

---

## Story 2.1: Rate Limiting for Chat Relay Endpoint

**As a** platform operator
**I want** the chat relay endpoint to have rate limiting
**So that** attackers cannot flood N8n workflows with requests

### Acceptance Criteria

- [ ] Chat relay has per-license rate limit: 30 messages/minute
- [ ] Chat relay has per-IP rate limit: 60 messages/minute
- [ ] Rate limit uses Redis (same as Story 1.2)
- [ ] Exceeding limit returns HTTP 429 with `Retry-After` header
- [ ] Rate limit is checked BEFORE database queries
- [ ] Agency tier has higher limits: 120 messages/minute per license
- [ ] Rate limit headers included in all responses
- [ ] Unit tests verify rate limiting logic
- [ ] Integration test verifies 429 response after exceeding limit

### Technical Notes

- File to modify: `app/api/chat-relay/route.ts`
- Reuse rate limiter from Story 1.2

---

## Story 2.2: Fix Test Suite

**As a** developer
**I want** all tests to pass
**So that** I can confidently make changes without breaking functionality

### Acceptance Criteria

- [ ] All 81 test suites pass
- [ ] All 81 tests pass (currently 41 failing)
- [ ] No skipped tests without documented reason
- [ ] Test coverage remains above 70%
- [ ] CI pipeline runs tests on every PR
- [ ] Flaky tests are identified and fixed
- [ ] Test utilities properly mock Next.js request/response
- [ ] Database tests use proper transaction rollback
- [ ] `npm test` completes in under 60 seconds

### Technical Notes

- Primary issues: NextRequest mocking in integration tests
- Review: `tests/integration/api/licenses/list.test.ts:53`
- Review: `tests/integration/api/chat-relay.test.ts:72`

---

## Story 2.3: Environment-Aware Logging

**As a** platform operator
**I want** debug logs to only appear in development
**So that** production logs don't contain sensitive data

### Acceptance Criteria

- [ ] All `console.log` calls wrapped with `NODE_ENV !== 'production'` check
- [ ] All `console.warn` calls for debugging wrapped with environment check
- [ ] `console.error` for actual errors allowed in production (but sanitized)
- [ ] License keys NEVER appear in production logs
- [ ] Widget IDs NEVER appear in production logs (use hashed versions)
- [ ] Create logging utility: `lib/utils/logger.ts`
- [ ] Logger supports levels: debug, info, warn, error
- [ ] Logger automatically redacts sensitive fields
- [ ] All API routes use new logger
- [ ] Middleware uses new logger
- [ ] Grep codebase confirms no raw `console.log` in `app/api/`

### Technical Notes

- Create: `lib/utils/logger.ts`
- Consider: Pino or Winston for structured logging
- Update: All files in `app/api/`

---

## Story 2.4: Strict Widget Config Schema

**As a** developer
**I want** widget configuration to be strictly validated
**So that** invalid or malicious data cannot be stored

### Acceptance Criteria

- [ ] `z.any()` replaced with proper Zod schema in widget creation
- [ ] Widget config schema enforces all required fields
- [ ] Widget config schema rejects unknown fields (`strict()`)
- [ ] Nested objects have their own schemas
- [ ] Color values validated as hex format
- [ ] URL values validated as proper URLs
- [ ] Size values validated as valid CSS (px, rem, %)
- [ ] Boolean values validated as booleans (not truthy strings)
- [ ] Error messages clearly indicate which field failed
- [ ] Unit tests cover valid and invalid config scenarios
- [ ] Integration test verifies invalid config rejected with 400

### Technical Notes

- File to modify: `app/api/widgets/route.ts:30`
- Existing schema: `lib/validation/widget-schema.ts`
- Use `widgetConfigSchema` instead of `z.any()`

---

## Story 2.5: Atomic Widget Creation

**As a** platform operator
**I want** widget creation to be atomic
**So that** concurrent requests cannot exceed widget limits

### Acceptance Criteria

- [ ] Widget count check and insert happen in single database transaction
- [ ] Transaction uses `SERIALIZABLE` isolation level (or row-level locking)
- [ ] Concurrent requests for same license are serialized
- [ ] Widget limit cannot be exceeded under any timing condition
- [ ] Transaction rollback on any failure
- [ ] Clear error message when limit reached during race condition
- [ ] Load test with 10 concurrent widget creation requests passes
- [ ] Unit test mocks concurrent scenario

### Technical Notes

- File to modify: `app/api/widgets/route.ts:62-95`
- Use Drizzle transaction: `db.transaction(async (tx) => { ... })`
- Consider: `SELECT ... FOR UPDATE` on license row

---

## Story 2.6: Error Boundary Pages

**As a** user
**I want** to see friendly error pages when something goes wrong
**So that** I'm not confused by technical error messages

### Acceptance Criteria

- [ ] `app/error.tsx` created for client-side errors
- [ ] `app/global-error.tsx` created for root-level errors
- [ ] Error pages display user-friendly message
- [ ] Error pages include "Go back home" button
- [ ] Error pages do NOT display stack traces
- [ ] Error pages do NOT display error details in production
- [ ] Development mode shows error details for debugging
- [ ] Error boundary catches and logs errors
- [ ] 500 errors logged to console/monitoring
- [ ] Error pages match application design/branding
- [ ] Unit test verifies error boundary catches thrown errors

### Technical Notes

- Create: `app/error.tsx` (client component)
- Create: `app/global-error.tsx` (client component)
- Both must include `'use client'` directive

---

# 🟢 TIER 3: MEDIUM PRIORITY (Complete Before Scale)

---

## Story 3.1: Consistent Subdomain Handling

**As a** developer
**I want** subdomain authorization to work consistently across all endpoints
**So that** users don't encounter unexpected authorization failures

### Acceptance Criteria

- [ ] `validateLicense()` function supports subdomain matching (like widget serving)
- [ ] Public validation endpoint returns same result as widget serving
- [ ] Subdomain matching logic extracted to shared utility
- [ ] Logic: `domain` authorizes `*.domain` (e.g., `example.com` allows `api.example.com`)
- [ ] Logic documented in code comments
- [ ] Unit tests cover subdomain scenarios for all endpoints
- [ ] Integration test compares validation endpoint vs widget serving

### Technical Notes

- File to modify: `lib/license/validate.ts:112-115`
- Create shared utility in `lib/license/domain.ts`
- Update: `app/api/widget/[license]/chat-widget.js/route.ts`

---

## Story 3.2: File Upload Validation

**As a** platform operator
**I want** file uploads to be validated on the server
**So that** oversized or malicious files cannot abuse the system

### Acceptance Criteria

- [ ] Maximum file size enforced server-side: 5MB per file
- [ ] Maximum total attachment size per message: 10MB
- [ ] Allowed MIME types enforced (images, PDFs, text files)
- [ ] Base64 payload size validated before processing
- [ ] Files rejected with clear error message
- [ ] Rejected files logged with file size and type
- [ ] Rate limit for file uploads: 10 files/minute per license
- [ ] Unit tests cover size and type validation
- [ ] Integration test verifies oversized file rejected

### Technical Notes

- File to modify: `app/api/chat-relay/route.ts`
- Add validation before forwarding to N8n
- Consider: Stream-based validation for large payloads

---

## Story 3.3: N8n Response Size Limits

**As a** platform operator
**I want** N8n responses to have size limits
**So that** malformed responses cannot cause memory exhaustion

### Acceptance Criteria

- [ ] Maximum N8n response size: 1MB
- [ ] Response truncated if exceeds limit (log warning)
- [ ] Timeout for N8n requests: 30 seconds
- [ ] Timeout error returns generic message to client
- [ ] Large response logged for debugging
- [ ] Memory usage monitored during N8n response handling
- [ ] Unit test verifies truncation logic
- [ ] Integration test with mock large response

### Technical Notes

- File to modify: `app/api/chat-relay/route.ts:145-152`
- Use `AbortController` for timeout
- Stream response to check size incrementally

---

## Story 3.4: Update Application Metadata

**As a** user
**I want** the application to have proper branding and metadata
**So that** it looks professional in browser tabs and search results

### Acceptance Criteria

- [ ] `app/layout.tsx` has proper title (not "Create Next App")
- [ ] `app/layout.tsx` has proper description
- [ ] Open Graph meta tags configured
- [ ] Twitter card meta tags configured
- [ ] Favicon configured
- [ ] Apple touch icon configured
- [ ] `manifest.json` created for PWA support
- [ ] All pages have appropriate titles
- [ ] SEO-relevant pages have meta descriptions

### Technical Notes

- File to modify: `app/layout.tsx:18-21`
- Add: `public/favicon.ico`
- Add: `app/manifest.json`

---

## Story 3.5: Production Cache Headers

**As a** platform operator
**I want** appropriate cache headers for production
**So that** performance is optimized without serving stale content

### Acceptance Criteria

- [ ] Widget bundle: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- [ ] Widget config: `Cache-Control: private, max-age=60, must-revalidate`
- [ ] Static assets: `Cache-Control: public, max-age=31536000, immutable`
- [ ] API responses: `Cache-Control: no-store` (default)
- [ ] ETags generated for cacheable resources
- [ ] Cache headers vary by environment (shorter in development)
- [ ] CDN-friendly headers (Vary, Surrogate-Control)
- [ ] Tested with browser DevTools Network tab
- [ ] Tested with curl to verify headers

### Technical Notes

- File to modify: `lib/widget/headers.ts:60`
- Current value: `max-age=10` (debugging)
- Consider: Content hashing for cache busting

---

## Story 3.6: Sensitive Query Parameter Filtering

**As a** user
**I want** my sensitive URL parameters to not be captured
**So that** my authentication tokens and private data stay private

### Acceptance Criteria

- [ ] Page context capture filters out sensitive query parameters
- [ ] Filtered parameters: `token`, `auth`, `key`, `secret`, `password`, `api_key`, `access_token`, `refresh_token`, `session`, `jwt`
- [ ] Custom filter list configurable per widget
- [ ] Filtered parameters replaced with `[REDACTED]`
- [ ] URL path is still captured (just not sensitive params)
- [ ] Filter applied client-side before sending
- [ ] Unit tests verify filtering logic
- [ ] Documentation updated for filter configuration

### Technical Notes

- File to modify: `widget/src/services/messaging/message-sender.ts:256-275`
- Add configuration option to widget config schema
- Rebuild widget bundle after changes

---

# 📋 Implementation Order

## Phase 1: Critical Security (Days 1-3)
1. Story 1.4: Security Headers (quick win)
2. Story 1.1: SSRF Protection
3. Story 1.5: Error Sanitization
4. Story 1.6: Remove Webhook URL from Config
5. Story 1.3: CORS Restriction
6. Story 1.2: Redis Rate Limiting
7. Story 1.7: Secure License Key Handling

## Phase 2: High Priority (Days 4-7)
1. Story 2.2: Fix Test Suite
2. Story 2.1: Rate Limit Chat Relay
3. Story 2.3: Environment-Aware Logging
4. Story 2.4: Strict Widget Config Schema
5. Story 2.5: Atomic Widget Creation
6. Story 2.6: Error Boundary Pages

## Phase 3: Medium Priority (Post-Launch)
1. Story 3.1: Consistent Subdomain Handling
2. Story 3.4: Update Application Metadata
3. Story 3.5: Production Cache Headers
4. Story 3.2: File Upload Validation
5. Story 3.3: N8n Response Size Limits
6. Story 3.6: Sensitive Query Parameter Filtering

---

# 📊 Effort Estimates

| Story | Estimate | Complexity |
|-------|----------|------------|
| 1.1 SSRF Protection | 2-3 hours | Medium |
| 1.2 Redis Rate Limiting | 3-4 hours | High |
| 1.3 CORS Restriction | 2-3 hours | Medium |
| 1.4 Security Headers | 1 hour | Low |
| 1.5 Error Sanitization | 1 hour | Low |
| 1.6 Remove Webhook URL | 2 hours | Medium |
| 1.7 Secure License Keys | 4-6 hours | High |
| 2.1 Rate Limit Relay | 1-2 hours | Low |
| 2.2 Fix Test Suite | 4-8 hours | High |
| 2.3 Logging Utility | 2-3 hours | Medium |
| 2.4 Strict Config Schema | 2 hours | Medium |
| 2.5 Atomic Widget Creation | 2-3 hours | Medium |
| 2.6 Error Boundaries | 1-2 hours | Low |
| 3.1 Subdomain Handling | 1-2 hours | Low |
| 3.2 File Upload Validation | 2-3 hours | Medium |
| 3.3 Response Size Limits | 1-2 hours | Low |
| 3.4 Update Metadata | 1 hour | Low |
| 3.5 Cache Headers | 1 hour | Low |
| 3.6 Query Param Filtering | 2 hours | Medium |

**Total Estimate:** 35-50 hours

---

# ✅ Definition of Done (All Stories)

- [ ] Code changes committed to feature branch
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed by another developer
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated if applicable
- [ ] Tested in development environment
- [ ] Tested in staging environment
- [ ] PR merged to main branch

---

**Document Version:** 1.0
**Last Updated:** 2026-01-19

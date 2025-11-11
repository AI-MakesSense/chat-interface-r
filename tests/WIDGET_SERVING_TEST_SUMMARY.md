# Widget Serving Endpoint - RED Phase Test Summary

**Status:** RED PHASE (All tests failing - ready for implementation)
**Date Created:** 2025-11-11
**Total Tests:** 306
**Implementation Guide:** [Follow PLAN.md Phase 3.6 for implementation](../PLAN.md#week-6-widget-serving)

---

## Test Files Created

### Step 1: Core Utilities

#### File 1: `tests/unit/widget/headers.test.ts`
**Purpose:** Domain extraction and response header creation
**Tests:** 36

Covers:
- `extractDomainFromReferer(referer: string): string | null`
  - Extract domain from https/http URLs
  - Remove www prefix normalization
  - Handle port numbers, subdomains, localhost, IP addresses
  - Handle query params, hash, uppercase normalization
  - Error cases: invalid URL, empty string, malformed URLs
  - Edge cases: hyphens, numbers, international domains, long paths

- `createResponseHeaders(): Record<string, string>`
  - Set content-type to application/javascript
  - Set cache-control header for browser/CDN caching
  - Set CORS header to allow all origins
  - Consistent headers across calls
  - Proper formatting without extra whitespace

**Key Test Structure:**
```
- Happy Path - Valid URLs (11 tests)
- Error Cases - Invalid Input (6 tests)
- Edge Cases (6 tests)
- Content Type Header (2 tests)
- Cache Control Header (3 tests)
- CORS Header (2 tests)
- Return Type (3 tests)
- Header Format (2 tests)
```

**Error Types Expected:** Module not found (implementation needed)

---

#### File 2: `tests/unit/widget/error.test.ts`
**Purpose:** Error script generation and logging
**Tests:** 48

Covers:
- `createErrorScript(errorType: ErrorType): string`
  - Support 6 error types: LICENSE_INVALID, LICENSE_EXPIRED, DOMAIN_UNAUTHORIZED, LICENSE_CANCELLED, REFERER_MISSING, INTERNAL_ERROR
  - Generate valid executable JavaScript for each type
  - Set window error flags
  - Log to console.error
  - Prevent sensitive data exposure
  - Validation that script is executable

- `logWidgetError(errorType, context): void`
  - Log error with context (domain, licenseKey, IP, etc.)
  - Include timestamp in logs
  - Handle empty/undefined context
  - Support all 6 error types
  - Void function (no return value)
  - Secure logging without exposing secrets

**Key Test Structure:**
```
createErrorScript:
- Error Type: LICENSE_INVALID (4 tests)
- Error Type: LICENSE_EXPIRED (3 tests)
- Error Type: DOMAIN_UNAUTHORIZED (3 tests)
- Error Type: LICENSE_CANCELLED (3 tests)
- Error Type: REFERER_MISSING (3 tests)
- Error Type: INTERNAL_ERROR (3 tests)
- Console Logging (3 tests)
- Security (2 tests)
- Return Type (3 tests)
- All Error Types Coverage (6 tests)

logWidgetError:
- Basic Logging (5 tests)
- Timestamp Handling (2 tests)
- Context Handling (4 tests)
- Error Types (6 tests)
- Return Value (2 tests)
- Security (1 test)
```

**Error Types Expected:** Module not found (implementation needed)

---

### Step 2: Flag Injection Logic

#### File 3: `tests/unit/widget/inject.test.ts`
**Purpose:** License flag creation and bundle injection
**Tests:** 40

Covers:
- `createFlagsJSON(license: SelectLicense): string`
  - Create valid JSON for basic/pro/agency tiers
  - Include tier, brandingEnabled, domainLimit in flags
  - Handle branding enabled/disabled variations
  - Return valid parseable JSON

- `injectLicenseFlags(bundleContent: string, license: SelectLicense): string`
  - Inject flags into bundle with markers (happy path)
  - Preserve bundle content outside markers
  - Replace placeholder with real flags
  - Handle minified and formatted bundles
  - Throw error for missing/incomplete markers
  - Handle empty bundle content between markers
  - Inject different flags per license tier
  - Support branding variations
  - Validate injected flags are valid JavaScript
  - Match license data in output

**Key Test Structure:**
```
createFlagsJSON:
- Basic Tier (4 tests)
- Pro Tier (3 tests)
- Agency Tier (3 tests)
- Branding Flag Variations (2 tests)
- Return Type (2 tests)

injectLicenseFlags:
- Happy Path - Successful Injection (4 tests)
- Different License Tiers (4 tests)
- Branding Variations (2 tests)
- Minified Bundle Handling (2 tests)
- Error Cases - Missing Markers (4 tests)
- Empty/Minimal Bundle Handling (2 tests)
- Injected Flags Validation (3 tests)
- Return Type and Structure (3 tests)
- Edge Cases (2 tests)
```

**Error Types Expected:** Module not found (implementation needed)

---

### Step 3: Rate Limiting

#### File 4: `tests/unit/widget/rate-limit.test.ts`
**Purpose:** IP and license-based rate limiting
**Tests:** 97

Covers:
- `checkRateLimit(identifier: string, type: 'ip' | 'license'): { allowed: boolean, retryAfter?: number }`
  - IP rate limiting: 10 requests/second
  - License rate limiting: 100 requests/minute
  - Return retry-after for blocked requests
  - Reset limits after time windows
  - Independent IP and license tracking
  - Support multiple IPs and licenses
  - Boundary testing (10/100 exactly)
  - Return proper object structure with optional retryAfter

- `resetRateLimiter(): void`
  - Clear all rate limit data
  - Void function (no return value)
  - Allow fresh tracking after reset
  - Handle multiple sequential resets

**Key Test Structure:**
```
checkRateLimit:
- IP Rate Limiting (10/sec) (7 tests)
- License Rate Limiting (100/min) (7 tests)
- IP vs License Independence (2 tests)
- Return Type (3 tests)
- Time Window Management (2 tests)
- Edge Cases (5 tests)
- Reset Behavior (3 tests)

resetRateLimiter:
- Cache Clearing (4 tests)
- Interaction with checkRateLimit (2 tests)
- State Management (1 test)
```

**Note:** Uses `vi.useFakeTimers()` for deterministic testing

**Error Types Expected:** Module not found (implementation needed)

---

### Step 4: Bundle Serving Logic

#### File 5: `tests/unit/widget/serve.test.ts`
**Purpose:** Bundle caching and serving with flag injection
**Tests:** 34

Covers:
- `serveWidgetBundle(license: SelectLicense): Promise<string>`
  - Return bundle with injected flags (happy path)
  - Cache bundle across requests
  - Inject different flags per license
  - Return valid JavaScript
  - Support all license tiers (basic/pro/agency)
  - Handle branding enabled/disabled
  - Reasonable bundle size (>1KB, <100KB)
  - Support multiple licenses with correct flags

- `clearBundleCache(): void`
  - Clear cached bundle
  - Force re-read on next request
  - Void function (no return value)
  - Allow consecutive clears
  - Handle multiple clears

**Key Test Structure:**
```
serveWidgetBundle:
- Happy Path - Bundle Serving (3 tests)
- Caching Behavior (3 tests)
- Different Licenses (4 tests)
- Branding Handling (3 tests)
- Cache Invalidation (2 tests)
- Error Handling (2 tests)
- Return Type (3 tests)
- Async Behavior (3 tests)
- Performance (2 tests)
- Multiple License Support (1 test)

clearBundleCache:
- Cache Clearing (4 tests)
- Interaction with serveWidgetBundle (2 tests)
- State Management (1 test)
```

**Error Types Expected:** Module not found (implementation needed)

---

### Step 5: API Route Handler (Integration)

#### File 6: `tests/integration/widget/serve-endpoint.test.ts`
**Purpose:** Complete widget serving endpoint integration
**Tests:** 51

Covers:
- `GET /api/widget/[license]/chat-widget.js`
  - Happy path: Valid license & domain returns widget (6 tests)
  - Status codes: 200, 403, 404, 429 (4 tests)
  - Response headers: content-type, cache-control, CORS, X-License-Tier (4 tests)
  - License flag injection (1 test)
  - Referer validation: required, authorized, unauthorized, localhost, www, port, subdomains (7 tests)
  - License validation: invalid key, expired, cancelled, check existence, status, expiration (6 tests)
  - Rate limiting: IP-based, license-based, blocking, retry-after (5 tests)
  - Error handling: return valid JS, handle DB errors, security errors (3 tests)
  - Security: path traversal, SQL injection, XSS prevention, header validation, secrets safety, HTTPS (6 tests)
  - Response body: valid JavaScript, license flags, executability (3 tests)
  - Edge cases: long keys, special characters, multiple domains, empty domains (4 tests)

**Key Test Structure:**
```
- Happy Path - Valid License and Domain (6 tests)
- Referer Header Validation (8 tests)
- License Validation (7 tests)
- Rate Limiting (6 tests)
- Error Handling (5 tests)
- Security (6 tests)
- Headers and Response Format (4 tests)
- Edge Cases (4 tests)
- Response Body (3 tests)
```

**Note:** Uses mocked database and rate limit functions for isolation

**Error Types Expected:** Module imports fail (db, rate-limit mocked)

---

## Test Statistics Summary

| File | Tests | Type | Status |
|------|-------|------|--------|
| headers.test.ts | 36 | Unit | RED |
| error.test.ts | 48 | Unit | RED |
| inject.test.ts | 40 | Unit | RED |
| rate-limit.test.ts | 97 | Unit | RED |
| serve.test.ts | 34 | Unit | RED |
| serve-endpoint.test.ts | 51 | Integration | RED |
| **TOTAL** | **306** | Mixed | **RED** |

---

## RED Phase Status

All 306 tests are **FAILING** as expected for the RED phase:

```
FAIL tests/unit/widget/headers.test.ts
FAIL tests/unit/widget/error.test.ts
FAIL tests/unit/widget/inject.test.ts
FAIL tests/unit/widget/rate-limit.test.ts
FAIL tests/unit/widget/serve.test.ts
FAIL tests/integration/widget/serve-endpoint.test.ts
```

**Reason:** All tests import from modules that don't exist yet:
- `@/lib/widget/headers` (extractDomainFromReferer, createResponseHeaders)
- `@/lib/widget/error` (createErrorScript, logWidgetError)
- `@/lib/widget/inject` (createFlagsJSON, injectLicenseFlags)
- `@/lib/widget/rate-limit` (checkRateLimit, resetRateLimiter)
- `@/lib/widget/serve` (serveWidgetBundle, clearBundleCache)
- `GET /api/widget/[license]/chat-widget.js` route handler

---

## Test Quality Characteristics

### Test Organization
- Black-box behavior testing (not testing internals)
- Clear naming: `test_<behavior>_<condition>_<expected>`
- Organized by test suites describing related behaviors
- Setup/teardown where needed (beforeEach, afterEach)
- Mock boundary functions (DB, rate-limit, etc.)

### Coverage Approach
- Unit tests focus on single functions in isolation
- Integration tests validate complete flow
- Error paths explicitly tested
- Edge cases systematically covered
- Security considerations integrated throughout

### Determinism Strategy
- Fake timers used for rate-limiting tests (vi.useFakeTimers)
- Mock database and external dependencies
- No random data generation
- Fixed test data via helper functions
- Tests run in any order (no ordering dependencies)

### Guardrails
- No coupling to private internals
- No real network/filesystem/DB in unit tests
- Fast execution (no real I/O)
- Meaningful assertions (not just existence checks)
- Minimal mocks (only at boundaries)

---

## Implementation Notes for GREEN Phase

### Required Modules to Create

1. **lib/widget/headers.ts** (36 tests depending)
   - Export: `extractDomainFromReferer(referer: string): string | null`
   - Export: `createResponseHeaders(): Record<string, string>`

2. **lib/widget/error.ts** (48 tests depending)
   - Export: `type ErrorType` enum (6 types)
   - Export: `createErrorScript(errorType: ErrorType): string`
   - Export: `logWidgetError(errorType: ErrorType, context: any): void`

3. **lib/widget/inject.ts** (40 tests depending)
   - Export: `createFlagsJSON(license: SelectLicense): string`
   - Export: `injectLicenseFlags(bundle: string, license: SelectLicense): string`

4. **lib/widget/rate-limit.ts** (97 tests depending)
   - Export: `checkRateLimit(identifier: string, type: 'ip' | 'license'): { allowed: boolean, retryAfter?: number }`
   - Export: `resetRateLimiter(): void`

5. **lib/widget/serve.ts** (34 tests depending)
   - Export: `serveWidgetBundle(license: SelectLicense): Promise<string>`
   - Export: `clearBundleCache(): void`

6. **app/api/widget/[license]/chat-widget.js/route.ts** (51 tests depending)
   - Export: `GET(request: NextRequest, params): Promise<Response>`

### Test Execution (RED Phase Verification)

Run all widget tests:
```bash
npm test -- tests/unit/widget tests/integration/widget --run
```

Expected result: All tests fail with module import errors

---

## Next Steps: GREEN Phase

After creating the implementation modules, tests will pass through the following order:

1. ✅ Step 1: headers.test.ts (36 tests)
2. ✅ Step 2: error.test.ts (48 tests)
3. ✅ Step 3: inject.test.ts (40 tests)
4. ✅ Step 4: rate-limit.test.ts (97 tests)
5. ✅ Step 5: serve.test.ts (34 tests)
6. ✅ Step 6: serve-endpoint.test.ts (51 tests)

Follow PLAN.md Phase 3.6 implementation sequence for optimal development workflow.

---

**Created by:** TDD/QA Lead Agent
**For:** Widget Serving Endpoint Implementation
**Phase:** RED (Failing Tests Ready for Implementation)

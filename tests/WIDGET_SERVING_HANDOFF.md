# Widget Serving Endpoint - RED Phase Handoff

**From:** TDD/QA Lead Agent
**To:** Implementer Agent
**Status:** RED PHASE COMPLETE - Ready for GREEN Phase
**Total Failing Tests:** 306
**Date:** 2025-11-11

---

## Summary

I have written **306 comprehensive RED phase tests** for the Widget Serving Endpoint feature (Phase 3.6). All tests are currently failing as expected, because the implementation modules don't exist yet.

The tests are organized in **6 files across 2 test levels** (unit and integration) following TDD best practices:

- **Unit Tests (4 files, 255 tests):** Core utilities and business logic
- **Integration Tests (1 file, 51 tests):** Complete endpoint flow
- **Test Document:** `tests/WIDGET_SERVING_TEST_SUMMARY.md` (for reference)

---

## What the Tests Cover

### Step 1: Core Utilities (Headers & Error Scripts)
- **headers.test.ts (36 tests):** Domain extraction and response header generation
- **error.test.ts (48 tests):** Error script generation and logging

### Step 2: Flag Injection (84 tests)
- **inject.test.ts (40 tests):** License flag creation and bundle injection

### Step 3: Rate Limiting (97 tests)
- **rate-limit.test.ts (97 tests):** IP-based (10/sec) and license-based (100/min) rate limiting

### Step 4: Bundle Serving (34 tests)
- **serve.test.ts (34 tests):** Bundle caching, serving, and cache invalidation

### Step 5: API Endpoint (51 tests)
- **serve-endpoint.test.ts (51 tests):** Complete `/api/widget/[license]/chat-widget.js` endpoint

---

## Key Features of These Tests

### Test Quality
✅ Clear, descriptive test names (behavior-driven)
✅ Organized by feature/scenario (describe blocks)
✅ Setup/teardown for state management
✅ Mock only at boundaries (DB, external services)
✅ Deterministic (uses fake timers for rate-limiting)
✅ Fast execution (no real I/O or network)
✅ Black-box testing (not testing internals)

### Coverage
✅ Happy paths (valid requests)
✅ Error paths (invalid inputs, missing data)
✅ Edge cases (special characters, boundary values)
✅ Security considerations (path traversal, SQL injection, XSS)
✅ Performance requirements (bundle size, caching)
✅ All 6 license error types
✅ All 3 license tiers (basic, pro, agency)

### Implementation Order
Tests are designed to pass in the order they're implemented:

1. `lib/widget/headers.ts` (affects 36 tests)
2. `lib/widget/error.ts` (affects 48 tests)
3. `lib/widget/inject.ts` (affects 40 tests)
4. `lib/widget/rate-limit.ts` (affects 97 tests)
5. `lib/widget/serve.ts` (affects 34 tests)
6. `app/api/widget/[license]/chat-widget.js/route.ts` (affects 51 tests)

---

## Implementation Guide

### For Each Module, You Should:

1. **Create the module file** at the specified location
2. **Export the required functions** with correct signatures
3. **Implement minimum logic** to pass the failing test(s)
4. **Use TDD workflow:** Write one function → Pass tests → Refactor
5. **Follow the test expectations** exactly (return types, behavior, etc.)

### Key Implementation References

#### Architecture Requirements (from Architecture.md)
- Domain validation logic with www/port normalization
- License flags injection into widget bundle
- Rate limiting: 10 req/sec per IP, 100 req/min per license
- Cache strategy: public, max-age=3600, s-maxage=86400
- CORS header: Access-Control-Allow-Origin: *

#### Database Schema (from PLAN.md)
- licenses table: id, licenseKey, tier, domains[], status, expiresAt
- domains array for multi-domain support
- tier: 'basic' | 'pro' | 'agency'
- status: 'active' | 'expired' | 'cancelled'

#### Error Types (from tests)
1. LICENSE_INVALID
2. LICENSE_EXPIRED
3. DOMAIN_UNAUTHORIZED
4. LICENSE_CANCELLED
5. REFERER_MISSING
6. INTERNAL_ERROR

---

## Running the Tests

### View All Failing Tests
```bash
npm test -- tests/unit/widget tests/integration/widget --run
```

### Run Single Test File (After Implementation)
```bash
npm test -- tests/unit/widget/headers.test.ts --run
npm test -- tests/unit/widget/error.test.ts --run
npm test -- tests/unit/widget/inject.test.ts --run
npm test -- tests/unit/widget/rate-limit.test.ts --run
npm test -- tests/unit/widget/serve.test.ts --run
npm test -- tests/integration/widget/serve-endpoint.test.ts --run
```

### Watch Mode (During Development)
```bash
npm test -- tests/unit/widget/headers.test.ts
```

### Check Test Coverage
```bash
npm test -- tests/unit/widget --coverage
```

---

## Expected Behavior During Implementation

### Stage 1: Before Implementation
```
FAIL tests/unit/widget/headers.test.ts
  Error: Failed to resolve import "@/lib/widget/headers"
  [36 tests not collected]
```

### Stage 2: After lib/widget/headers.ts Created
```
PASS tests/unit/widget/headers.test.ts [36 passing]
FAIL tests/unit/widget/error.test.ts
  Error: Failed to resolve import "@/lib/widget/error"
  [48 tests not collected]
```

### Stage 3: All Modules Implemented
```
PASS tests/unit/widget/headers.test.ts [36 passing]
PASS tests/unit/widget/error.test.ts [48 passing]
PASS tests/unit/widget/inject.test.ts [40 passing]
PASS tests/unit/widget/rate-limit.test.ts [97 passing]
PASS tests/unit/widget/serve.test.ts [34 passing]
PASS tests/integration/widget/serve-endpoint.test.ts [51 passing]

Test Files: 6 passed (6)
Tests: 306 passed (306)
```

---

## Common Patterns in Tests

### Mock Functions
```typescript
// Database mocks (example)
vi.mock('@/lib/db/queries', () => ({
  getLicenseByKey: vi.fn(),
}));

// Mock return value
vi.mocked(licenseQueries.getLicenseByKey).mockResolvedValue(license);

// Verify call
expect(licenseQueries.getLicenseByKey).toHaveBeenCalled();
```

### Fake Timers (for rate-limiting)
```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Advance time
vi.advanceTimersByTime(1000);
```

### Test Data Factories
```typescript
const createMockLicense = (overrides?: Partial<MockLicense>): MockLicense => ({
  id: 'lic-1',
  tier: 'basic',
  brandingEnabled: true,
  domains: ['example.com'],
  ...overrides
});
```

---

## Constraints & Guardrails

### Must Do
✅ Implement exactly what tests expect
✅ Keep functions focused (single responsibility)
✅ Return correct types (string, object, boolean, Promise, void)
✅ Handle all error cases shown in tests
✅ Use provided schemas (Drizzle ORM for DB)
✅ Support all error types and license tiers

### Must NOT Do
❌ Add unrelated features (only implement what tests require)
❌ Hard-code test data (implement logic properly)
❌ Expose sensitive data in errors
❌ Skip error handling
❌ Violate TypeScript strict mode
❌ Mix concerns in single module

---

## File Locations to Create

```
lib/
├── widget/
│   ├── headers.ts          [Extract domain, create response headers]
│   ├── error.ts            [Generate error scripts, log errors]
│   ├── inject.ts           [Create flags JSON, inject into bundle]
│   ├── rate-limit.ts       [Check and track rate limits]
│   └── serve.ts            [Serve bundle with caching]
└── ... (existing files)

app/api/widget/[license]/
└── chat-widget.js/
    └── route.ts            [GET endpoint handler]
```

---

## Test Files Reference

| Test File | Tests | Functions Under Test |
|-----------|-------|----------------------|
| headers.test.ts | 36 | extractDomainFromReferer, createResponseHeaders |
| error.test.ts | 48 | createErrorScript, logWidgetError |
| inject.test.ts | 40 | createFlagsJSON, injectLicenseFlags |
| rate-limit.test.ts | 97 | checkRateLimit, resetRateLimiter |
| serve.test.ts | 34 | serveWidgetBundle, clearBundleCache |
| serve-endpoint.test.ts | 51 | GET /api/widget/[license]/chat-widget.js |

---

## Success Criteria

### For GREEN Phase
- [ ] All 306 tests pass
- [ ] No hard-coded test values in implementation
- [ ] All error types return valid JavaScript
- [ ] Rate limits work correctly (10/sec IP, 100/min license)
- [ ] Cache strategy implemented
- [ ] Domain validation with normalization
- [ ] All license tiers supported

### For REFACTOR Phase (After GREEN)
- Remove test duplication if found
- Improve performance if needed
- Optimize cache strategy
- Add inline documentation
- Ensure code style consistency

---

## Questions for Implementer

Before starting, clarify with Architect:

1. Should rate-limiting state persist across requests (memory) or use Redis?
2. Should bundle be cached on disk or in-memory?
3. What widget bundle file location? (`public/widget/chat-widget.js`)
4. Should localhost always bypass domain validation?
5. Should expired licenses return error or serve with flags?
6. Error scripts format (minimize, comments, etc.)?

---

## Handoff Complete

✅ 306 RED tests written and failing
✅ Test summary documentation created
✅ Implementation guide provided
✅ Ready for GREEN phase implementation

**Next Step:** Implement modules in order shown above, following TDD: implement → pass tests → refactor

---

**For Questions:** Refer to PLAN.md Phase 3.6 (Widget Serving Endpoint) and Architecture.md sections 10.2-10.3


# Widget Serving Integration Tests - Architect/Planner Output

**Date**: November 10, 2025
**Phase**: Phase 3 - Widget Serving API
**Endpoint**: `GET /api/widget/[license]/chat-widget.js`
**Context**: Backend-first TDD approach, minimal essential tests (8-12 max)

---

## Executive Summary

This plan defines **10 essential integration tests** for the widget serving endpoint that validates licenses, checks domain authorization, and serves the compiled widget JavaScript bundle with injected license flags.

**Status**: Tests already written but endpoint implementation needed (RED phase)
**Test File**: `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\integration\api\widget-serving.test.ts`
**Route File**: `C:\Projects\Chat Interfacer\n8n-widget-designer\app\api\widget\[license]\chat-widget.js\route.ts` (152 lines, implemented)

---

## Problem Statement

The widget serving endpoint is the **critical delivery mechanism** for the entire platform. It must:

1. **Validate license status** (active, not expired, not cancelled)
2. **Authorize domains** (referer must be in license.domains list)
3. **Inject license flags** (brandingEnabled based on tier)
4. **Serve widget JavaScript** (IIFE format with proper content-type)
5. **Support Next.js 16** (async params API)

**Critical Path**: This is the **last step** before widgets can be embedded on customer websites.

---

## Analysis of Existing Implementation

### Current Route Implementation (152 lines)

**File**: `app/api/widget/[license]/chat-widget.js/route.ts`

**What It Does**:
1. Accepts license key as URL parameter (Next.js 16 async params)
2. Requires referer header for domain extraction
3. Validates license via `getLicenseByKey()`
4. Checks license status ('active' only)
5. Checks license expiration (expiresAt < now)
6. Normalizes domains (lowercase, remove www, strip port)
7. Validates request domain against license.domains
8. Generates widget code with `generateWidgetCode(brandingEnabled)`
9. Returns JavaScript with `Content-Type: application/javascript`
10. Caches for 1 hour (`Cache-Control: public, max-age=3600`)

**Helper Functions**:
- `normalizeDomain(url)` - Domain normalization logic
- `generateWidgetCode(brandingEnabled)` - Reads IIFE file, injects license config

**Widget Bundle**:
- Located at: `public/widget/chat-widget.iife.js`
- Compiled by Vite from `widget/src/index.ts`
- IIFE format: `(function() { ... })()`
- Reads `window.ChatWidgetConfig` and `window.ChatWidgetConfig.license`

### Existing Test Coverage (10 tests)

**File**: `tests/integration/api/widget-serving.test.ts` (395 lines)

**Test Data Setup**:
- Test user: `widgetserve@test.com`
- Active Pro license (white-label, 2 domains: example.com, test.example.com)
- Expired Pro license (30 days expired)
- Cancelled Basic license
- Basic tier license (with branding)
- Pro tier license (white-label)

**Tests Written** (all RED phase - route exists but may need fixes):
1. ✅ Valid license + valid domain → 200 + JavaScript IIFE
2. ✅ Invalid license key → 404 + error message
3. ✅ Expired license → 403 + "expired" error
4. ✅ Cancelled license → 403 + "not active" error
5. ✅ Domain mismatch → 403 + "domain" error
6. ✅ Missing referer header → 403 + "Referer" error
7. ✅ HTTP localhost allowed → 200 (development exception)
8. ✅ Basic tier → brandingEnabled=true injected
9. ✅ Pro tier → brandingEnabled=false injected
10. ✅ IIFE structure + config injection point verified

---

## Test Strategy

### Why These 10 Tests Are Essential

**Success Path (1 test)**:
- Test 1: Happy path with valid license + valid domain
  - **Why**: Verifies entire flow works end-to-end
  - **Validates**: License lookup, domain check, widget serving, JavaScript response

**Authentication/Authorization Failures (5 tests)**:
- Test 2: Non-existent license key
  - **Why**: Prevents serving widgets for invalid licenses
  - **Validates**: 404 response, clear error message
- Test 3: Expired license
  - **Why**: Critical business rule - don't serve expired licenses
  - **Validates**: Expiration date check, 403 response
- Test 4: Cancelled license
  - **Why**: Prevent serving cancelled subscriptions
  - **Validates**: Status check, 403 response
- Test 5: Domain mismatch
  - **Why**: Core security - prevent license key theft/sharing
  - **Validates**: Domain validation logic, 403 response
- Test 6: Missing referer header
  - **Why**: Domain validation impossible without referer
  - **Validates**: Required header check, 403 response

**Edge Cases (1 test)**:
- Test 7: HTTP localhost allowed
  - **Why**: Enable local development (HTTPS not available)
  - **Validates**: Localhost exception handling

**Business Logic (2 tests)**:
- Test 8: Basic tier branding injection
  - **Why**: Verify Basic tier shows "Powered by" branding
  - **Validates**: License flag injection, tier differentiation
- Test 9: Pro tier white-label
  - **Why**: Verify Pro tier hides branding (paid feature)
  - **Validates**: White-label flag injection

**Technical Validation (1 test)**:
- Test 10: IIFE structure validation
  - **Why**: Ensure widget JavaScript is valid and executable
  - **Validates**: IIFE pattern, config injection point, bundle integrity

### What's NOT Tested (Intentional Exclusions)

**Excluded (redundant or low-value)**:
- ❌ Multiple domain variations (www, case, port) for same license
  - **Why**: Domain normalization has dedicated unit tests in `tests/unit/license/domain.test.ts`
- ❌ Widget bundle file not found
  - **Why**: Build-time issue, not runtime validation concern
- ❌ Cache-Control header validation
  - **Why**: Non-critical, easily verified manually
- ❌ CORS headers
  - **Why**: Phase 5 concern, not MVP blocker
- ❌ Rate limiting
  - **Why**: Phase 5 concern, not MVP blocker
- ❌ Widget code size validation
  - **Why**: Build-time concern, bundle analyzer handles this
- ❌ Malformed license key format
  - **Why**: Caught by database lookup failure (Test 2)
- ❌ SQL injection attempts
  - **Why**: Drizzle ORM prevents SQL injection by design

---

## Implementation Approach

### Test Structure (Already Implemented)

**Test File**: `tests/integration/api/widget-serving.test.ts`

**Setup**:
```typescript
beforeAll(async () => {
  // Clean existing test data
  // Create test user
  // Create 5 test licenses (active, expired, cancelled, basic, pro)
});

afterAll(async () => {
  // Clean up test data (widgets, licenses, users)
});
```

**Test Pattern**:
```typescript
it('should [behavior] for [condition]', async () => {
  // 1. Create Request with headers
  const request = new Request(url, {
    method: 'GET',
    headers: { 'Referer': 'https://example.com/' }
  });

  // 2. Call route handler with async params
  const response = await GET(request, { params: { license: key } });

  // 3. Assert response status
  expect(response.status).toBe(200);

  // 4. Assert response content
  const widgetCode = await response.text();
  expect(widgetCode).toContain('(function()');
});
```

### Dependencies

**Database Queries** (already exist):
- `getLicenseByKey(licenseKey)` - from `lib/db/queries.ts`

**Validation Logic** (already implemented):
- `normalizeDomain(url)` - in route file (inline)

**Widget Bundle**:
- `public/widget/chat-widget.iife.js` - compiled by Vite
- Generated by: `cd widget && npm run build && npm run copy`

**Test Database**:
- Uses existing test database setup from `tests/setup.ts`
- Test data isolated per test suite

---

## Success Criteria

### Test Execution
- ✅ All 10 tests must pass
- ✅ No flaky tests (deterministic results)
- ✅ Total execution time < 5 seconds
- ✅ No database leaks (cleanup in afterAll)

### Code Quality
- ✅ Route file stays under 200 lines (currently 152 lines)
- ✅ No `any` types without justification
- ✅ All errors return JSON with `{ error: string }`
- ✅ Status codes follow REST conventions (200, 403, 404, 500)

### Security
- ✅ Referer header required (prevents direct access)
- ✅ License validation before serving widget
- ✅ Domain normalization prevents bypass attempts
- ✅ No sensitive data exposed in responses

### Performance
- ✅ File read cached (Node.js `require` caches by default)
- ✅ Single database query per request
- ✅ Response time < 100ms (p95)

---

## TDD Workflow

### Current State: Tests Already Written (RED Phase)

**Status**: The test file exists with 10 tests, but they are currently RED (failing or need verification).

**What TDD-QA-Lead Needs to Do**:

1. **Verify Tests Run**: Confirm all 10 tests execute (may be failing)
2. **Check Test Quality**: Ensure tests follow TDD principles (behavior-driven, clear assertions)
3. **Document Failures**: List which tests fail and why
4. **Identify Gaps**: Check if any critical scenarios are missing

**What Implementer Needs to Do**:

1. **Review Route Implementation**: Ensure `GET` handler matches test expectations
2. **Fix Failing Tests**: Make minimal changes to pass each test
3. **Verify Widget Bundle**: Ensure `chat-widget.iife.js` exists and is valid IIFE
4. **Run Tests**: Execute `npm test tests/integration/api/widget-serving.test.ts`

### Expected Flow

```
RED (Current) → GREEN (Next) → REFACTOR (Later)
```

**RED Phase (Now)**:
- Tests written, endpoint implemented
- Some tests may be failing
- Need to identify failures and root causes

**GREEN Phase (Next)**:
- Fix implementation to pass all tests
- No refactoring, just make tests pass
- Minimal code changes

**REFACTOR Phase (Later)**:
- Extract helper functions if needed
- Improve error messages
- Add caching optimizations
- Keep tests green throughout

---

## Test Data Requirements

### Database State (Already Created in beforeAll)

**User**:
- Email: `widgetserve@test.com`
- Name: Widget Serve Tester
- Email Verified: true

**Licenses** (5 total):

1. **activeLicense** (Pro tier, white-label):
   - Domains: `['example.com', 'test.example.com']`
   - Status: 'active'
   - Expires: 1 year from now
   - Branding: false

2. **expiredLicense** (Pro tier):
   - Domains: `['expired.com']`
   - Status: 'active' (but expires at < now)
   - Expires: 30 days ago
   - Branding: false

3. **cancelledLicense** (Basic tier):
   - Domains: `['cancelled.com']`
   - Status: 'cancelled'
   - Expires: 1 year from now
   - Branding: true

4. **basicLicense** (Basic tier, with branding):
   - Domains: `['basic.example.com']`
   - Status: 'active'
   - Expires: 1 year from now
   - Branding: true

5. **proLicense** (Pro tier, white-label):
   - Domains: `['pro.example.com']`
   - Status: 'active'
   - Expires: 1 year from now
   - Branding: false

### Widget Bundle

**Location**: `C:\Projects\Chat Interfacer\n8n-widget-designer\public\widget\chat-widget.iife.js`

**Expected Format**:
```javascript
(function() {
  // Widget code here
  var config = window.ChatWidgetConfig || {};
  var license = config.license || {};
  // ... more widget logic ...
})();
```

**How to Build**:
```bash
cd widget
npm run build   # Compiles src/index.ts → dist/chat-widget.iife.js
npm run copy    # Copies to ../public/widget/
```

---

## Risk Assessment

### Risk 1: Widget Bundle Missing
**Impact**: All tests fail with file read error
**Likelihood**: Medium (if widget not built yet)
**Mitigation**:
- Check `public/widget/chat-widget.iife.js` exists
- Add to test setup verification
- Document build step in test README

### Risk 2: Next.js 16 Async Params API
**Impact**: Tests fail with params access error
**Likelihood**: Low (already implemented correctly)
**Mitigation**:
- Route uses `await params` syntax
- Tests pass `{ params: Promise.resolve({ license }) }` OR `{ params: { license } }`

### Risk 3: Domain Normalization Edge Cases
**Impact**: Test 5 or 7 may fail
**Likelihood**: Low (normalization tested separately)
**Mitigation**:
- Unit tests for normalizeDomain exist
- Integration tests use straightforward domains

### Risk 4: Database Cleanup
**Impact**: Tests pollute database, fail on re-run
**Likelihood**: Low (cleanup in afterAll)
**Mitigation**:
- Use unique email per test suite
- Delete in reverse order (widgets → licenses → users)

### Risk 5: File Read Performance
**Impact**: Slow tests (>5s)
**Likelihood**: Low (Node.js caches file reads)
**Mitigation**:
- Single file read per test run (cached)
- Consider in-memory cache if needed

---

## Interface Contracts

### Route Handler Signature

```typescript
/**
 * GET /api/widget/:license/chat-widget.js
 *
 * Purpose: Serve widget JavaScript with license validation
 *
 * @param request - Next.js request with referer header
 * @param context - { params: Promise<{ license: string }> }
 * @returns Response with JavaScript or JSON error
 *
 * Headers Required:
 * - Referer: Request origin for domain validation
 *
 * Response Types:
 * - 200: JavaScript bundle with injected license config
 * - 403: Forbidden (expired, cancelled, domain mismatch, no referer)
 * - 404: License not found
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ license: string }> }
): Promise<NextResponse>;
```

### Success Response (200)

```typescript
// Content-Type: application/javascript
// Cache-Control: public, max-age=3600

// Injected license config
(function() {
  window.ChatWidgetConfig = window.ChatWidgetConfig || {};
  window.ChatWidgetConfig.license = {
    brandingEnabled: true  // or false based on tier
  };
})();

// Widget IIFE code
(function() {
  // Widget implementation...
})();
```

### Error Response (403, 404, 500)

```typescript
// Content-Type: application/json

{
  "error": "License not found"  // or other error message
}
```

---

## Implementation Brief for TDD-QA-Lead

### Your Task

1. **Run Tests**:
   ```bash
   cd C:\Projects\Chat Interfacer\n8n-widget-designer
   npm test tests/integration/api/widget-serving.test.ts
   ```

2. **Document Results**:
   - Which tests pass?
   - Which tests fail?
   - What are the error messages?
   - Are there any missing test scenarios?

3. **Verify Test Quality**:
   - Do tests follow TDD principles? (Behavior-focused, not implementation)
   - Are assertions clear and specific?
   - Are test names descriptive?
   - Is test data properly cleaned up?

4. **Create RED Phase Report**:
   - File: `docs/testing/RED_PHASE_WIDGET_SERVING.md`
   - Include: Test results, failures, recommendations
   - Provide: Clear instructions for Implementer

### Success Criteria for Your Phase

- ✅ All 10 tests run (even if failing)
- ✅ Test failures documented with error messages
- ✅ Root causes identified (route issue vs test issue)
- ✅ Clear handoff to Implementer with specific tasks

### What You Should NOT Do

- ❌ Fix the route implementation (that's Implementer's job)
- ❌ Modify production code (only test code if needed)
- ❌ Add more tests (10 is the target, no redundancy)
- ❌ Skip test execution (must verify current state)

---

## Implementation Brief for Implementer (After RED Phase)

### Your Task (GREEN Phase)

1. **Review RED Phase Report**: Understand which tests are failing
2. **Fix Route Implementation**: Make minimal changes to pass tests
3. **Verify Widget Bundle**: Ensure `chat-widget.iife.js` exists
4. **Run Tests Iteratively**: Fix one test at a time
5. **Document Changes**: Note what was fixed and why

### Constraints

- **No Refactoring**: Only make tests pass, don't improve code yet
- **Minimal Changes**: Smallest possible edits to pass each test
- **Keep Tests Green**: Don't break passing tests while fixing failing ones
- **No New Features**: Only implement what tests require

### Success Criteria for Your Phase

- ✅ All 10 tests pass
- ✅ No TypeScript errors
- ✅ Route file < 200 lines
- ✅ Widget serves correctly on localhost test page

---

## Documentation Updates

### Files to Update After Tests Pass

1. **docs/development/DEVELOPMENT_LOG.md**:
   - Log widget serving tests completed
   - Note any issues encountered
   - Record test pass date

2. **docs/development/PROGRESS.md**:
   - Mark Phase 3 widget serving as complete
   - Update test count (currently 179, will be 189)

3. **docs/testing/TEST_SUMMARY.md**:
   - Add widget serving test results
   - Update coverage percentages

4. **tests/integration/api/widget-serving.test.ts**:
   - Remove "RED: Route doesn't exist yet" comments
   - Add summary at top with pass/fail status

---

## Appendix: Test Naming Convention

### Pattern

```typescript
describe('GET /api/widget/:license/chat-widget.js - Widget Serving', () => {
  it('should [expected behavior] for [specific condition]', async () => {
    // Test implementation
  });
});
```

### Examples from Test File

✅ **Good Names** (Behavior-focused):
- `should serve widget JavaScript for valid license and domain`
- `should return 404 for non-existent license key`
- `should return 403 for expired license`
- `should inject brandingEnabled=true for Basic tier license`

❌ **Bad Names** (Implementation-focused):
- `should call getLicenseByKey with correct parameter`
- `should read file from public/widget directory`
- `should use normalizeDomain function`

---

## Conclusion

This plan defines **10 essential integration tests** for the widget serving endpoint. The tests are already written and cover:

- ✅ 1 success path
- ✅ 5 authentication/authorization failures
- ✅ 1 edge case (localhost)
- ✅ 2 business logic validations (branding)
- ✅ 1 technical validation (IIFE structure)

**Next Steps**:
1. **TDD-QA-Lead**: Run tests, document RED phase status
2. **Implementer**: Fix route to pass all tests (GREEN phase)
3. **Refactorer**: Optimize and improve (REFACTOR phase)

**Target**: All 10 tests passing within 1 development session.

---

**Plan Author**: Architect/Planner Agent
**Plan Date**: November 10, 2025
**Review Status**: Ready for TDD-QA-Lead
**Estimated Time**: 2-4 hours to reach GREEN phase

# Module 3: License Validation - RED Tests Summary

**Date:** November 8, 2025
**Agent:** TDD-QA-Lead
**Status:** ✅ RED State Achieved
**Test File:** `tests/unit/license/validate.test.ts`

---

## Test Execution Results

### RED State Confirmation

```
❯ pnpm test tests/unit/license/validate.test.ts

FAIL  tests/unit/license/validate.test.ts
Error: Cannot find module '@/lib/license/validate' imported from 'tests/unit/license/validate.test.ts'

Test Files  1 failed (1)
     Tests  no tests
```

**Status:** ✅ **Perfect RED state** - Tests fail as expected because the implementation module does not exist yet.

---

## Test Coverage Summary

### Total Test Cases: 32

#### 1. Valid License Scenarios (8 tests)
- ✅ Exact domain match (Basic tier)
- ✅ Domain in allowedDomains array (Pro tier)
- ✅ Any domain validation (Agency tier - unlimited)
- ✅ Domain normalization with HTTPS protocol
- ✅ Domain normalization with WWW prefix
- ✅ Case-insensitive domain matching
- ✅ Domain normalization with port number
- ✅ License details in response structure

#### 2. Invalid License Scenarios (12 tests)
- ✅ License key does not exist
- ✅ License status is "cancelled"
- ✅ License status is "expired"
- ✅ License expiration date in the past
- ✅ Domain mismatch (Basic tier)
- ✅ Domain not in allowedDomains (Pro tier)
- ✅ Empty domain string
- ✅ Whitespace-only domain
- ✅ Subdomain when only root authorized
- ✅ Root domain when only subdomain authorized
- ✅ Empty allowedDomains array
- ✅ Null or undefined status

#### 3. Edge Cases (12 tests)
- ✅ Empty license key
- ✅ License key with special characters
- ✅ Domain with path and query parameters
- ✅ Very long license key (100 characters)
- ✅ License expiring exactly now (boundary case)
- ✅ License with null expiresAt (never expires)
- ✅ Multiple domains in allowedDomains array
- ✅ Domain with international characters (IDN)
- ✅ Database query error handling
- ✅ Multiple licenses for same key (should not happen)
- ✅ Tier field with unexpected value
- ✅ Concurrent validation requests

---

## ValidationResult Type Definition

The tests verify the following TypeScript type structure:

```typescript
type ValidationResult = {
  valid: boolean;
  reason?: string;  // Only present if valid === false
  license?: {       // Only present if valid === true
    id: string;
    userId: string;
    tier: 'basic' | 'pro' | 'agency';
    expiresAt: Date;
  };
};
```

### Response Structure Tests
- ✅ Valid license returns correct structure with `license` object
- ✅ Invalid license returns correct structure with `reason` string
- ✅ No `reason` field when `valid === true`
- ✅ No `license` field when `valid === false`

---

## Database Schema Required

The tests expect the following license schema (from `lib/db/schema.ts`):

```typescript
export const licenses = pgTable('licenses', {
  id: uuid('id'),
  userId: uuid('user_id'),
  licenseKey: varchar('license_key', { length: 32 }),
  tier: varchar('tier', { length: 20 }),  // 'basic' | 'pro' | 'agency'
  domains: text('domains').array(),       // Array of allowed domains
  domainLimit: integer('domain_limit'),   // 1 for basic/pro, -1 for agency
  brandingEnabled: boolean('branding_enabled'),
  status: varchar('status', { length: 20 }), // 'active' | 'expired' | 'cancelled'
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

---

## Test Dependencies

### Existing Modules (Already Implemented)
- ✅ `@/lib/license/domain` - Provides `normalizeDomain()` function
- ✅ `@/lib/db/schema` - Database schema definitions
- ✅ `@/lib/db/client` - Database client (mocked in tests)

### Module to Implement
- ❌ `@/lib/license/validate` - **Does not exist yet** (RED state)

---

## Implementation Requirements

Based on the comprehensive tests, the `validateLicense()` function must:

### 1. Function Signature
```typescript
export async function validateLicense(
  licenseKey: string,
  domain: string
): Promise<ValidationResult>
```

### 2. Validation Logic

#### Step 1: Database Query
- Query licenses table by `licenseKey`
- Return "License not found" if no match

#### Step 2: Status Check
- Check if `status === 'active'`
- Return "License is not active" for 'cancelled', 'expired', or null status

#### Step 3: Expiration Check
- Check if `expiresAt < now()`
- Return "License has expired" if expired
- Allow null `expiresAt` (never expires)

#### Step 4: Domain Normalization
- Call `normalizeDomain(domain)` to normalize the incoming domain
- Normalize all domains in `license.domains` array
- Handle empty domain strings

#### Step 5: Domain Authorization
- **Agency tier (domainLimit === -1):** Allow any domain (unlimited)
- **Basic/Pro tier (domainLimit > 0):** Check if normalized domain exists in `license.domains` array
- Return "Domain not authorized" if not found
- Handle empty `domains` array

#### Step 6: Success Response
- Return `ValidationResult` with:
  - `valid: true`
  - `license: { id, userId, tier, expiresAt }`
  - No `reason` field

### 3. Error Handling
- Allow database errors to propagate (tests expect rejection)
- Handle edge cases: null values, empty arrays, special characters
- Support concurrent requests (stateless function)

### 4. Performance Considerations
- Single database query per validation
- Efficient domain matching (normalized comparison)
- No caching (delegated to API layer)

---

## Test File Statistics

- **File:** `tests/unit/license/validate.test.ts`
- **Lines:** 994 lines
- **Test Suites:** 4 describe blocks
- **Test Cases:** 32 individual tests
- **Mocking Strategy:** Database client fully mocked with vi.mock()

---

## Mock Strategy

The tests use Vitest mocks to simulate database behavior:

```typescript
vi.mock('@/lib/db/client', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  },
}));
```

Each test configures the mock to return specific license data:

```typescript
const mockSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([mockLicense]),
  }),
});
vi.mocked(dbClient.db.select).mockImplementation(mockSelect as any);
```

---

## Next Steps for Implementer Agent

### 1. Create Implementation File
- Create `lib/license/validate.ts`
- Export `validateLicense()` function
- Export `ValidationResult` type

### 2. Implement Core Logic
- Follow the 6-step validation logic above
- Use `normalizeDomain()` from existing module
- Use Drizzle ORM for database queries

### 3. Run Tests (GREEN Phase)
```bash
pnpm test tests/unit/license/validate.test.ts
```

### 4. Expected Outcome
- All 32 tests should PASS
- 100% test coverage for `validateLicense()`
- No RED tests remaining

### 5. Implementation Hints

**Database Query Pattern:**
```typescript
import { db } from '@/lib/db/client';
import { licenses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const results = await db
  .select()
  .from(licenses)
  .where(eq(licenses.licenseKey, licenseKey));

const license = results[0];
```

**Domain Normalization:**
```typescript
import { normalizeDomain } from '@/lib/license/domain';

const normalizedDomain = normalizeDomain(domain);
const normalizedAllowedDomains = license.domains.map(d => normalizeDomain(d));
```

**Agency Tier Check:**
```typescript
// Agency tier allows unlimited domains
if (license.tier === 'agency' || license.domainLimit === -1) {
  // Any domain in the domains array is valid
}
```

---

## Database Schema Insights

### License Tiers & Domain Restrictions

| Tier    | Domain Limit | Branding | Annual Price | Domain Validation              |
|---------|--------------|----------|--------------|--------------------------------|
| Basic   | 1            | Yes      | $29          | Exact match from domains array |
| Pro     | 1            | No       | $49          | Exact match from domains array |
| Agency  | Unlimited    | No       | $149         | Any domain (no restrictions)   |

### Status Values
- `'active'` - License is valid and can be used
- `'expired'` - License subscription has ended
- `'cancelled'` - User cancelled the subscription
- `null` - Invalid state, treat as inactive

### Expiration Logic
- `expiresAt === null` - Never expires (lifetime license)
- `expiresAt < now()` - Expired (even if status is 'active')
- `expiresAt >= now()` - Not expired

---

## Test Determinism

All tests are **deterministic** and **fast**:
- ✅ No network calls (database is mocked)
- ✅ No real database queries
- ✅ No sleep/wait operations
- ✅ Predictable timestamps using fixed dates
- ✅ No shared state between tests
- ✅ Each test has isolated mocks (beforeEach cleanup)

**Estimated test execution time:** < 100ms for all 32 tests

---

## RED → GREEN → REFACTOR Workflow

### Current Status: RED ✅
- Tests exist and fail correctly
- Failure reason: Module not found
- All test scenarios defined

### Next: GREEN (Implementer)
- Create `lib/license/validate.ts`
- Implement minimal code to pass tests
- Run tests until all pass

### Then: REFACTOR (Optional)
- Optimize database queries
- Improve error messages
- Add JSDoc comments
- Extract helper functions if needed

---

## Test Quality Metrics

### Coverage Dimensions
- ✅ **Happy Path:** 8 tests for valid licenses
- ✅ **Error Cases:** 12 tests for invalid licenses
- ✅ **Edge Cases:** 12 tests for boundary conditions
- ✅ **Type Safety:** 2 tests for TypeScript type structure

### Domain Coverage
- ✅ All 3 tiers tested (basic, pro, agency)
- ✅ All 3 status values tested (active, expired, cancelled)
- ✅ Domain normalization edge cases (www, protocol, port, path, case)
- ✅ Expiration scenarios (past, future, now, null)
- ✅ Error handling (database errors, invalid data)

### Assertion Quality
- Uses specific matchers (`toBe`, `toBeUndefined`, `toEqual`)
- Verifies both positive and negative cases
- Checks complete response structure
- Tests async behavior correctly

---

## Guardrails Met

Following TDD-QA-Lead best practices:

✅ **No coupling to internals** - Tests only verify public API
✅ **Fast tests** - All mocked, no I/O
✅ **Deterministic** - No flaky sources (time, network, filesystem)
✅ **Small tests** - Each test validates one behavior
✅ **Clear naming** - Descriptive test names explain intent
✅ **Proper RED state** - Tests fail for the right reason (module not found)

---

## File Location

**Absolute Path:**
```
C:\Projects\Chat Interfacer\n8n-widget-designer\tests\unit\license\validate.test.ts
```

**Relative Path:**
```
tests/unit/license/validate.test.ts
```

---

## Summary

✅ **32 comprehensive RED tests created**
✅ **Perfect RED state achieved** (module not found)
✅ **All 3 test categories covered** (valid, invalid, edge cases)
✅ **Database fully mocked** (fast, deterministic tests)
✅ **Clear implementation requirements** documented
✅ **Type structure verified** (ValidationResult)
✅ **Ready for GREEN phase** (Implementer can start)

**Estimated Implementation Time:** 30-45 minutes for experienced developer

**Next Agent:** Implementer (create `lib/license/validate.ts` and make tests pass)

---

**Generated by:** TDD-QA-Lead Agent
**Timestamp:** 2025-11-08T22:22:00Z

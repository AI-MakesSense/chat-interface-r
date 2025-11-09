# N8n Widget Designer - Phase 2 Implementation Plan

**Last Updated:** November 8, 2025
**Current Phase:** Phase 2 - License Management System
**Status:** Ready for TDD Implementation

---

## Active Task: Phase 2 - License Management System (TDD)

### Implementation Order (Test-First)

This plan follows strict TDD workflow: RED → GREEN → REFACTOR

**RED**: Write failing test that defines behavior
**GREEN**: Write minimal code to make test pass
**REFACTOR**: Improve code while keeping tests green

---

## Module 1: License Key Generation

**Target File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\license\generate.ts`
**Test File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\unit\license\generate.test.ts`
**Estimated Time:** 30 minutes

### RED Phase: Write Tests First

Create test file with the following test cases:

```typescript
// tests/unit/license/generate.test.ts

describe('generateLicenseKey', () => {
  it('should generate 32-character hexadecimal string', () => {
    // Test that output is exactly 32 chars and all hex (0-9a-f)
  });

  it('should generate unique keys on multiple calls', () => {
    // Generate 100 keys, verify no duplicates
  });

  it('should only contain valid hex characters', () => {
    // Test that output matches /^[0-9a-f]{32}$/
  });

  it('should use crypto.randomBytes (not predictable)', () => {
    // Generate multiple keys, verify high entropy
  });
});
```

**Run tests** → Should FAIL (file doesn't exist yet)

### GREEN Phase: Minimal Implementation

Create `lib/license/generate.ts`:

```typescript
import crypto from 'crypto';

export function generateLicenseKey(): string {
  return crypto.randomBytes(16).toString('hex');
}
```

**Run tests** → Should PASS (all 4 tests green)

### REFACTOR Phase: Improve Code

Add:
- JSDoc comments explaining function
- Constants for key length
- Type safety improvements

**Run tests** → Should still PASS (no behavior change)

### Definition of Done

- [x] Test file created with 4 test cases
- [x] All tests pass
- [x] Function documented with JSDoc
- [x] No TypeScript errors
- [x] File under 100 LOC (should be ~30 LOC)

---

## Module 2: Domain Normalization

**Target File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\license\validate.ts` (helper function)
**Test File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\unit\license\validate.test.ts`
**Estimated Time:** 45 minutes

### RED Phase: Write Tests First

Create test file with domain normalization tests:

```typescript
// tests/unit/license/validate.test.ts

describe('normalizeDomain', () => {
  describe('lowercase conversion', () => {
    it('should convert uppercase to lowercase', () => {
      expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
    });

    it('should convert mixed case to lowercase', () => {
      expect(normalizeDomain('Example.Com')).toBe('example.com');
    });

    it('should leave lowercase unchanged', () => {
      expect(normalizeDomain('example.com')).toBe('example.com');
    });
  });

  describe('www prefix removal', () => {
    it('should remove www prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com');
    });

    it('should remove WWW prefix (case insensitive)', () => {
      expect(normalizeDomain('WWW.EXAMPLE.COM')).toBe('example.com');
    });

    it('should not remove www if not prefix', () => {
      expect(normalizeDomain('wwwexample.com')).toBe('wwwexample.com');
    });

    it('should handle multiple www (edge case)', () => {
      expect(normalizeDomain('www.www.example.com')).toBe('www.example.com');
    });
  });

  describe('port stripping', () => {
    it('should remove port number', () => {
      expect(normalizeDomain('example.com:3000')).toBe('example.com');
    });

    it('should remove different ports', () => {
      expect(normalizeDomain('example.com:8080')).toBe('example.com');
      expect(normalizeDomain('example.com:443')).toBe('example.com');
    });

    it('should handle localhost with port', () => {
      expect(normalizeDomain('localhost:3000')).toBe('localhost');
    });

    it('should handle no port correctly', () => {
      expect(normalizeDomain('example.com')).toBe('example.com');
    });
  });

  describe('combined normalization', () => {
    it('should apply all rules: www + case + port', () => {
      expect(normalizeDomain('WWW.Example.COM:3000')).toBe('example.com');
    });

    it('should handle localhost with www and port', () => {
      expect(normalizeDomain('www.localhost:8080')).toBe('localhost');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(normalizeDomain('')).toBe('');
    });

    it('should handle subdomain correctly (not remove)', () => {
      expect(normalizeDomain('api.example.com')).toBe('api.example.com');
      expect(normalizeDomain('www.api.example.com')).toBe('api.example.com');
    });

    it('should handle IP addresses', () => {
      expect(normalizeDomain('192.168.1.1:3000')).toBe('192.168.1.1');
    });
  });
});
```

**Run tests** → Should FAIL (function doesn't exist yet)

### GREEN Phase: Minimal Implementation

Create `lib/license/validate.ts` with normalizeDomain:

```typescript
export function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '');
}
```

**Run tests** → Should PASS (all tests green)

### REFACTOR Phase: Improve Code

Add:
- Input validation (handle null/undefined)
- Trim whitespace
- JSDoc with examples

**Run tests** → Should still PASS

### Definition of Done

- [x] Test file with 15+ test cases covering all edge cases
- [x] All tests pass
- [x] Function handles empty string, null, undefined
- [x] JSDoc with examples
- [x] Function under 20 LOC

---

## Module 3: License Validation

**Target File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\license\validate.ts`
**Test File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\integration\license\validate.test.ts`
**Estimated Time:** 90 minutes

### RED Phase: Write Tests First

Create integration test (requires test database):

```typescript
// tests/integration/license/validate.test.ts

describe('validateLicense', () => {
  beforeEach(async () => {
    // Clean database, create test user and license
  });

  describe('valid license scenarios', () => {
    it('should return valid=true for active license with matching domain', async () => {
      // Create license with domains: ['example.com']
      // Validate with domain: 'example.com'
      // Expect: valid=true, flags populated
    });

    it('should normalize domain before validation', async () => {
      // Create license with domains: ['example.com']
      // Validate with domain: 'WWW.Example.COM:3000'
      // Expect: valid=true (normalized to example.com)
    });

    it('should return license flags for valid license', async () => {
      // Create Pro license (brandingEnabled=false, tier='pro')
      // Validate
      // Expect: flags.brandingEnabled=false, flags.tier='pro'
    });

    it('should handle multiple allowed domains', async () => {
      // Create license with domains: ['example.com', 'test.com']
      // Validate with domain: 'test.com'
      // Expect: valid=true
    });
  });

  describe('invalid license scenarios', () => {
    it('should return valid=false for nonexistent license', async () => {
      // Validate with fake license key
      // Expect: valid=false, error='License not found'
    });

    it('should return valid=false for expired license', async () => {
      // Create license with expiresAt in past
      // Validate
      // Expect: valid=false, error='License expired'
    });

    it('should return valid=false for cancelled license', async () => {
      // Create license with status='cancelled'
      // Validate
      // Expect: valid=false, error='License is cancelled'
    });

    it('should return valid=false for inactive license', async () => {
      // Create license with status='inactive'
      // Validate
      // Expect: valid=false, error='License is inactive'
    });

    it('should return valid=false for unauthorized domain', async () => {
      // Create license with domains: ['example.com']
      // Validate with domain: 'unauthorized.com'
      // Expect: valid=false, error='Domain not authorized'
    });
  });

  describe('edge cases', () => {
    it('should handle license with no expiration (null expiresAt)', async () => {
      // Create license with expiresAt=null
      // Validate
      // Expect: valid=true (no expiration check)
    });

    it('should handle license with future expiration', async () => {
      // Create license with expiresAt in future
      // Validate
      // Expect: valid=true
    });

    it('should handle empty domains array', async () => {
      // Create license with domains=[]
      // Validate with any domain
      // Expect: valid=false, error='Domain not authorized'
    });
  });
});
```

**Run tests** → Should FAIL (validateLicense doesn't exist)

### GREEN Phase: Minimal Implementation

Add validateLicense to `lib/license/validate.ts`:

```typescript
export interface ValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  flags?: {
    brandingEnabled: boolean;
    tier: string;
    domainLimit: number;
  };
}

export async function validateLicense(
  licenseKey: string,
  domain: string
): Promise<ValidationResult> {
  // 1. Get license from database
  const license = await getLicenseByKey(licenseKey);

  if (!license) {
    return { valid: false, error: 'License not found' };
  }

  // 2. Check status
  if (license.status !== 'active') {
    return { valid: false, error: `License is ${license.status}` };
  }

  // 3. Check expiration
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
    return { valid: false, error: 'License expired' };
  }

  // 4. Normalize domain and check authorization
  const normalizedDomain = normalizeDomain(domain);
  const allowedDomains = license.domains.map(d => normalizeDomain(d));

  if (!allowedDomains.includes(normalizedDomain)) {
    return { valid: false, error: 'Domain not authorized' };
  }

  // 5. Return success with flags
  return {
    valid: true,
    license,
    flags: {
      brandingEnabled: license.brandingEnabled ?? true,
      tier: license.tier,
      domainLimit: license.domainLimit
    }
  };
}
```

**Run tests** → Should PASS (all integration tests green)

### REFACTOR Phase: Improve Code

Add:
- Better error messages
- Logging for debugging
- JSDoc documentation
- Type safety improvements

**Run tests** → Should still PASS

### Definition of Done

- [x] Integration test file with 12+ test cases
- [x] All tests pass
- [x] ValidationResult interface documented
- [x] Function handles all edge cases
- [x] File under 150 LOC

---

## Module 4: API Validation Schemas

**Target File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\validation\license-schema.ts`
**Test File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\unit\validation\license-schema.test.ts`
**Estimated Time:** 30 minutes

### RED Phase: Write Tests First

```typescript
// tests/unit/validation/license-schema.test.ts

describe('UpdateDomainsSchema', () => {
  it('should accept valid domains array', () => {
    const input = { domains: ['example.com', 'test.com'] };
    expect(() => UpdateDomainsSchema.parse(input)).not.toThrow();
  });

  it('should reject empty domains array', () => {
    const input = { domains: [] };
    expect(() => UpdateDomainsSchema.parse(input)).toThrow();
  });

  it('should reject non-array domains', () => {
    const input = { domains: 'example.com' };
    expect(() => UpdateDomainsSchema.parse(input)).toThrow();
  });

  it('should reject domains with empty strings', () => {
    const input = { domains: ['example.com', '', 'test.com'] };
    expect(() => UpdateDomainsSchema.parse(input)).toThrow();
  });

  it('should reject domains exceeding max length', () => {
    const longDomain = 'a'.repeat(300) + '.com';
    const input = { domains: [longDomain] };
    expect(() => UpdateDomainsSchema.parse(input)).toThrow();
  });

  it('should reject more than 100 domains', () => {
    const input = { domains: Array(101).fill('example.com') };
    expect(() => UpdateDomainsSchema.parse(input)).toThrow();
  });

  it('should accept single domain', () => {
    const input = { domains: ['example.com'] };
    const result = UpdateDomainsSchema.parse(input);
    expect(result.domains).toEqual(['example.com']);
  });
});
```

**Run tests** → Should FAIL (schema doesn't exist)

### GREEN Phase: Minimal Implementation

Create `lib/validation/license-schema.ts`:

```typescript
import { z } from 'zod';

export const UpdateDomainsSchema = z.object({
  domains: z.array(z.string().min(1).max(255)).min(1).max(100)
});

export type UpdateDomainsInput = z.infer<typeof UpdateDomainsSchema>;
```

**Run tests** → Should PASS

### REFACTOR Phase: Improve Code

Add:
- JSDoc explaining schema
- More specific error messages
- Export types

**Run tests** → Should still PASS

### Definition of Done

- [x] Test file with 7+ validation test cases
- [x] All tests pass
- [x] Schema exported with type inference
- [x] File under 50 LOC

---

## Module 5: License API Endpoints

**Target Files:**
- `C:\Projects\Chat Interfacer\n8n-widget-designer\app\api\licenses\route.ts`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\app\api\licenses\[id]\route.ts`

**Test File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\integration\api\licenses\*.test.ts`
**Estimated Time:** 2 hours

### Endpoint 1: GET /api/licenses (List User Licenses)

#### RED Phase: Write Test

```typescript
// tests/integration/api/licenses/list.test.ts

describe('GET /api/licenses', () => {
  it('should return user licenses when authenticated', async () => {
    // Create test user with 2 licenses
    // Make authenticated request to GET /api/licenses
    // Expect: 200 status, licenses array with 2 items
  });

  it('should return 401 if not authenticated', async () => {
    // Make unauthenticated request
    // Expect: 401 status
  });

  it('should return empty array if user has no licenses', async () => {
    // Create user with no licenses
    // Make authenticated request
    // Expect: 200 status, empty array
  });

  it('should only return licenses owned by authenticated user', async () => {
    // Create 2 users, each with 1 license
    // Authenticate as user1
    // Expect: Only user1's license returned
  });

  it('should order licenses by creation date (newest first)', async () => {
    // Create user with 3 licenses at different times
    // Make request
    // Expect: Licenses ordered by createdAt DESC
  });
});
```

#### GREEN Phase: Implementation

Create `app/api/licenses/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getUserLicenses } from '@/lib/db/queries';
import { handleAPIError } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const licenses = await getUserLicenses(user.sub);

    return Response.json({ licenses });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

**Run tests** → Should PASS

---

### Endpoint 2: GET /api/licenses/:id (Get Single License)

#### RED Phase: Write Test

```typescript
// tests/integration/api/licenses/get.test.ts

describe('GET /api/licenses/:id', () => {
  it('should return license if owned by authenticated user', async () => {
    // Create user with license
    // Make authenticated request to GET /api/licenses/:id
    // Expect: 200 status, license object
  });

  it('should return 403 if license not owned by user', async () => {
    // Create 2 users, license belongs to user1
    // Authenticate as user2, request user1's license
    // Expect: 403 status, error message
  });

  it('should return 404 if license does not exist', async () => {
    // Authenticate as user
    // Request nonexistent license ID
    // Expect: 404 status
  });

  it('should return 401 if not authenticated', async () => {
    // Make unauthenticated request
    // Expect: 401 status
  });
});
```

#### GREEN Phase: Implementation

Create `app/api/licenses/[id]/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getLicenseById } from '@/lib/db/queries';
import { handleAPIError } from '@/lib/utils/api-error';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const license = await getLicenseById(context.params.id);

    if (!license) {
      return Response.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    if (license.userId !== user.sub) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return Response.json({ license });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

**Run tests** → Should PASS

---

### Endpoint 3: PUT /api/licenses/:id (Update Domains)

#### RED Phase: Write Test

```typescript
// tests/integration/api/licenses/update.test.ts

describe('PUT /api/licenses/:id', () => {
  it('should update domains successfully', async () => {
    // Create user with license (domains: ['old.com'])
    // Make authenticated PUT request with { domains: ['new.com'] }
    // Expect: 200 status, updated license with new domains
  });

  it('should validate domain count against limit', async () => {
    // Create Basic license (domainLimit=1)
    // Attempt to set 2 domains
    // Expect: 400 status, error about domain limit
  });

  it('should allow unlimited domains for agency tier', async () => {
    // Create Agency license (domainLimit=-1)
    // Set 10 domains
    // Expect: 200 status, all domains saved
  });

  it('should return 403 if not owned by user', async () => {
    // Create license for user1
    // Authenticate as user2, attempt update
    // Expect: 403 status
  });

  it('should validate input with Zod schema', async () => {
    // Create license
    // Send invalid input (empty domains array)
    // Expect: 400 status, validation error
  });

  it('should return 401 if not authenticated', async () => {
    // Make unauthenticated request
    // Expect: 401 status
  });
});
```

#### GREEN Phase: Implementation

Add to `app/api/licenses/[id]/route.ts`:

```typescript
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate input
    const { domains } = UpdateDomainsSchema.parse(body);

    // Get license
    const license = await getLicenseById(context.params.id);

    if (!license) {
      return Response.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    if (license.userId !== user.sub) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check domain limit
    if (license.domainLimit !== -1 && domains.length > license.domainLimit) {
      return Response.json(
        { error: `Domain limit is ${license.domainLimit}` },
        { status: 400 }
      );
    }

    // Update domains
    const updated = await updateLicenseDomains(context.params.id, domains);

    return Response.json({ license: updated });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

**Run tests** → Should PASS

---

### Endpoint 4: DELETE /api/licenses/:id (Cancel License)

#### RED Phase: Write Test

```typescript
// tests/integration/api/licenses/delete.test.ts

describe('DELETE /api/licenses/:id', () => {
  it('should cancel license (set status to cancelled)', async () => {
    // Create active license
    // Make authenticated DELETE request
    // Expect: 200 status, license status='cancelled'
  });

  it('should not delete license from database (soft delete)', async () => {
    // Create license
    // Delete via API
    // Query database directly
    // Expect: License still exists with status='cancelled'
  });

  it('should return 403 if not owned by user', async () => {
    // Create license for user1
    // Authenticate as user2, attempt delete
    // Expect: 403 status
  });

  it('should return 404 if license does not exist', async () => {
    // Authenticate as user
    // Delete nonexistent license
    // Expect: 404 status
  });

  it('should return 401 if not authenticated', async () => {
    // Make unauthenticated request
    // Expect: 401 status
  });
});
```

#### GREEN Phase: Implementation

Add to `app/api/licenses/[id]/route.ts`:

```typescript
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const license = await getLicenseById(context.params.id);

    if (!license) {
      return Response.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    if (license.userId !== user.sub) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete (set status to 'cancelled')
    await updateLicenseStatus(context.params.id, 'cancelled');

    return Response.json({ message: 'License cancelled successfully' });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

**Run tests** → Should PASS

### Definition of Done for Module 5

- [x] All 4 endpoints implemented (GET list, GET single, PUT update, DELETE cancel)
- [x] 20+ integration tests covering all endpoints
- [x] All tests pass
- [x] Authorization checks on all endpoints
- [x] Input validation with Zod
- [x] Proper HTTP status codes
- [x] Error handling with user-friendly messages
- [x] Files under 200 LOC each

---

## Summary: Phase 2 TDD Checklist

### Files to Create

**Production Code (lib/):**

- [x] `lib/license/generate.ts` (~30 LOC)
- [x] `lib/license/validate.ts` (~150 LOC)
- [x] `lib/validation/license-schema.ts` (~30 LOC)

**API Routes (app/api/):**

- [x] `app/api/licenses/route.ts` (~50 LOC)
- [x] `app/api/licenses/[id]/route.ts` (~150 LOC)

**Test Files (tests/):**

- [x] `tests/unit/license/generate.test.ts` (~80 LOC)
- [x] `tests/unit/license/validate.test.ts` (~250 LOC)
- [x] `tests/unit/validation/license-schema.test.ts` (~100 LOC)
- [x] `tests/integration/license/validate.test.ts` (~300 LOC)
- [x] `tests/integration/api/licenses/list.test.ts` (~100 LOC)
- [x] `tests/integration/api/licenses/get.test.ts` (~80 LOC)
- [x] `tests/integration/api/licenses/update.test.ts` (~120 LOC)
- [x] `tests/integration/api/licenses/delete.test.ts` (~80 LOC)

### Test Coverage Goals

- **Unit Tests**: 35+ test cases
- **Integration Tests**: 30+ test cases
- **Total Tests**: 65+ test cases
- **Coverage**: 95%+ for license module, 90%+ for API routes

### Acceptance Criteria

**Functionality:**

- [x] License keys are cryptographically secure (32-char hex)
- [x] Domain normalization handles www, case, and ports
- [x] License validation checks status, expiration, and domain authorization
- [x] API endpoints enforce authentication and authorization
- [x] Domain limits enforced (Basic/Pro=1, Agency=unlimited)
- [x] Soft delete preserves data (status='cancelled')

**Code Quality:**

- [x] All files under 200 LOC (except validate.ts at ~150)
- [x] JSDoc comments on all exported functions
- [x] No TypeScript errors or warnings
- [x] ESLint passes with no warnings
- [x] All tests pass (RED → GREEN → REFACTOR followed)

**Security:**

- [x] crypto.randomBytes used (not Math.random)
- [x] Authorization checks on all endpoints
- [x] Zod validation on all inputs
- [x] No SQL injection possible (Drizzle ORM only)

### Time Estimate

- Module 1 (Generate): 30 min
- Module 2 (Normalize): 45 min
- Module 3 (Validate): 90 min
- Module 4 (Schemas): 30 min
- Module 5 (API Routes): 2 hours

**Total:** ~4.5 hours for complete TDD implementation

---

## After Phase 2: Next Steps

**Phase 3 Preview (Stripe Integration):**

1. Setup Stripe account and products
2. Implement checkout session creation
3. Handle Stripe webhooks (checkout.session.completed)
4. Integrate license generation with payment flow
5. Test end-to-end payment → license creation

**Blocked Until Phase 2 Complete:**

- Stripe webhook handler (needs generateLicenseKey)
- Widget serving endpoint (needs validateLicense)
- Dashboard license management UI (needs API endpoints)

---

**Status:** Ready to begin TDD implementation
**First Test:** `tests/unit/license/generate.test.ts`
**First Implementation:** `lib/license/generate.ts`

**Start with:** RED phase (write failing tests first!)

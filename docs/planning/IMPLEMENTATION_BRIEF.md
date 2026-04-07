# Phase 2 Implementation Brief: License Management System

**For:** TDD-QA-Lead (Test Implementation)
**Date:** November 8, 2025
**Status:** Ready for Test Development

---

## Overview

This brief provides everything needed to begin TDD implementation of the License Management System. Follow the RED → GREEN → REFACTOR workflow strictly.

**First Step:** Write the tests defined below (RED phase). All tests should FAIL initially.

---

## Module 1: License Key Generation

### Target Implementation

**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\license\generate.ts`

**Function Signature:**

```typescript
/**
 * Generate a unique, cryptographically secure license key
 *
 * @returns 32-character hexadecimal string
 *
 * @example
 * const key = generateLicenseKey();
 * // Returns: "5d3487e9715d0dd61dabc2782b87eab9"
 */
export function generateLicenseKey(): string;
```

**Implementation Constraints:**

- MUST use `crypto.randomBytes(16).toString('hex')`
- MUST return exactly 32 characters
- MUST return only hexadecimal characters (0-9a-f)
- MUST NOT use Math.random() or timestamps
- File MUST be under 100 LOC

### First RED Test to Write

**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\unit\license\generate.test.ts`

```typescript
/**
 * Unit Tests for License Key Generation
 *
 * Tests for lib/license/generate.ts
 *
 * Test Coverage:
 * - Generates 32-character hex strings
 * - Keys are unique (no duplicates)
 * - Only valid hex characters
 * - Uses cryptographically secure randomness
 */

import { describe, it, expect } from 'vitest';
import { generateLicenseKey } from '@/lib/license/generate';

describe('generateLicenseKey', () => {
  describe('format validation', () => {
    it('should generate 32-character hexadecimal string', () => {
      // Arrange & Act
      const key = generateLicenseKey();

      // Assert
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toHaveLength(32);
    });

    it('should only contain valid hexadecimal characters', () => {
      // Arrange & Act
      const key = generateLicenseKey();

      // Assert
      const hexRegex = /^[0-9a-f]{32}$/;
      expect(key).toMatch(hexRegex);
    });

    it('should generate lowercase hex characters', () => {
      // Arrange & Act
      const key = generateLicenseKey();

      // Assert
      expect(key).toBe(key.toLowerCase());
      expect(key).not.toMatch(/[A-F]/); // No uppercase hex
    });
  });

  describe('uniqueness', () => {
    it('should generate unique keys on multiple calls', () => {
      // Arrange
      const keys = new Set<string>();
      const iterations = 100;

      // Act
      for (let i = 0; i < iterations; i++) {
        keys.add(generateLicenseKey());
      }

      // Assert
      expect(keys.size).toBe(iterations); // All unique
    });

    it('should generate different keys on consecutive calls', () => {
      // Arrange & Act
      const key1 = generateLicenseKey();
      const key2 = generateLicenseKey();
      const key3 = generateLicenseKey();

      // Assert
      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);
    });
  });

  describe('randomness (cryptographic security)', () => {
    it('should have high entropy (not predictable)', () => {
      // Arrange
      const keys = Array.from({ length: 10 }, () => generateLicenseKey());

      // Act & Assert
      // Check that keys don't follow a pattern (e.g., incrementing)
      const uniqueChars = new Set(keys.join('').split(''));
      expect(uniqueChars.size).toBeGreaterThan(10); // Should use many different chars

      // Check no sequential patterns
      for (let i = 0; i < keys.length - 1; i++) {
        expect(keys[i]).not.toBe(keys[i + 1]);
        // Check not just incrementing hex values
        expect(parseInt(keys[i].slice(0, 8), 16))
          .not.toBe(parseInt(keys[i + 1].slice(0, 8), 16) - 1);
      }
    });
  });
});
```

**Run Command:**

```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
npm test tests/unit/license/generate.test.ts
```

**Expected Result:** All tests FAIL (file doesn't exist)

---

## Module 2: Domain Normalization

### Target Implementation

**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\license\validate.ts` (helper function)

**Function Signature:**

```typescript
/**
 * Normalize a domain for comparison
 *
 * Rules:
 * - Convert to lowercase
 * - Remove 'www.' prefix
 * - Remove port numbers
 *
 * @param domain - Domain to normalize
 * @returns Normalized domain string
 *
 * @example
 * normalizeDomain("WWW.Example.COM:3000") // Returns: "example.com"
 * normalizeDomain("example.com") // Returns: "example.com"
 * normalizeDomain("api.example.com") // Returns: "api.example.com" (subdomain preserved)
 */
export function normalizeDomain(domain: string): string;
```

**Implementation Constraints:**

- MUST convert to lowercase
- MUST remove 'www.' prefix only (not other subdomains)
- MUST strip port numbers (e.g., :3000, :8080)
- MUST handle empty strings without crashing
- MUST preserve subdomains (api.example.com stays as is)
- Function MUST be under 20 LOC

### RED Test to Write

**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\unit\license\validate.test.ts`

```typescript
/**
 * Unit Tests for License Validation Utilities
 *
 * Tests for lib/license/validate.ts
 *
 * Test Coverage:
 * - Domain normalization (lowercase, www removal, port stripping)
 * - Edge cases (empty strings, IP addresses, subdomains)
 */

import { describe, it, expect } from 'vitest';
import { normalizeDomain } from '@/lib/license/validate';

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

    it('should handle ALL CAPS domains', () => {
      expect(normalizeDomain('WWW.EXAMPLE.COM')).toBe('example.com');
    });
  });

  describe('www prefix removal', () => {
    it('should remove www prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com');
    });

    it('should remove WWW prefix (case insensitive)', () => {
      expect(normalizeDomain('WWW.EXAMPLE.COM')).toBe('example.com');
    });

    it('should remove Www prefix (mixed case)', () => {
      expect(normalizeDomain('Www.Example.com')).toBe('example.com');
    });

    it('should not remove www if not a prefix', () => {
      expect(normalizeDomain('wwwexample.com')).toBe('wwwexample.com');
    });

    it('should handle multiple www (edge case)', () => {
      expect(normalizeDomain('www.www.example.com')).toBe('www.example.com');
    });

    it('should not remove www from subdomain', () => {
      expect(normalizeDomain('api.www.example.com')).toBe('api.www.example.com');
    });
  });

  describe('port stripping', () => {
    it('should remove standard port (3000)', () => {
      expect(normalizeDomain('example.com:3000')).toBe('example.com');
    });

    it('should remove different ports', () => {
      expect(normalizeDomain('example.com:8080')).toBe('example.com');
      expect(normalizeDomain('example.com:443')).toBe('example.com');
      expect(normalizeDomain('example.com:80')).toBe('example.com');
    });

    it('should handle localhost with port', () => {
      expect(normalizeDomain('localhost:3000')).toBe('localhost');
    });

    it('should handle 5-digit ports', () => {
      expect(normalizeDomain('example.com:65535')).toBe('example.com');
    });

    it('should not modify domain without port', () => {
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

    it('should handle subdomain with case and port', () => {
      expect(normalizeDomain('API.Example.com:3000')).toBe('api.example.com');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      expect(normalizeDomain('')).toBe('');
    });

    it('should handle subdomain correctly (not remove)', () => {
      expect(normalizeDomain('api.example.com')).toBe('api.example.com');
    });

    it('should handle multiple subdomains', () => {
      expect(normalizeDomain('api.staging.example.com')).toBe('api.staging.example.com');
    });

    it('should handle IP addresses', () => {
      expect(normalizeDomain('192.168.1.1:3000')).toBe('192.168.1.1');
    });

    it('should handle localhost', () => {
      expect(normalizeDomain('localhost')).toBe('localhost');
    });

    it('should handle 127.0.0.1', () => {
      expect(normalizeDomain('127.0.0.1:8080')).toBe('127.0.0.1');
    });
  });

  describe('real-world examples', () => {
    it('should normalize production domains', () => {
      expect(normalizeDomain('www.myapp.com:443')).toBe('myapp.com');
    });

    it('should normalize development domains', () => {
      expect(normalizeDomain('localhost:3000')).toBe('localhost');
    });

    it('should normalize staging domains', () => {
      expect(normalizeDomain('staging.myapp.com')).toBe('staging.myapp.com');
    });
  });
});
```

**Run Command:**

```bash
npm test tests/unit/license/validate.test.ts
```

**Expected Result:** All tests FAIL (function doesn't exist)

---

## Module 3: License Validation (Integration Tests)

### Target Implementation

**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\lib\license\validate.ts`

**Function Signature:**

```typescript
/**
 * Validation result structure
 */
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

/**
 * Validate a license key for a specific domain
 *
 * Checks:
 * 1. License exists in database
 * 2. Status is 'active'
 * 3. Not expired (if expiresAt is set)
 * 4. Domain is in allowed domains (after normalization)
 *
 * @param licenseKey - 32-character hex license key
 * @param domain - Domain requesting access
 * @returns ValidationResult with flags if valid, error message if invalid
 *
 * @example
 * const result = await validateLicense(
 *   "5d3487e9715d0dd61dabc2782b87eab9",
 *   "www.example.com"
 * );
 *
 * if (result.valid) {
 *   console.log("License valid for tier:", result.flags.tier);
 * } else {
 *   console.error("Validation error:", result.error);
 * }
 */
export async function validateLicense(
  licenseKey: string,
  domain: string
): Promise<ValidationResult>;
```

**Implementation Constraints:**

- MUST query database using `getLicenseByKey()`
- MUST check status === 'active'
- MUST check expiration if `expiresAt` is set
- MUST normalize domain before checking
- MUST return flags for valid licenses
- File MUST be under 200 LOC total (including normalizeDomain)

### RED Test to Write

**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\integration\license\validate.test.ts`

```typescript
/**
 * Integration Tests for License Validation
 *
 * Tests for lib/license/validate.ts (validateLicense function)
 *
 * Test Coverage:
 * - Valid license scenarios
 * - Invalid license scenarios (expired, cancelled, wrong domain)
 * - Edge cases (null expiration, empty domains)
 *
 * Note: These are integration tests that require database access
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateLicense } from '@/lib/license/validate';
import { createUser } from '@/lib/db/queries';
import { createLicense, updateLicenseStatus } from '@/lib/db/queries';
import { db } from '@/lib/db/client';
import { users, licenses } from '@/lib/db/schema';
import type { License } from '@/lib/db/schema';

describe('validateLicense (Integration)', () => {
  let testUserId: string;
  let testLicense: License;

  beforeEach(async () => {
    // Clean up database
    await db.delete(licenses);
    await db.delete(users);

    // Create test user
    const user = await createUser({
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      name: 'Test User'
    });
    testUserId = user.id;

    // Create test license (active, Pro tier, example.com domain)
    testLicense = await createLicense({
      userId: testUserId,
      licenseKey: '5d3487e9715d0dd61dabc2782b87eab9',
      tier: 'pro',
      domains: ['example.com'],
      domainLimit: 1,
      brandingEnabled: false,
      status: 'active',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    });
  });

  afterEach(async () => {
    // Clean up
    await db.delete(licenses);
    await db.delete(users);
  });

  describe('valid license scenarios', () => {
    it('should return valid=true for active license with matching domain', async () => {
      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(true);
      expect(result.license).toBeDefined();
      expect(result.license?.id).toBe(testLicense.id);
      expect(result.error).toBeUndefined();
    });

    it('should normalize domain before validation', async () => {
      // Act - domain with www and port
      const result = await validateLicense(testLicense.licenseKey, 'WWW.Example.COM:3000');

      // Assert
      expect(result.valid).toBe(true); // Should match 'example.com' after normalization
    });

    it('should return license flags for valid license', async () => {
      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.flags).toBeDefined();
      expect(result.flags?.brandingEnabled).toBe(false);
      expect(result.flags?.tier).toBe('pro');
      expect(result.flags?.domainLimit).toBe(1);
    });

    it('should handle multiple allowed domains', async () => {
      // Arrange - update license to have 2 domains (agency tier)
      await db.update(licenses)
        .set({
          domains: ['example.com', 'test.com'],
          tier: 'agency',
          domainLimit: -1
        })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result1 = await validateLicense(testLicense.licenseKey, 'example.com');
      const result2 = await validateLicense(testLicense.licenseKey, 'test.com');

      // Assert
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('should allow license with no expiration (null expiresAt)', async () => {
      // Arrange
      await db.update(licenses)
        .set({ expiresAt: null })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(true);
    });

    it('should allow license with future expiration', async () => {
      // Arrange - expires in 30 days
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.update(licenses)
        .set({ expiresAt: futureDate })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid license scenarios', () => {
    it('should return valid=false for nonexistent license', async () => {
      // Act
      const result = await validateLicense('nonexistent1234567890abcdef1234', 'example.com');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('License not found');
      expect(result.license).toBeUndefined();
      expect(result.flags).toBeUndefined();
    });

    it('should return valid=false for expired license', async () => {
      // Arrange - expired 1 day ago
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.update(licenses)
        .set({ expiresAt: pastDate })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('License expired');
    });

    it('should return valid=false for cancelled license', async () => {
      // Arrange
      await updateLicenseStatus(testLicense.id, 'cancelled');

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('License is cancelled');
    });

    it('should return valid=false for inactive license', async () => {
      // Arrange
      await db.update(licenses)
        .set({ status: 'inactive' })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('License is inactive');
    });

    it('should return valid=false for unauthorized domain', async () => {
      // Act
      const result = await validateLicense(testLicense.licenseKey, 'unauthorized.com');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain not authorized');
    });

    it('should reject domain not in allowed list even with normalization', async () => {
      // Act - try to access with different domain (normalized)
      const result = await validateLicense(testLicense.licenseKey, 'WWW.Other.COM:3000');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain not authorized');
    });
  });

  describe('edge cases', () => {
    it('should handle license with empty domains array', async () => {
      // Arrange
      await db.update(licenses)
        .set({ domains: [] })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'example.com');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Domain not authorized');
    });

    it('should handle case-insensitive domain matching', async () => {
      // Arrange - domain in DB is lowercase
      // Act - request with uppercase
      const result = await validateLicense(testLicense.licenseKey, 'EXAMPLE.COM');

      // Assert
      expect(result.valid).toBe(true); // Should match after normalization
    });

    it('should handle localhost domains', async () => {
      // Arrange
      await db.update(licenses)
        .set({ domains: ['localhost'] })
        .where(eq(licenses.id, testLicense.id));

      // Act
      const result = await validateLicense(testLicense.licenseKey, 'localhost:3000');

      // Assert
      expect(result.valid).toBe(true); // localhost:3000 → localhost
    });
  });
});
```

**Run Command:**

```bash
npm test tests/integration/license/validate.test.ts
```

**Expected Result:** All tests FAIL (function doesn't exist)

**Note:** This test requires database setup. Make sure `DATABASE_URL` is set in `.env.local`.

---

## Testing Workflow

### Step 1: Write Tests (RED Phase)

1. Create test file
2. Write all test cases (following examples above)
3. Run tests: `npm test <test-file-path>`
4. Verify ALL tests FAIL (file/function doesn't exist)

### Step 2: Minimal Implementation (GREEN Phase)

1. Create implementation file
2. Write MINIMAL code to make tests pass
3. Run tests again
4. Iterate until ALL tests PASS

### Step 3: Refactor (REFACTOR Phase)

1. Add JSDoc comments
2. Extract helper functions if needed
3. Improve error messages
4. Add type safety improvements
5. Run tests to ensure they still PASS

### Step 4: Verify Quality

1. Check file LOC (must be under limits)
2. Run TypeScript check: `npm run type-check`
3. Run linter: `npm run lint`
4. Verify no warnings or errors

---

## Test Commands

**Run all tests:**

```bash
npm test
```

**Run specific test file:**

```bash
npm test tests/unit/license/generate.test.ts
```

**Run tests in watch mode:**

```bash
npm test -- --watch
```

**Run tests with coverage:**

```bash
npm test -- --coverage
```

**Run only integration tests:**

```bash
npm test tests/integration
```

**Run only unit tests:**

```bash
npm test tests/unit
```

---

## Success Criteria

### For Module 1 (License Generation):

- [x] 4+ test cases written
- [x] All tests pass
- [x] Function returns 32-char hex string
- [x] Keys are unique and unpredictable
- [x] File under 100 LOC

### For Module 2 (Domain Normalization):

- [x] 20+ test cases written
- [x] All tests pass
- [x] Handles lowercase, www removal, port stripping
- [x] Preserves subdomains correctly
- [x] Function under 20 LOC

### For Module 3 (License Validation):

- [x] 15+ integration test cases written
- [x] All tests pass
- [x] Validates status, expiration, and domain
- [x] Returns proper error messages
- [x] Returns flags for valid licenses
- [x] File under 200 LOC total

---

## Next Steps After Tests Pass

Once all tests are GREEN:

1. **Document** functions with JSDoc
2. **Refactor** code for clarity (while keeping tests green)
3. **Commit** changes with message: "feat: implement license key generation and validation"
4. **Move to Module 4**: API validation schemas
5. **Report** to Architect if any issues or blockers

---

## Questions or Issues?

If tests reveal design issues:

1. **Don't change tests** to match bad implementation
2. **Report** to Architect/Planner
3. **Discuss** whether requirements need adjustment
4. **Update** planning docs if design changes

**Remember:** Tests define the contract. If implementation can't meet tests, the design may need revision.

---

**Ready to Begin:** Start with Module 1, test file `tests/unit/license/generate.test.ts`

**First Command:**

```bash
cd "C:\Projects\Chat Interfacer\n8n-widget-designer"
mkdir -p tests/unit/license
# Create test file and start writing tests
```

**Good luck with TDD!**

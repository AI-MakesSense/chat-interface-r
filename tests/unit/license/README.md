# License Module Tests

## Overview
Unit tests for the license key generation and validation functionality.

## Test Files

### generate.test.ts
Tests for the `generateLicenseKey()` function.

**Status:** RED (failing) - Module not implemented yet

**Test Coverage:**

#### Basic Functionality
- Returns a string
- Returns exactly 32 characters
- Contains only valid hexadecimal characters (0-9, a-f)
- No uppercase characters
- No non-hexadecimal characters

#### Uniqueness
- Generates different keys on multiple calls
- Maintains uniqueness across 100 iterations
- No collisions in 1000 key sample

#### Security
- Uses `crypto.randomBytes` for secure randomness
- Does not use `Math.random` or other insecure methods
- Calls `crypto.randomBytes(16)` to generate 16 bytes (32 hex chars)
- Buffer to hex conversion works correctly
- Deterministic behavior with mocked crypto
- No predictable patterns based on timestamp
- Cryptographically strong random values

#### Edge Cases
- Not empty string
- Not null or undefined
- No spaces or special characters
- Consistent format across multiple calls

#### Performance
- Executes under 100ms
- Handles 1000 rapid calls in under 1 second

## Test Patterns

### Mocking crypto.randomBytes
```typescript
const mockBuffer = Buffer.from([0x12, 0x34, ...]);
vi.spyOn(crypto, 'randomBytes').mockReturnValueOnce(mockBuffer);
```

### Uniqueness Testing
```typescript
const keys = new Set<string>();
for (let i = 0; i < iterations; i++) {
  keys.add(generateLicenseKey());
}
expect(keys.size).toBe(iterations);
```

## Expected Implementation

The `generateLicenseKey()` function should:
1. Use Node.js `crypto.randomBytes(16)` to generate 16 random bytes
2. Convert the buffer to hexadecimal string using `.toString('hex')`
3. Return the 32-character lowercase hex string

Example implementation signature:
```typescript
export function generateLicenseKey(): string;
```

## Next Steps

1. Implementer creates `lib/license/generate.ts`
2. Implement `generateLicenseKey()` function
3. Run tests to verify GREEN state
4. Refactor if needed while keeping tests GREEN

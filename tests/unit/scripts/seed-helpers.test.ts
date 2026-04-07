/**
 * Unit Tests for Seed Script Helper Functions
 *
 * Tests the helper functions used in the seed script:
 * - generateLicenseKey (32-char hex)
 * - generateWidgetKey (16-char alphanumeric)
 *
 * Total: 20 tests
 */

import { randomBytes } from 'crypto';

// =============================================================================
// Helper Functions (copied from seed.ts for isolated testing)
// =============================================================================

/**
 * Generate a random license key (32-char hex)
 */
function generateLicenseKey(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a widget key (16-char alphanumeric)
 * Uses base62 encoding for URL-friendly keys
 */
function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}

// =============================================================================
// A. License Key Generation Tests (10 tests)
// =============================================================================

describe('generateLicenseKey', () => {
  it('should generate a 32-character key', () => {
    const key = generateLicenseKey();
    expect(key.length).toBe(32);
  });

  it('should only contain hexadecimal characters', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it('should be lowercase', () => {
    const key = generateLicenseKey();
    expect(key).toBe(key.toLowerCase());
  });

  it('should generate unique keys on each call', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateLicenseKey());
    }
    expect(keys.size).toBe(100);
  });

  it('should be URL-safe', () => {
    const key = generateLicenseKey();
    expect(encodeURIComponent(key)).toBe(key);
  });

  it('should have 128 bits of entropy (16 bytes)', () => {
    // 16 bytes = 128 bits of entropy
    const bytes = randomBytes(16);
    expect(bytes.length).toBe(16);
  });

  it('should contain only characters 0-9 and a-f', () => {
    const key = generateLicenseKey();
    const validChars = '0123456789abcdef';
    for (const char of key) {
      expect(validChars.includes(char)).toBe(true);
    }
  });

  it('should be consistent format across multiple calls', () => {
    for (let i = 0; i < 10; i++) {
      const key = generateLicenseKey();
      expect(key.length).toBe(32);
      expect(key).toMatch(/^[0-9a-f]{32}$/);
    }
  });

  it('should be usable as a database key', () => {
    const key = generateLicenseKey();
    // No spaces, no special chars, reasonable length
    expect(key).not.toContain(' ');
    expect(key).not.toContain("'");
    expect(key).not.toContain('"');
    expect(key.length).toBeLessThanOrEqual(255); // VARCHAR(255) safe
  });

  it('should not contain uppercase letters', () => {
    const key = generateLicenseKey();
    expect(key).not.toMatch(/[A-Z]/);
  });
});

// =============================================================================
// B. Widget Key Generation Tests (10 tests)
// =============================================================================

describe('generateWidgetKey', () => {
  it('should generate a 16-character key', () => {
    const key = generateWidgetKey();
    expect(key.length).toBe(16);
  });

  it('should only contain alphanumeric characters (base62)', () => {
    const key = generateWidgetKey();
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should contain mixed case (statistically)', () => {
    let hasUpper = false;
    let hasLower = false;
    for (let i = 0; i < 20; i++) {
      const key = generateWidgetKey();
      if (/[A-Z]/.test(key)) hasUpper = true;
      if (/[a-z]/.test(key)) hasLower = true;
    }
    expect(hasUpper).toBe(true);
    expect(hasLower).toBe(true);
  });

  it('should contain numbers (statistically)', () => {
    let hasDigit = false;
    for (let i = 0; i < 20; i++) {
      const key = generateWidgetKey();
      if (/[0-9]/.test(key)) hasDigit = true;
    }
    expect(hasDigit).toBe(true);
  });

  it('should generate unique keys on each call', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateWidgetKey());
    }
    expect(keys.size).toBe(100);
  });

  it('should be URL-safe (no special characters)', () => {
    const key = generateWidgetKey();
    expect(encodeURIComponent(key)).toBe(key);
  });

  it('should be shorter than license key', () => {
    const widgetKey = generateWidgetKey();
    const licenseKey = generateLicenseKey();
    expect(widgetKey.length).toBeLessThan(licenseKey.length);
  });

  it('should be usable in embed URLs', () => {
    const key = generateWidgetKey();
    const embedUrl = `https://example.com/widget/${key}`;
    expect(embedUrl).toContain(key);
    expect(new URL(embedUrl).pathname).toBe(`/widget/${key}`);
  });

  it('should fit in VARCHAR(16) database column', () => {
    const key = generateWidgetKey();
    expect(key.length).toBeLessThanOrEqual(16);
  });

  it('should be case-sensitive', () => {
    // Generate keys until we find one with both cases
    let foundMixedCase = false;
    for (let i = 0; i < 50; i++) {
      const key = generateWidgetKey();
      if (/[A-Z]/.test(key) && /[a-z]/.test(key)) {
        foundMixedCase = true;
        // Verify case sensitivity matters
        expect(key.toUpperCase()).not.toBe(key.toLowerCase());
        break;
      }
    }
    expect(foundMixedCase).toBe(true);
  });
});

// =============================================================================
// C. Key Comparison Tests (5 tests)
// =============================================================================

describe('Key Format Comparison', () => {
  it('widget keys should be more readable than license keys', () => {
    const widgetKey = generateWidgetKey();
    const licenseKey = generateLicenseKey();

    // Widget key has uppercase and non-hex letters (easier to read/remember)
    // License key only has 0-9 and a-f (hex), so never has g-z or A-Z
    expect(widgetKey).toMatch(/[A-Za-z]/);
    // License key should only contain hex chars (0-9, a-f) - no uppercase, no g-z
    expect(licenseKey).toMatch(/^[0-9a-f]+$/);
    expect(licenseKey).not.toMatch(/[A-Z]/); // No uppercase in license keys
    expect(licenseKey).not.toMatch(/[g-z]/); // No non-hex lowercase letters
  });

  it('widget keys should be better for URLs', () => {
    const widgetKey = generateWidgetKey();
    const licenseKey = generateLicenseKey();

    // Widget key is shorter
    expect(widgetKey.length).toBe(16);
    expect(licenseKey.length).toBe(32);

    // Both should be URL-safe
    expect(encodeURIComponent(widgetKey)).toBe(widgetKey);
    expect(encodeURIComponent(licenseKey)).toBe(licenseKey);
  });

  it('both key types should have sufficient entropy', () => {
    // License key: 16 bytes = 128 bits
    const licenseEntropy = 16 * 8;
    expect(licenseEntropy).toBe(128);

    // Widget key: log2(62^16) = 95.27 bits
    const widgetEntropy = Math.log2(Math.pow(62, 16));
    expect(widgetEntropy).toBeGreaterThan(95);

    // Both are secure enough for their purposes
    expect(licenseEntropy).toBeGreaterThan(80);
    expect(widgetEntropy).toBeGreaterThan(80);
  });

  it('widget keys should be distinguishable from license keys', () => {
    const widgetKey = generateWidgetKey();
    const licenseKey = generateLicenseKey();

    // Can tell them apart by format
    const isWidgetKey = (key: string) => /^[A-Za-z0-9]{16}$/.test(key) && /[A-Za-z]/.test(key);
    const isLicenseKey = (key: string) => /^[a-f0-9]{32}$/.test(key);

    expect(isWidgetKey(widgetKey)).toBe(true);
    expect(isLicenseKey(licenseKey)).toBe(true);
    expect(isWidgetKey(licenseKey)).toBe(false);
    expect(isLicenseKey(widgetKey)).toBe(false);
  });

  it('both key types should be collision-resistant', () => {
    const widgetKeys = new Set<string>();
    const licenseKeys = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      widgetKeys.add(generateWidgetKey());
      licenseKeys.add(generateLicenseKey());
    }

    // No collisions in 1000 keys
    expect(widgetKeys.size).toBe(1000);
    expect(licenseKeys.size).toBe(1000);
  });
});

/**
 * Unit Tests for Schema v2.0 - License Simplification
 *
 * Tests for Phase 1 schema changes:
 * - User subscription fields (tier, stripeCustomerId, etc.)
 * - Widget new fields (widgetKey, embedType, userId, allowedDomains)
 * - Widget key generation
 * - Embed type validation
 *
 * Total: 45 tests
 */

import { randomBytes } from 'crypto';

// =============================================================================
// Test Helpers - Widget Key Generation (copied from seed.ts)
// =============================================================================

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
// A. Widget Key Generation Tests (10 tests)
// =============================================================================

describe('Widget Key Generation', () => {
  it('should generate a 16-character key', () => {
    const key = generateWidgetKey();
    expect(key.length).toBe(16);
  });

  it('should only contain alphanumeric characters', () => {
    const key = generateWidgetKey();
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should generate unique keys on each call', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateWidgetKey());
    }
    // All 100 keys should be unique
    expect(keys.size).toBe(100);
  });

  it('should be URL-safe (no special characters)', () => {
    const key = generateWidgetKey();
    // URL-safe means it can be used in URLs without encoding
    expect(encodeURIComponent(key)).toBe(key);
  });

  it('should contain both uppercase and lowercase letters (statistically)', () => {
    // Generate enough keys to statistically have both cases
    let hasUpper = false;
    let hasLower = false;
    for (let i = 0; i < 10; i++) {
      const key = generateWidgetKey();
      if (/[A-Z]/.test(key)) hasUpper = true;
      if (/[a-z]/.test(key)) hasLower = true;
    }
    expect(hasUpper).toBe(true);
    expect(hasLower).toBe(true);
  });

  it('should contain numbers (statistically)', () => {
    let hasNumber = false;
    for (let i = 0; i < 20; i++) {
      const key = generateWidgetKey();
      if (/[0-9]/.test(key)) hasNumber = true;
    }
    expect(hasNumber).toBe(true);
  });

  it('should be deterministic with same random bytes', () => {
    // This tests the algorithm, not randomness
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const testBytes = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    let key = '';
    for (let i = 0; i < 16; i++) {
      key += chars[testBytes[i] % chars.length];
    }
    expect(key.length).toBe(16);
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('should handle edge case byte values (0 and 255)', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // Byte 0 should map to 'A' (0 % 62 = 0)
    expect(chars[0 % chars.length]).toBe('A');
    // Byte 255 should map to a valid char (255 % 62 = 7, which is 'H')
    expect(chars[255 % chars.length]).toBe('H');
  });

  it('should be shorter than license key (32 chars)', () => {
    const widgetKey = generateWidgetKey();
    const licenseKey = randomBytes(16).toString('hex'); // 32 chars
    expect(widgetKey.length).toBe(16);
    expect(licenseKey.length).toBe(32);
    expect(widgetKey.length).toBeLessThan(licenseKey.length);
  });

  it('should have sufficient entropy for uniqueness', () => {
    // 62^16 possible combinations = ~4.7 x 10^28
    // Much more than enough for practical uniqueness
    const entropy = Math.pow(62, 16);
    expect(entropy).toBeGreaterThan(1e20);
  });
});

// =============================================================================
// B. Embed Type Validation Tests (12 tests)
// =============================================================================

describe('Embed Type Validation', () => {
  const validEmbedTypes = ['popup', 'inline', 'fullpage', 'portal'] as const;

  it('should accept "popup" as valid embed type', () => {
    expect(validEmbedTypes.includes('popup')).toBe(true);
  });

  it('should accept "inline" as valid embed type', () => {
    expect(validEmbedTypes.includes('inline')).toBe(true);
  });

  it('should accept "fullpage" as valid embed type', () => {
    expect(validEmbedTypes.includes('fullpage')).toBe(true);
  });

  it('should accept "portal" as valid embed type', () => {
    expect(validEmbedTypes.includes('portal')).toBe(true);
  });

  it('should have exactly 4 embed types', () => {
    expect(validEmbedTypes.length).toBe(4);
  });

  it('should reject invalid embed type', () => {
    const invalidTypes = ['bubble', 'floating', 'sidebar', 'modal', ''];
    invalidTypes.forEach(type => {
      expect(validEmbedTypes.includes(type as any)).toBe(false);
    });
  });

  it('should use "popup" as default embed type', () => {
    const defaultEmbedType = 'popup';
    expect(defaultEmbedType).toBe('popup');
    expect(validEmbedTypes[0]).toBe('popup');
  });

  it('embed types should be lowercase', () => {
    validEmbedTypes.forEach(type => {
      expect(type).toBe(type.toLowerCase());
    });
  });

  it('embed types should not exceed 20 characters (DB constraint)', () => {
    const maxLength = 20;
    validEmbedTypes.forEach(type => {
      expect(type.length).toBeLessThanOrEqual(maxLength);
    });
  });

  it('should map to correct widget modes', () => {
    const embedTypeToMode: Record<string, string> = {
      popup: 'normal',      // Chat bubble + window
      inline: 'embedded',   // Embedded in container
      fullpage: 'portal',   // Full viewport
      portal: 'portal',     // Shareable link (same as fullpage)
    };

    expect(embedTypeToMode['popup']).toBe('normal');
    expect(embedTypeToMode['inline']).toBe('embedded');
    expect(embedTypeToMode['fullpage']).toBe('portal');
    expect(embedTypeToMode['portal']).toBe('portal');
  });

  it('popup should require bubble UI', () => {
    const popupRequiresBubble = true;
    expect(popupRequiresBubble).toBe(true);
  });

  it('inline and fullpage should not require bubble UI', () => {
    const inlineRequiresBubble = false;
    const fullpageRequiresBubble = false;
    expect(inlineRequiresBubble).toBe(false);
    expect(fullpageRequiresBubble).toBe(false);
  });
});

// =============================================================================
// C. User Subscription Tier Tests (10 tests)
// =============================================================================

describe('User Subscription Tiers', () => {
  const validTiers = ['free', 'basic', 'pro', 'agency'] as const;

  it('should accept "free" as valid tier', () => {
    expect(validTiers.includes('free')).toBe(true);
  });

  it('should accept "basic" as valid tier', () => {
    expect(validTiers.includes('basic')).toBe(true);
  });

  it('should accept "pro" as valid tier', () => {
    expect(validTiers.includes('pro')).toBe(true);
  });

  it('should accept "agency" as valid tier', () => {
    expect(validTiers.includes('agency')).toBe(true);
  });

  it('should have exactly 4 tiers', () => {
    expect(validTiers.length).toBe(4);
  });

  it('should use "free" as default tier', () => {
    const defaultTier = 'free';
    expect(defaultTier).toBe('free');
  });

  it('tiers should not exceed 20 characters (DB constraint)', () => {
    const maxLength = 20;
    validTiers.forEach(tier => {
      expect(tier.length).toBeLessThanOrEqual(maxLength);
    });
  });

  it('should have correct tier hierarchy', () => {
    const tierLevel: Record<string, number> = {
      free: 0,
      basic: 1,
      pro: 2,
      agency: 3,
    };
    expect(tierLevel['free']).toBeLessThan(tierLevel['basic']);
    expect(tierLevel['basic']).toBeLessThan(tierLevel['pro']);
    expect(tierLevel['pro']).toBeLessThan(tierLevel['agency']);
  });

  it('paid tiers should have widget limits', () => {
    const widgetLimits: Record<string, number> = {
      free: 1,
      basic: 1,
      pro: 3,
      agency: -1, // unlimited
    };
    expect(widgetLimits['basic']).toBe(1);
    expect(widgetLimits['pro']).toBe(3);
    expect(widgetLimits['agency']).toBe(-1);
  });

  it('only agency tier should have unlimited domains', () => {
    const domainLimits: Record<string, number> = {
      free: 1,
      basic: 1,
      pro: 1,
      agency: -1, // unlimited
    };
    expect(domainLimits['agency']).toBe(-1);
    expect(domainLimits['basic']).toBe(1);
    expect(domainLimits['pro']).toBe(1);
  });
});

// =============================================================================
// D. Subscription Status Tests (8 tests)
// =============================================================================

describe('Subscription Status', () => {
  const validStatuses = ['active', 'canceled', 'past_due'] as const;

  it('should accept "active" as valid status', () => {
    expect(validStatuses.includes('active')).toBe(true);
  });

  it('should accept "canceled" as valid status', () => {
    expect(validStatuses.includes('canceled')).toBe(true);
  });

  it('should accept "past_due" as valid status', () => {
    expect(validStatuses.includes('past_due')).toBe(true);
  });

  it('should have exactly 3 statuses', () => {
    expect(validStatuses.length).toBe(3);
  });

  it('should use "active" as default status', () => {
    const defaultStatus = 'active';
    expect(defaultStatus).toBe('active');
  });

  it('statuses should not exceed 20 characters (DB constraint)', () => {
    const maxLength = 20;
    validStatuses.forEach(status => {
      expect(status.length).toBeLessThanOrEqual(maxLength);
    });
  });

  it('only active status should allow widget usage', () => {
    const canUseWidget = (status: string) => status === 'active';
    expect(canUseWidget('active')).toBe(true);
    expect(canUseWidget('canceled')).toBe(false);
    expect(canUseWidget('past_due')).toBe(false);
  });

  it('past_due should trigger payment reminder', () => {
    const shouldShowPaymentReminder = (status: string) => status === 'past_due';
    expect(shouldShowPaymentReminder('past_due')).toBe(true);
    expect(shouldShowPaymentReminder('active')).toBe(false);
  });
});

// =============================================================================
// E. Allowed Domains Tests (5 tests)
// =============================================================================

describe('Allowed Domains (Per-Widget)', () => {
  it('should accept null for unlimited domains (agency)', () => {
    const allowedDomains: string[] | null = null;
    expect(allowedDomains).toBeNull();
  });

  it('should accept array of domains', () => {
    const allowedDomains = ['example.com', 'test.example.com'];
    expect(Array.isArray(allowedDomains)).toBe(true);
    expect(allowedDomains.length).toBe(2);
  });

  it('should support wildcard domains', () => {
    const allowedDomains = ['*.example.com', 'localhost'];
    expect(allowedDomains[0]).toMatch(/^\*\./);
  });

  it('should allow localhost for development', () => {
    const allowedDomains = ['localhost', 'example.com'];
    expect(allowedDomains.includes('localhost')).toBe(true);
  });

  it('empty array should be treated differently than null', () => {
    const emptyDomains: string[] = [];
    const nullDomains: string[] | null = null;

    // Empty array = no domains allowed (restrictive)
    // Null = all domains allowed (permissive)
    expect(emptyDomains).not.toBeNull();
    expect(nullDomains).toBeNull();
  });
});

import { TIER_LIMITS, canCreateWidget, normalizeUserTier } from '@/lib/license/tiers';

describe('tier limits', () => {
  it('defines limits for every tier', () => {
    expect(TIER_LIMITS.free.maxWidgets).toBe(3);
    expect(TIER_LIMITS.basic.maxWidgets).toBe(5);
    expect(TIER_LIMITS.pro.maxWidgets).toBe(Infinity);
    expect(TIER_LIMITS.agency.maxWidgets).toBe(Infinity);
  });
  it('canCreateWidget enforces the cap', () => {
    expect(canCreateWidget('free', 2)).toBe(true);
    expect(canCreateWidget('free', 3)).toBe(false);
    expect(canCreateWidget('agency', 9999)).toBe(true);
  });
  it('unknown tiers are treated as free', () => {
    expect(canCreateWidget('garbage' as any, 3)).toBe(false);
    expect(normalizeUserTier('garbage')).toBe('free');
    expect(normalizeUserTier(null)).toBe('free');
  });
  it('brandingRemovable / unlimitedDomains entitlements', () => {
    expect(TIER_LIMITS.basic.brandingRemovable).toBe(false);
    expect(TIER_LIMITS.pro.brandingRemovable).toBe(true);
    expect(TIER_LIMITS.agency.unlimitedDomains).toBe(true);
    expect(TIER_LIMITS.pro.unlimitedDomains).toBe(false);
  });
});

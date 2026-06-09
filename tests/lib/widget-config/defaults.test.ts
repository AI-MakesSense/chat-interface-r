import { createDefaultConfig } from '@/lib/widget-config/defaults';
import { createTierAwareSchema } from '@/lib/widget-config/schema';
import { displayWidgetConfigSchema } from '@/lib/validation/display-widget-schema';

describe('createDefaultConfig', () => {
  it('basic tier defaults have branding enabled and no premium features', () => {
    const cfg = createDefaultConfig('basic', 'chat');
    expect(cfg.branding.brandingEnabled).toBe(true);
    expect(cfg.advancedStyling.enabled).toBe(false);
    expect(cfg.features.emailTranscript).toBe(false);
    expect(cfg.features.ratingPrompt).toBe(false);
  });

  it('pro tier defaults are white-label with premium features', () => {
    const cfg = createDefaultConfig('pro', 'chat');
    expect(cfg.branding.brandingEnabled).toBe(false);
    expect(cfg.advancedStyling.enabled).toBe(true);
    expect(cfg.features.emailTranscript).toBe(true);
    expect(cfg.features.ratingPrompt).toBe(true);
  });

  it('free maps to basic', () => {
    expect(createDefaultConfig('free', 'chat')).toEqual(createDefaultConfig('basic', 'chat'));
  });

  it('every tier default validates against its own tier schema', () => {
    for (const tier of ['basic', 'pro', 'agency'] as const) {
      const schema = createTierAwareSchema(tier, tier === 'basic');
      expect(schema.safeParse(createDefaultConfig(tier, 'chat')).success).toBe(true);
    }
  });

  it('throws on an invalid tier', () => {
    expect(() => createDefaultConfig('garbage' as any, 'chat')).toThrow();
  });

  it('display defaults carry the kind discriminant and validate against the display schema', () => {
    const d = createDefaultConfig('basic', 'display');
    expect(d.kind).toBe('display');
    // Zod object schemas strip unknown keys (like the extra `kind` discriminant)
    // rather than rejecting them, so the full object safeParses successfully.
    expect(displayWidgetConfigSchema.safeParse(d).success).toBe(true);
    expect(d.branding.brandingEnabled).toBe(true);

    const pro = createDefaultConfig('pro', 'display');
    expect(pro.branding.brandingEnabled).toBe(false);
  });

  it('returns isolated objects — mutating one default does not affect the next', () => {
    const a = createDefaultConfig('pro', 'chat');
    const b = createDefaultConfig('pro', 'chat');
    a.branding.companyName = 'Mutated Corp';
    expect(b.branding.companyName).toBe('My Company');
  });
});

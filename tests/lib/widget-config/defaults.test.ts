import { createDefaultConfig } from '@/lib/widget-config/defaults';
import { createTierAwareSchema } from '@/lib/widget-config/schema';

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
});

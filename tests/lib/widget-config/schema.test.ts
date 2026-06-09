import {
  chatWidgetConfigSchema,
  createTierAwareSchema,
  CONFIG_SCHEMA_VERSION,
} from '@/lib/widget-config/schema';

describe('canonical chat widget config schema', () => {
  it('parse({}) yields a complete config with defaults', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
    expect(cfg.kind).toBe('chat');
    expect(cfg.theme.colors.primary).toBe('#4F46E5');
    expect(cfg.branding.companyName).toBe('My Company');
    expect(cfg.connection.webhookUrl).toBe('');
    expect(cfg.startScreen.starterPrompts).toEqual([]);
    expect(cfg.composer.placeholder).toBe('Type your message...');
  });

  it('rejects invalid hex colors', () => {
    const result = chatWidgetConfigSchema.safeParse({
      theme: { colors: { primary: 'red' } },
    });
    expect(result.success).toBe(false);
  });

  it('basic tier cannot disable branding', () => {
    const schema = createTierAwareSchema('basic', true);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.branding.brandingEnabled = false;
    const result = schema.safeParse(cfg);
    expect(result.success).toBe(false);
  });

  it('pro tier can disable branding', () => {
    const schema = createTierAwareSchema('pro', false);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.branding.brandingEnabled = false;
    expect(schema.safeParse(cfg).success).toBe(true);
  });
});

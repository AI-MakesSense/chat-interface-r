import {
  chatWidgetConfigSchema,
  createTierAwareSchema,
  getSchemaForKind,
  normalizeTier,
  displayWidgetConfigSchema,
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

describe('playground/chatkit canonical sections (Task 4a)', () => {
  it('parse({}) includes colorSystem with store-matching defaults', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.colorSystem.useAccent).toBe(true);
    expect(cfg.colorSystem.accentColor).toBe('#0ea5e9');
    expect(cfg.colorSystem.useTintedGrayscale).toBe(false);
    expect(cfg.colorSystem.tintHue).toBe(220);
    expect(cfg.colorSystem.tintLevel).toBe(10);
    expect(cfg.colorSystem.shadeLevel).toBe(10);
    expect(cfg.colorSystem.useCustomSurfaceColors).toBe(false);
    expect(cfg.colorSystem.surfaceBackgroundColor).toBe('#ffffff');
    expect(cfg.colorSystem.surfaceForegroundColor).toBe('#f8fafc');
    expect(cfg.colorSystem.useCustomTextColor).toBe(false);
    expect(cfg.colorSystem.customTextColor).toBe('#1e293b');
    expect(cfg.colorSystem.useCustomIconColor).toBe(false);
    expect(cfg.colorSystem.customIconColor).toBe('#64748b');
    expect(cfg.colorSystem.useCustomUserMessageColors).toBe(false);
    expect(cfg.colorSystem.customUserMessageTextColor).toBe('#ffffff');
    expect(cfg.colorSystem.customUserMessageBackgroundColor).toBe('#0ea5e9');
  });

  it('parse({}) includes chatkit section with store-matching defaults', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.chatkit.grayscaleHue).toBe(220);
    expect(cfg.chatkit.grayscaleTint).toBe(6);
    expect(cfg.chatkit.grayscaleShade).toBe(-1);
    expect(cfg.chatkit.accentPrimary).toBe('#0f172a');
    expect(cfg.chatkit.accentLevel).toBe(1);
    expect(cfg.chatkit.enableModelPicker).toBe(false);
  });

  it('parse({}) includes new theme style fields with store-matching defaults', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.theme.radius).toBe('medium');
    expect(cfg.theme.density).toBe('normal');
    expect(cfg.theme.typography.useCustomFont).toBe(false);
    expect(cfg.theme.typography.customFontName).toBe('');
    expect(cfg.theme.typography.customFontCss).toBe('');
    expect(cfg.theme.size.inlineWidth).toBe(400);
    expect(cfg.theme.size.inlineHeight).toBe(600);
  });

  it('parse({}) includes features.pdfLightbox and advanced.customCss', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.features.pdfLightbox).toBe(false);
    expect(cfg.advanced.customCss).toBe('');
  });

  it('parse({}) includes chatkit connection credentials as empty strings', () => {
    const cfg = chatWidgetConfigSchema.parse({});
    expect(cfg.connection.workflowId).toBe('');
    expect(cfg.connection.apiKey).toBe('');
  });

  it('rejects invalid colorSystem hex colors and out-of-range chatkit values', () => {
    expect(chatWidgetConfigSchema.safeParse({ colorSystem: { accentColor: 'red' } }).success).toBe(false);
    expect(chatWidgetConfigSchema.safeParse({ chatkit: { accentLevel: 5 } }).success).toBe(false);
    expect(chatWidgetConfigSchema.safeParse({ chatkit: { grayscaleShade: -9 } }).success).toBe(false);
    expect(chatWidgetConfigSchema.safeParse({ colorSystem: { tintHue: 999 } }).success).toBe(false);
  });

  it('new sections are isolated between parses', () => {
    const a = chatWidgetConfigSchema.parse({});
    const b = chatWidgetConfigSchema.parse({});
    expect(a.colorSystem).not.toBe(b.colorSystem);
    expect(a.chatkit).not.toBe(b.chatkit);
    expect(a.advanced).not.toBe(b.advanced);
    a.colorSystem.accentColor = '#000000';
    a.chatkit.accentLevel = 3;
    a.advanced.customCss = '.x{}';
    expect(b.colorSystem.accentColor).toBe('#0ea5e9');
    expect(b.chatkit.accentLevel).toBe(1);
    expect(b.advanced.customCss).toBe('');
  });
});

describe('default value isolation between parses', () => {
  it('each parse({}) yields distinct nested object and array instances', () => {
    const a = chatWidgetConfigSchema.parse({});
    const b = chatWidgetConfigSchema.parse({});
    expect(a.theme.colors).not.toBe(b.theme.colors);
    expect(a.startScreen.starterPrompts).not.toBe(b.startScreen.starterPrompts);
    expect(a.theme.darkOverride).not.toBe(b.theme.darkOverride);
    expect(a.theme.position).not.toBe(b.theme.position);
    expect(a.theme.size).not.toBe(b.theme.size);
    expect(a.theme.typography).not.toBe(b.theme.typography);
    expect(a.advancedStyling.messages).not.toBe(b.advancedStyling.messages);
    expect(a.advancedStyling.markdown).not.toBe(b.advancedStyling.markdown);
    expect(a.features.attachments.allowedExtensions).not.toBe(b.features.attachments.allowedExtensions);
  });

  it('mutating one parsed config does not affect another', () => {
    const a = chatWidgetConfigSchema.parse({});
    const b = chatWidgetConfigSchema.parse({});
    a.theme.colors.primary = '#000000';
    expect(b.theme.colors.primary).toBe('#4F46E5');
    a.startScreen.starterPrompts.push({ label: 'Hi', icon: 'wave' });
    expect(b.startScreen.starterPrompts).toEqual([]);
  });
});

describe('cross-tier constraints', () => {
  it('custom launcher icon without URL fails for pro tier too', () => {
    const schema = createTierAwareSchema('pro', false);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.branding.launcherIcon = 'custom';
    cfg.branding.customLauncherIconUrl = null;
    const result = schema.safeParse(cfg);
    expect(result.success).toBe(false);
  });

  it('showAvatar without avatarUrl fails when advanced styling is enabled', () => {
    const schema = createTierAwareSchema('agency', false);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.advancedStyling.enabled = true;
    cfg.advancedStyling.messages.showAvatar = true;
    cfg.advancedStyling.messages.avatarUrl = null;
    const result = schema.safeParse(cfg);
    expect(result.success).toBe(false);
  });
});

describe('normalizeTier', () => {
  it('collapses invalid values to basic', () => {
    expect(normalizeTier('free')).toBe('basic');
    expect(normalizeTier(null)).toBe('basic');
    expect(normalizeTier(undefined)).toBe('basic');
    expect(normalizeTier('garbage')).toBe('basic');
  });

  it('passes valid tiers through', () => {
    expect(normalizeTier('basic')).toBe('basic');
    expect(normalizeTier('pro')).toBe('pro');
    expect(normalizeTier('agency')).toBe('agency');
  });
});

describe('getSchemaForKind', () => {
  it('chat kind returns a schema that enforces tier rules', () => {
    const schema = getSchemaForKind('chat', 'basic', true);
    const cfg = chatWidgetConfigSchema.parse({});
    cfg.branding.brandingEnabled = false;
    expect(schema.safeParse(cfg).success).toBe(false);
    const valid = chatWidgetConfigSchema.parse({});
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('display kind returns the display schema', () => {
    const schema = getSchemaForKind('display', 'basic', true);
    expect(schema).toBe(displayWidgetConfigSchema);
    // display schema has required fields — empty object is invalid
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('unknown kind throws', () => {
    expect(() =>
      getSchemaForKind('banner' as unknown as 'chat', 'basic', true)
    ).toThrow('Unknown widget kind: banner');
  });
});

describe('URL localhost validation', () => {
  it('rejects http URLs that merely contain "localhost" in the path', () => {
    const result = chatWidgetConfigSchema.safeParse({
      connection: { webhookUrl: 'http://evil.com/localhost/x' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts genuine localhost and 127.0.0.1 webhook URLs', () => {
    expect(
      chatWidgetConfigSchema.safeParse({
        connection: { webhookUrl: 'http://localhost:5678/webhook/abc' },
      }).success
    ).toBe(true);
    expect(
      chatWidgetConfigSchema.safeParse({
        connection: { webhookUrl: 'http://127.0.0.1:5678/webhook/abc' },
      }).success
    ).toBe(true);
  });

  it('accepts https webhook URLs and empty string', () => {
    expect(
      chatWidgetConfigSchema.safeParse({
        connection: { webhookUrl: 'https://n8n.example.com/webhook/abc' },
      }).success
    ).toBe(true);
    expect(
      chatWidgetConfigSchema.safeParse({ connection: { webhookUrl: '' } }).success
    ).toBe(true);
  });

  it('rejects http URLs for logoUrl when localhost only appears in the path', () => {
    const result = chatWidgetConfigSchema.safeParse({
      branding: { logoUrl: 'http://evil.com/localhost/logo.png' },
    });
    expect(result.success).toBe(false);
  });
});

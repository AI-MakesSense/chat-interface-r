import { migrateConfig } from '@/lib/widget-config/migrate';
import { CONFIG_SCHEMA_VERSION } from '@/lib/widget-config/schema';

describe('migrateConfig', () => {
  it('passes through a v2 config unchanged (idempotent)', () => {
    const v2 = migrateConfig({});
    expect(migrateConfig(v2)).toEqual(v2);
  });

  it('migrates legacy store shape (style.*)', () => {
    const out = migrateConfig({
      branding: { companyName: 'Acme' },
      style: { theme: 'dark', primaryColor: '#00BFFF', backgroundColor: '#101010', textColor: '#EEEEEE', position: 'bottom-left', cornerRadius: 8 },
      typography: { fontFamily: 'Inter', fontSize: 16 },
      features: { fileAttachments: true, allowedExtensions: ['.pdf'], maxFileSize: 5 },
      connection: { webhookUrl: 'https://n8n.example.com/webhook/x', routeParam: 'general' },
    });
    expect(out.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
    expect(out.branding.companyName).toBe('Acme');
    expect(out.theme.mode).toBe('dark');
    expect(out.theme.colors.primary).toBe('#00BFFF');
    expect(out.theme.colors.userMessage).toBe('#00BFFF');
    expect(out.theme.colors.background).toBe('#101010');
    expect(out.theme.position.position).toBe('bottom-left');
    expect(out.theme.cornerRadius).toBe(8);
    expect(out.theme.typography.fontFamily).toBe('Inter');
    expect(out.features.attachments.enabled).toBe(true);
    expect(out.features.attachments.maxFileSizeMB).toBe(5);
    expect(out.connection.webhookUrl).toBe('https://n8n.example.com/webhook/x');
    expect(out.connection.route).toBe('general');
  });

  it('migrates playground flat fields', () => {
    const out = migrateConfig({
      themeMode: 'dark',
      accentColor: '#FF5733',
      greeting: 'Hi there',
      starterPrompts: [{ label: 'Pricing', icon: 'tag' }],
      placeholder: 'Ask me anything',
      n8nWebhookUrl: 'https://n8n.example.com/webhook/y',
    });
    expect(out.theme.mode).toBe('dark');
    expect(out.theme.colors.primary).toBe('#FF5733');
    expect(out.startScreen.greeting).toBe('Hi there');
    expect(out.startScreen.starterPrompts).toHaveLength(1);
    expect(out.composer.placeholder).toBe('Ask me anything');
    expect(out.connection.webhookUrl).toBe('https://n8n.example.com/webhook/y');
  });

  it('maps flat playground color-system fields into colorSystem (Task 4a)', () => {
    const out = migrateConfig({
      useAccent: false,
      accentColor: '#22d3ee',
      useTintedGrayscale: true,
      tintHue: 30,
      tintLevel: 12,
      shadeLevel: 8,
      useCustomSurfaceColors: true,
      surfaceBackgroundColor: '#101010',
      surfaceForegroundColor: '#202020',
      useCustomTextColor: true,
      customTextColor: '#abcdef',
      useCustomIconColor: true,
      customIconColor: '#fedcba',
      useCustomUserMessageColors: true,
      customUserMessageTextColor: '#111111',
      customUserMessageBackgroundColor: '#222222',
    });
    expect(out.colorSystem.useAccent).toBe(false);
    expect(out.colorSystem.accentColor).toBe('#22d3ee');
    // existing mirror to theme.colors.primary stays
    expect(out.theme.colors.primary).toBe('#22d3ee');
    expect(out.theme.colors.userMessage).toBe('#22d3ee');
    expect(out.colorSystem.useTintedGrayscale).toBe(true);
    expect(out.colorSystem.tintHue).toBe(30);
    expect(out.colorSystem.tintLevel).toBe(12);
    expect(out.colorSystem.shadeLevel).toBe(8);
    expect(out.colorSystem.useCustomSurfaceColors).toBe(true);
    expect(out.colorSystem.surfaceBackgroundColor).toBe('#101010');
    expect(out.colorSystem.surfaceForegroundColor).toBe('#202020');
    expect(out.colorSystem.useCustomTextColor).toBe(true);
    expect(out.colorSystem.customTextColor).toBe('#abcdef');
    expect(out.colorSystem.useCustomIconColor).toBe(true);
    expect(out.colorSystem.customIconColor).toBe('#fedcba');
    expect(out.colorSystem.useCustomUserMessageColors).toBe(true);
    expect(out.colorSystem.customUserMessageTextColor).toBe('#111111');
    expect(out.colorSystem.customUserMessageBackgroundColor).toBe('#222222');
  });

  it('flat accentColor does NOT flip useAccent on (flag is independent in the UI)', () => {
    const out = migrateConfig({ accentColor: '#22d3ee' });
    expect(out.colorSystem.accentColor).toBe('#22d3ee');
    expect(out.colorSystem.useAccent).toBe(true); // schema default, not forced
    const out2 = migrateConfig({ accentColor: '#22d3ee', useAccent: false });
    expect(out2.colorSystem.useAccent).toBe(false);
  });

  it('maps flat style/typography/size fields into theme (Task 4a)', () => {
    const out = migrateConfig({
      radius: 'pill',
      density: 'compact',
      useCustomFont: true,
      customFontName: 'Geist',
      customFontCss: '@font-face { font-family: Geist; src: url(https://x.com/g.woff2); }',
      inlineWidth: 500,
      inlineHeight: 700,
    });
    expect(out.theme.radius).toBe('pill');
    expect(out.theme.density).toBe('compact');
    expect(out.theme.typography.useCustomFont).toBe(true);
    expect(out.theme.typography.customFontName).toBe('Geist');
    expect(out.theme.typography.customFontCss).toContain('font-family: Geist');
    expect(out.theme.size.inlineWidth).toBe(500);
    expect(out.theme.size.inlineHeight).toBe(700);
  });

  it('maps flat chatkit*/enableModelPicker into chatkit section (Task 4a)', () => {
    const out = migrateConfig({
      chatkitGrayscaleHue: 200,
      chatkitGrayscaleTint: 3,
      chatkitGrayscaleShade: -2,
      chatkitAccentPrimary: '#111111',
      chatkitAccentLevel: 2,
      enableModelPicker: true,
    });
    expect(out.chatkit.grayscaleHue).toBe(200);
    expect(out.chatkit.grayscaleTint).toBe(3);
    expect(out.chatkit.grayscaleShade).toBe(-2);
    expect(out.chatkit.accentPrimary).toBe('#111111');
    expect(out.chatkit.accentLevel).toBe(2);
    expect(out.chatkit.enableModelPicker).toBe(true);
  });

  it('maps enablePdfLightbox and customCss into features/advanced (Task 4a)', () => {
    const out = migrateConfig({
      enablePdfLightbox: true,
      customCss: '.widget { color: red; }',
    });
    expect(out.features.pdfLightbox).toBe(true);
    expect(out.advanced.customCss).toBe('.widget { color: red; }');
  });

  it('legacy advanced.customCss survives; canonical advanced.customCss beats flat customCss (Task 4a)', () => {
    const legacy = migrateConfig({ advanced: { customCss: '.a{}', customJs: 'alert(1)' } });
    expect(legacy.advanced.customCss).toBe('.a{}');
    expect('customJs' in (legacy.advanced as Record<string, unknown>)).toBe(false); // dropped — XSS surface

    const both = migrateConfig({ customCss: '.flat{}', advanced: { customCss: '.canonical{}' } });
    expect(both.advanced.customCss).toBe('.canonical{}');
  });

  it('explicit colorSystem.accentColor beats flat accentColor (canonical > playground)', () => {
    const out = migrateConfig({
      accentColor: '#22d3ee',
      colorSystem: { accentColor: '#111111' },
    });
    expect(out.colorSystem.accentColor).toBe('#111111');
  });

  it('explicit canonical homes beat flat keys for chatkit/theme fields (canonical > playground)', () => {
    const out = migrateConfig({
      chatkitAccentLevel: 3,
      chatkit: { accentLevel: 0 },
      radius: 'pill',
      theme: { radius: 'none' },
      enablePdfLightbox: true,
      features: { pdfLightbox: false },
    });
    expect(out.chatkit.accentLevel).toBe(0);
    expect(out.theme.radius).toBe('none');
    expect(out.features.pdfLightbox).toBe(false);
  });

  it('structured connection.workflowId/apiKey survive migration (ChatKit credentials not stripped)', () => {
    const out = migrateConfig({
      connection: { provider: 'chatkit', workflowId: 'wf_123', apiKey: 'sk-test-abc' },
    });
    expect(out.connection.provider).toBe('chatkit');
    expect(out.connection.workflowId).toBe('wf_123');
    expect(out.connection.apiKey).toBe('sk-test-abc');
  });

  it('maps legacy flat agentKitWorkflowId/agentKitApiKey into connection (Task 4a follow-up)', () => {
    const out = migrateConfig({
      agentKitWorkflowId: 'wf_legacy',
      agentKitApiKey: 'sk-legacy',
    });
    expect(out.connection.workflowId).toBe('wf_legacy');
    expect(out.connection.apiKey).toBe('sk-legacy');
  });

  it('structured connection credentials beat legacy flat agentKit* keys (canonical > flat)', () => {
    const out = migrateConfig({
      agentKitWorkflowId: 'wf_legacy',
      agentKitApiKey: 'sk-legacy',
      connection: { workflowId: 'wf_canonical', apiKey: 'sk-canonical' },
    });
    expect(out.connection.workflowId).toBe('wf_canonical');
    expect(out.connection.apiKey).toBe('sk-canonical');
  });

  it('is idempotent on configs containing the new flat playground fields', () => {
    const once = migrateConfig({ radius: 'pill', chatkitAccentLevel: 2, customCss: '.x{}', useAccent: false });
    expect(migrateConfig(once)).toEqual(once);
  });

  it('explicit zero for flat shadeLevel/tintLevel survives migration (falsy-zero guard)', () => {
    const out = migrateConfig({ shadeLevel: 0, tintLevel: 0 });
    expect(out.colorSystem.shadeLevel).toBe(0);
    expect(out.colorSystem.tintLevel).toBe(0);
  });

  it('is idempotent on configs carrying chatkit connection credentials', () => {
    const once = migrateConfig({
      connection: { provider: 'chatkit', workflowId: 'wf_123', apiKey: 'sk-test' },
    });
    expect(once.connection.apiKey).toBe('sk-test');
    expect(migrateConfig(once)).toEqual(once);
  });

  it('falls back to defaults for unparseable garbage', () => {
    const out = migrateConfig({ theme: { colors: { primary: 'not-a-color' } } });
    expect(out.theme.colors.primary).toBe('#4F46E5'); // default wins over invalid
    expect(out.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
  });

  it('strips legacy top-level style key from output', () => {
    const out = migrateConfig({
      style: { primaryColor: '#FF0000' },
    }) as Record<string, unknown>;
    expect('style' in out).toBe(false);
  });

  it('strips legacy fileAttachments key from output features section', () => {
    const out = migrateConfig({
      features: { fileAttachments: true, maxFileSize: 5 },
    });
    expect('fileAttachments' in out.features).toBe(false);
    expect('maxFileSize' in out.features).toBe(false);
    expect(out.features.attachments.enabled).toBe(true);
    expect(out.features.attachments.maxFileSizeMB).toBe(5);
  });

  it('is idempotent on the migrated store shape output', () => {
    const once = migrateConfig({
      style: { primaryColor: '#123456', theme: 'dark' },
      connection: { webhookUrl: 'https://n8n.example.com/webhook/z', routeParam: 'q' },
    });
    const twice = migrateConfig(once);
    expect(twice).toEqual(once);
  });

  it('repairs invalid leaves in a v2-tagged config (no validation bypass)', () => {
    const out = migrateConfig({ schemaVersion: 2, theme: { colors: { primary: 'not-a-color' } } });
    expect(out.theme.colors.primary).toBe('#4F46E5');
  });

  it('fills out a bare v2-tagged blob to a complete config', () => {
    const out = migrateConfig({ schemaVersion: 2 });
    expect(out.theme.colors.primary).toBeDefined();
    expect(out.branding).toBeDefined();
    expect(out.advancedStyling).toBeDefined();
    expect(out.behavior).toBeDefined();
    expect(out.connection).toBeDefined();
    expect(out.features).toBeDefined();
    expect(out.startScreen).toBeDefined();
    expect(out.composer).toBeDefined();
    expect(out.kind).toBe('chat');
  });

  it('is idempotent on a v2 config containing darkOverride.colors: {}', () => {
    const v2 = migrateConfig({});
    // Force the shape a single Zod parse would inflate on the next pass
    v2.theme.darkOverride.colors = {};
    const once = migrateConfig(v2);
    const twice = migrateConfig(once);
    expect(twice).toEqual(once);
  });

  it('migrates an already-structured config without schemaVersion, preserving values', () => {
    const out = migrateConfig({
      branding: { companyName: 'Structured Co' },
      theme: { colors: { primary: '#ABCDEF' } },
      connection: { webhookUrl: 'https://n8n.example.com/webhook/s' },
    });
    expect(out.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
    expect(out.branding.companyName).toBe('Structured Co');
    expect(out.theme.colors.primary).toBe('#ABCDEF');
    expect(out.connection.webhookUrl).toBe('https://n8n.example.com/webhook/s');
    // missing sections are filled with defaults
    expect(out.startScreen).toBeDefined();
    expect(out.composer).toBeDefined();
  });

  it('handles null/undefined gracefully', () => {
    expect(() => migrateConfig(null)).not.toThrow();
    expect(() => migrateConfig(undefined)).not.toThrow();
    const out = migrateConfig(null);
    expect(out.schemaVersion).toBe(CONFIG_SCHEMA_VERSION);
  });

  // C-01: leaf-level repair preserves valid sibling data
  it('preserves valid sibling leaves when one leaf fails (C-01)', () => {
    const out = migrateConfig({
      schemaVersion: 2,
      branding: { companyName: 'Acme Corp', logoUrl: 'javascript:alert(1)' },
    });
    expect(out.branding.companyName).toBe('Acme Corp');
    expect(out.branding.logoUrl).toBeNull();
  });

  // C-02: invalid enum in style section doesn't poison valid hex in same section
  it('preserves primaryColor when style.theme is an invalid enum value (C-02)', () => {
    const out = migrateConfig({
      style: { theme: 'system', primaryColor: '#FF0000' },
    });
    expect(out.theme.colors.primary).toBe('#FF0000');
    expect(out.theme.mode).toBe('light'); // 'system' is invalid → default
  });

  // C-03: canonical keys win over legacy flat keys
  it('canonical features.attachments wins over legacy fileAttachments (C-03)', () => {
    const out = migrateConfig({
      features: {
        fileAttachments: true,
        attachments: { enabled: false, maxFileSizeMB: 20 },
      },
    });
    expect(out.features.attachments.enabled).toBe(false);
    expect(out.features.attachments.maxFileSizeMB).toBe(20);
  });

  // C-03: canonical theme.colors.primary wins over legacy style.primaryColor
  it('canonical theme.colors.primary wins over legacy style.primaryColor (C-03)', () => {
    const out = migrateConfig({
      theme: { colors: { primary: '#AABBCC' } },
      style: { primaryColor: '#FF0000' },
    });
    expect(out.theme.colors.primary).toBe('#AABBCC');
  });

  // C-03: playground themeMode vs canonical theme.mode and legacy style.theme
  it('canonical theme.mode wins over playground themeMode; playground themeMode wins over legacy style.theme (C-03/C-04)', () => {
    // Playground themeMode beats legacy style.theme
    const out1 = migrateConfig({ themeMode: 'dark', style: { theme: 'light' } });
    expect(out1.theme.mode).toBe('dark');

    // Canonical theme.mode beats playground themeMode
    const out2 = migrateConfig({ theme: { mode: 'auto' }, themeMode: 'dark' });
    expect(out2.theme.mode).toBe('auto');
  });

  // C-06: invalid array ELEMENT is spliced out; valid siblings survive
  it('splices out an invalid starterPrompts element, preserving the greeting and valid prompts (C-06)', () => {
    const out = migrateConfig({
      schemaVersion: 2,
      startScreen: {
        greeting: 'Hello from Acme',
        starterPrompts: [
          { label: 'Pricing', icon: 'tag' },
          { label: '', icon: 'x' }, // invalid: empty label
        ],
      },
    });
    expect(out.startScreen.greeting).toBe('Hello from Acme');
    expect(out.startScreen.starterPrompts).toHaveLength(1);
    expect(out.startScreen.starterPrompts[0]).toEqual({ label: 'Pricing', icon: 'tag' });
  });

  // C-06: invalid primitive array element spliced without sparse holes
  it('splices an invalid allowedExtensions entry, preserving all sibling feature values (C-06)', () => {
    const out = migrateConfig({
      schemaVersion: 2,
      features: {
        emailTranscript: true,
        ratingPrompt: true,
        attachments: { enabled: true, allowedExtensions: ['.pdf', 'PDF'], maxFileSizeMB: 25 },
      },
    });
    expect(out.features.emailTranscript).toBe(true);
    expect(out.features.ratingPrompt).toBe(true);
    expect(out.features.attachments.enabled).toBe(true);
    expect(out.features.attachments.maxFileSizeMB).toBe(25);
    expect(out.features.attachments.allowedExtensions).toEqual(['.pdf']);
  });

  // C-06: every element invalid → empty array, siblings preserved
  it('empties starterPrompts when all elements are invalid, preserving the greeting (C-06)', () => {
    const out = migrateConfig({
      schemaVersion: 2,
      startScreen: { greeting: 'Hi', starterPrompts: [{ label: '', icon: '' }] },
    });
    expect(out.startScreen.greeting).toBe('Hi');
    expect(out.startScreen.starterPrompts).toEqual([]);
  });
});

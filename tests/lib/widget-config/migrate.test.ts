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
});

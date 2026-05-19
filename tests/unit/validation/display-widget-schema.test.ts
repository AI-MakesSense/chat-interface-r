import { displayWidgetConfigSchema } from '@/lib/validation/display-widget-schema';

describe('displayWidgetConfigSchema', () => {
  const valid = {
    branding: { companyName: 'Acme', logoUrl: null, brandingEnabled: true },
    theme: {
      colorScheme: 'light',
      radius: 'medium',
      density: 'normal',
      color: {
        accent: '#0066FF',
        surface: '#FFFFFF',
        text: '#111111',
        subText: '#666666',
        border: '#E5E7EB',
      },
    },
    display: {
      position: 'right',
      defaultOpen: true,
      header: { title: 'Required documents', showCount: true },
      emptyMessage: 'No documents available.',
    },
    connection: {
      provider: 'n8n',
      webhookUrl: 'https://example.com/webhook',
      triggerMessage: 'List required documents.',
      captureContext: true,
      customContext: {},
    },
  };

  it('accepts a valid display config', () => {
    expect(displayWidgetConfigSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an invalid color', () => {
    const bad = { ...valid, theme: { ...valid.theme, color: { ...valid.theme.color, accent: 'not-a-hex' } } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects a non-https webhook URL', () => {
    const bad = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://insecure' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects an unknown position value', () => {
    const bad = { ...valid, display: { ...valid.display, position: 'top' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects an unknown provider', () => {
    const bad = { ...valid, connection: { ...valid.connection, provider: 'chatkit' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  // --- webhookUrl: URL-parsed localhost check ---

  it('accepts http://localhost webhook URL', () => {
    const cfg = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://localhost:3000/webhook' } };
    expect(() => displayWidgetConfigSchema.parse(cfg)).not.toThrow();
  });

  it('accepts http://127.0.0.1 webhook URL', () => {
    const cfg = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://127.0.0.1:5678/webhook' } };
    expect(() => displayWidgetConfigSchema.parse(cfg)).not.toThrow();
  });

  it('rejects http://attacker.com/?ref=localhost (substring bypass attempt)', () => {
    const bad = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://attacker.com/?ref=localhost' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects http://localhost.attacker.com/ (subdomain bypass attempt)', () => {
    const bad = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://localhost.attacker.com/' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects http://evil.com/#localhost (fragment bypass attempt)', () => {
    const bad = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://evil.com/#localhost' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects http://malicious.localhost.foo/ (nested subdomain bypass attempt)', () => {
    const bad = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://malicious.localhost.foo/' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  // --- triggerMessage: non-empty requirement ---

  it('rejects an empty triggerMessage', () => {
    const bad = { ...valid, connection: { ...valid.connection, triggerMessage: '' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('accepts a triggerMessage at the 500-char boundary', () => {
    const cfg = { ...valid, connection: { ...valid.connection, triggerMessage: 'a'.repeat(500) } };
    expect(() => displayWidgetConfigSchema.parse(cfg)).not.toThrow();
  });

  it('rejects a triggerMessage exceeding 500 chars', () => {
    const bad = { ...valid, connection: { ...valid.connection, triggerMessage: 'a'.repeat(501) } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });
});

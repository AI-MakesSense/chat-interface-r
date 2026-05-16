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
});

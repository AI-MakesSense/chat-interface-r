import { translateDisplayConfig } from '@/lib/widget/translate-display-config';

describe('translateDisplayConfig', () => {
  const dbConfig = {
    kind: 'display',
    branding: { companyName: 'Acme', logoUrl: null, brandingEnabled: true },
    theme: {
      colorScheme: 'light',
      radius: 'medium',
      density: 'normal',
      color: { accent: '#0066FF', surface: '#FFFFFF', text: '#111', subText: '#666', border: '#E5E7EB' },
    },
    display: {
      position: 'right',
      defaultOpen: true,
      header: { title: 'Related docs', showCount: true },
      emptyMessage: 'Nothing here yet.',
    },
    connection: {
      provider: 'n8n',
      webhookUrl: 'https://n8n.example.com/webhook/abc',
      triggerMessage: 'Find docs',
      captureContext: true,
      customContext: { region: 'us' },
    },
  };

  it('returns the config with kind=display preserved', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.kind).toBe('display');
  });

  it('strips the webhookUrl from the client-facing config', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect((out as any).connection?.webhookUrl).toBeUndefined();
  });

  it('exposes the relay endpoint derived from the request URL', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.connection.relayEndpoint).toBe('https://app.example.com/api/chat-relay');
  });

  it('preserves triggerMessage and customContext', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.connection.triggerMessage).toBe('Find docs');
    expect(out.connection.customContext).toEqual({ region: 'us' });
  });

  it('preserves branding, theme, and display sections verbatim', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.branding).toEqual(dbConfig.branding);
    expect(out.theme).toEqual(dbConfig.theme);
    expect(out.display).toEqual(dbConfig.display);
  });

  it('includes a features stub for WidgetConfig compatibility', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.features).toEqual({
      fileAttachmentsEnabled: false,
      allowedExtensions: [],
      maxFileSizeKB: 0,
    });
  });

  it('handles missing optional fields gracefully', () => {
    const minimal = {
      kind: 'display',
      branding: { companyName: 'X', logoUrl: null, brandingEnabled: false },
      theme: dbConfig.theme,
      display: dbConfig.display,
      connection: { provider: 'n8n', webhookUrl: 'https://x/wh' },
      // triggerMessage, captureContext, customContext all absent
    } as any;
    const out = translateDisplayConfig(minimal, 'https://app.example.com/w/abc/config');
    expect(out.connection.triggerMessage).toBe('');
    expect(out.connection.captureContext).toBe(true);
    expect(out.connection.customContext).toEqual({});
  });
});

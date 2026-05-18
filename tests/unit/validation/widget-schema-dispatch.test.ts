import { getWidgetConfigSchemaForKind, normalizeTier } from '@/lib/validation/widget-schema';

describe('getWidgetConfigSchemaForKind', () => {
  const validDisplayConfig = {
    branding: { companyName: 'Acme', logoUrl: null, brandingEnabled: true },
    theme: {
      colorScheme: 'light',
      radius: 'medium',
      density: 'normal',
      color: { accent: '#0066FF', surface: '#FFFFFF', text: '#111111', subText: '#666666', border: '#E5E7EB' },
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

  it('returns the display schema for kind="display"', () => {
    const schema = getWidgetConfigSchemaForKind('display', 'pro', false);
    expect(schema.safeParse(validDisplayConfig).success).toBe(true);
  });

  it('display schema rejects configs missing required display fields', () => {
    const schema = getWidgetConfigSchemaForKind('display', 'pro', false);
    const bad = { ...validDisplayConfig, display: undefined };
    expect(schema.safeParse(bad).success).toBe(false);
  });

  it('returns a chat schema for kind="chat" (smoke check — uses existing factory)', () => {
    // We just verify it returns SOMETHING that is NOT the display schema.
    // Full chat-schema correctness is already covered by existing tests in tests/unit/validation/widget-schema.test.ts
    const chatSchema = getWidgetConfigSchemaForKind('chat', 'basic', true);
    const displaySchema = getWidgetConfigSchemaForKind('display', 'basic', true);
    expect(chatSchema).not.toBe(displaySchema);
  });

  it('throws on unknown kind', () => {
    // @ts-expect-error — intentionally passing an invalid kind
    expect(() => getWidgetConfigSchemaForKind('mystery', 'pro', false)).toThrow();
  });
});

describe('normalizeTier', () => {
  it('returns valid tiers as-is', () => {
    expect(normalizeTier('basic')).toBe('basic');
    expect(normalizeTier('pro')).toBe('pro');
    expect(normalizeTier('agency')).toBe('agency');
  });

  it('normalizes free to basic', () => {
    expect(normalizeTier('free')).toBe('basic');
  });

  it('normalizes null and undefined to basic', () => {
    expect(normalizeTier(null)).toBe('basic');
    expect(normalizeTier(undefined)).toBe('basic');
  });

  it('normalizes garbage strings to basic', () => {
    expect(normalizeTier('garbage')).toBe('basic');
    expect(normalizeTier('')).toBe('basic');
  });
});

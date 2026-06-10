/**
 * Unit Tests for config-helpers.ts
 *
 * NOTE: stripLegacyConfigProperties was deleted. With the canonical schema
 * (schemaVersion 2), `theme`, `behavior`, and `advancedStyling` are real
 * top-level sections of chat configs — there is nothing legacy left to strip;
 * migrateConfig handles all shape normalization at the API boundaries.
 *
 * Tests:
 * - createDefaultConfig: returns display-shaped config for kind=display
 * - sanitizeConfig: repairs invalid data but never supplies defaults
 *   (defaults live in exactly one place: the canonical Zod schema)
 */

import { createDefaultConfig } from '@/lib/config/defaults';
import { sanitizeConfig } from '@/lib/utils/config-helpers';

describe('createDefaultConfig', () => {
  it('returns display-shaped config for kind=display', () => {
    const result = createDefaultConfig('pro', 'display');
    expect(result.kind).toBe('display');
    expect((result as any).display).toBeDefined();
    expect((result as any).display.position).toBe('right');
    expect((result as any).theme.color.accent).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect((result as any).connection.provider).toBe('n8n');
  });

  it('display config has required theme structure', () => {
    const result = createDefaultConfig('agency', 'display');
    const theme = (result as any).theme;
    expect(theme.colorScheme).toBe('light');
    expect(theme.radius).toBe('medium');
    expect(theme.density).toBe('normal');
    expect(theme.color).toHaveProperty('accent');
    expect(theme.color).toHaveProperty('surface');
    expect(theme.color).toHaveProperty('text');
  });

  it('display config has connection section with n8n provider', () => {
    const result = createDefaultConfig('basic', 'display');
    const connection = (result as any).connection;
    expect(connection.provider).toBe('n8n');
    expect(connection).toHaveProperty('webhookUrl');
    expect(connection).toHaveProperty('captureContext');
  });

  it('returns chat-shaped config for kind=chat', () => {
    const result = createDefaultConfig('pro', 'chat');
    // Chat config does NOT have a top-level `display` field with sidebar shape
    expect((result as any).display?.position).toBeUndefined();
  });

  it('defaults to chat behavior when kind is omitted', () => {
    const result = createDefaultConfig('pro');
    expect((result as any).display?.position).toBeUndefined();
  });

  it('chat config has standard chat-specific fields', () => {
    const result = createDefaultConfig('pro', 'chat');
    expect((result as any).branding).toBeDefined();
    expect((result as any).behavior).toBeDefined();
    expect((result as any).features).toBeDefined();
    expect((result as any).advancedStyling).toBeDefined();
  });

  it('display config sets brandingEnabled=true for basic tier', () => {
    const result = createDefaultConfig('basic', 'display');
    expect((result as any).branding.brandingEnabled).toBe(true);
  });

  it('display config sets brandingEnabled=false for pro tier', () => {
    const result = createDefaultConfig('pro', 'display');
    expect((result as any).branding.brandingEnabled).toBe(false);
  });

  it('returns a new object on each call (immutability)', () => {
    const a = createDefaultConfig('pro', 'display');
    const b = createDefaultConfig('pro', 'display');
    expect(a).not.toBe(b);
    (a as any).theme.color.accent = '#999999';
    expect((b as any).theme.color.accent).not.toBe('#999999');
  });
});

describe('sanitizeConfig', () => {
  it('leaves missing companyName/firstMessage absent so the canonical schema default applies', () => {
    const result = sanitizeConfig({ branding: {} }, 'pro', 'chat');
    expect(result.branding.companyName).toBeUndefined();
    expect(result.branding.firstMessage).toBeUndefined();
  });

  it('preserves empty-string companyName/firstMessage (sanitize does not repair emptiness; schema min(1) rejects downstream with a 400)', () => {
    const result = sanitizeConfig(
      { branding: { companyName: '', firstMessage: '' } },
      'pro',
      'chat'
    );
    expect(result.branding.companyName).toBe('');
    expect(result.branding.firstMessage).toBe('');
  });

  it('preserves explicitly provided companyName and firstMessage', () => {
    const result = sanitizeConfig(
      { branding: { companyName: 'Acme', firstMessage: 'Hi there!' } },
      'pro',
      'chat'
    );
    expect(result.branding.companyName).toBe('Acme');
    expect(result.branding.firstMessage).toBe('Hi there!');
  });
});

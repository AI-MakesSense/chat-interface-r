/**
 * Unit Tests for config-helpers.ts
 *
 * With the canonical schema (schemaVersion 2), stripLegacyConfigProperties is a
 * passthrough — `theme`, `behavior`, and `advancedStyling` are REAL canonical
 * sections for chat configs and must not be stripped.
 *
 * Tests:
 * - stripLegacyConfigProperties: now a passthrough for both chat and display
 * - createDefaultConfig: returns display-shaped config for kind=display
 */

import { stripLegacyConfigProperties } from '@/lib/utils/config-helpers';
import { createDefaultConfig } from '@/lib/config/defaults';

describe('stripLegacyConfigProperties', () => {
  it('preserves theme for display widgets', () => {
    const config = {
      kind: 'display',
      theme: { colorScheme: 'light', color: { accent: '#06f' } },
      branding: { companyName: 'X' },
    };
    const result = stripLegacyConfigProperties(config, 'display');
    expect(result.theme).toEqual({ colorScheme: 'light', color: { accent: '#06f' } });
  });

  it('preserves theme for chat widgets (canonical section — must NOT be stripped)', () => {
    const config = {
      schemaVersion: 2,
      kind: 'chat',
      theme: { mode: 'light', colors: { primary: '#4F46E5' } },
      branding: { companyName: 'X' },
    };
    const result = stripLegacyConfigProperties(config, 'chat');
    expect(result.theme).toBeDefined();
    expect(result.theme.mode).toBe('light');
  });

  it('preserves theme when kind is omitted (passthrough)', () => {
    const config = { theme: { mode: 'light' }, branding: { companyName: 'X' } };
    const result = stripLegacyConfigProperties(config);
    expect(result.theme).toBeDefined();
  });

  it('preserves behavior and advancedStyling for chat (canonical sections)', () => {
    const config = {
      branding: { companyName: 'X' },
      behavior: { autoOpen: true },
      advancedStyling: { enabled: true },
    };
    const result = stripLegacyConfigProperties(config, 'chat');
    expect(result.behavior).toEqual({ autoOpen: true });
    expect(result.advancedStyling).toEqual({ enabled: true });
  });

  it('preserves all fields for display widgets', () => {
    const config = {
      kind: 'display',
      theme: { colorScheme: 'light' },
      branding: { companyName: 'X' },
      someDisplayField: { foo: 'bar' },
    };
    const result = stripLegacyConfigProperties(config, 'display');
    expect(result.someDisplayField).toEqual({ foo: 'bar' });
    expect(result.theme).toBeDefined();
  });

  it('returns a shallow copy (does not mutate input)', () => {
    const config = { branding: { companyName: 'X' }, theme: { mode: 'light' } };
    const result = stripLegacyConfigProperties(config, 'chat');
    expect(result).not.toBe(config);
    expect(result.branding).toEqual({ companyName: 'X' });
  });
});

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

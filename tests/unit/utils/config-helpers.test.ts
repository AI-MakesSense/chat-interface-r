/**
 * Unit Tests for config-helpers.ts
 *
 * Tests kind-aware behavior of:
 * - stripLegacyConfigProperties: preserves theme for display, strips for chat
 * - createDefaultConfig: returns display-shaped config for kind=display
 */

import { stripLegacyConfigProperties } from '@/lib/utils/config-helpers';
import { createDefaultConfig } from '@/lib/config/defaults';

describe('stripLegacyConfigProperties', () => {
  it('preserves theme when kind=display', () => {
    const config = {
      kind: 'display',
      theme: { colorScheme: 'light', color: { accent: '#06f' } },
      branding: { companyName: 'X' },
    };
    const result = stripLegacyConfigProperties(config, 'display');
    expect(result.theme).toEqual({ colorScheme: 'light', color: { accent: '#06f' } });
  });

  it('deletes theme when kind=chat (regression check)', () => {
    const config = { theme: { mode: 'old' }, branding: { companyName: 'X' } };
    const result = stripLegacyConfigProperties(config, 'chat');
    expect(result.theme).toBeUndefined();
  });

  it('defaults to chat behavior when kind is omitted (backward compat)', () => {
    const config = { theme: { mode: 'old' }, branding: { companyName: 'X' } };
    const result = stripLegacyConfigProperties(config);
    expect(result.theme).toBeUndefined();
  });

  it('strips behavior and advancedStyling for chat', () => {
    const config = {
      branding: { companyName: 'X' },
      behavior: { autoOpen: true },
      advancedStyling: { enabled: true },
    };
    const result = stripLegacyConfigProperties(config, 'chat');
    expect(result.behavior).toBeUndefined();
    expect(result.advancedStyling).toBeUndefined();
  });

  it('preserves behavior and advancedStyling for display (if present)', () => {
    const config = {
      kind: 'display',
      theme: { colorScheme: 'light' },
      branding: { companyName: 'X' },
      // display configs wouldn't normally have these, but the function should not delete them
      someDisplayField: { foo: 'bar' },
    };
    const result = stripLegacyConfigProperties(config, 'display');
    expect(result.someDisplayField).toEqual({ foo: 'bar' });
    expect(result.theme).toBeDefined();
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

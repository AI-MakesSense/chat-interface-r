/**
 * ZipGenerator.sanitizeConfig tests (jest)
 *
 * The downloaded widget runtime (widget/src) consumes the LEGACY config
 * shape (style.*, features.fileAttachmentsEnabled). sanitizeConfig reads
 * from the canonical config and must emit that legacy shape — including
 * style.customFontUrl, which the runtime reads in chat-container.ts and
 * css-variables.ts (regression: it was silently dropped after the
 * canonical-config migration).
 */

import { ZipGenerator } from '@/lib/zip-generator';
import { createDefaultConfig } from '@/lib/widget-config/defaults';
import { migrateConfig } from '@/lib/widget-config/migrate';

// sanitizeConfig is private; tests reach it directly to avoid the
// filesystem dependency of the full package-generation path.
function sanitize(config: unknown) {
  const generator = new ZipGenerator();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (generator as any).sanitizeConfig(config);
}

describe('ZipGenerator.sanitizeConfig', () => {
  it('emits the legacy style shape from canonical config', () => {
    const config = createDefaultConfig('basic', 'chat');
    config.theme.mode = 'dark';
    config.theme.colors.primary = '#00BFFF';
    config.theme.colors.background = '#101010';
    config.theme.colors.text = '#EEEEEE';
    config.theme.position.position = 'bottom-left';
    config.theme.cornerRadius = 8;
    config.theme.typography.fontFamily = 'Inter';
    config.theme.typography.fontSize = 18;

    const out = sanitize(config);

    expect(out.style.theme).toBe('dark');
    expect(out.style.primaryColor).toBe('#00BFFF');
    expect(out.style.backgroundColor).toBe('#101010');
    expect(out.style.textColor).toBe('#EEEEEE');
    expect(out.style.position).toBe('bottom-left');
    expect(out.style.cornerRadius).toBe(8);
    expect(out.style.fontFamily).toBe('Inter');
    expect(out.style.fontSize).toBe(18);
  });

  it('includes style.customFontUrl when theme.typography.fontUrl is set', () => {
    const config = migrateConfig({
      theme: { typography: { fontUrl: 'https://fonts.example.com/geist.woff2' } },
    });
    const out = sanitize(config);
    expect(out.style.customFontUrl).toBe('https://fonts.example.com/geist.woff2');
  });

  it('emits undefined customFontUrl when no font URL is configured', () => {
    const out = sanitize(createDefaultConfig('basic', 'chat'));
    expect(out.style.customFontUrl).toBeUndefined();
  });

  it('emits the legacy features shape', () => {
    const config = createDefaultConfig('basic', 'chat');
    config.features.attachments.enabled = true;
    config.features.attachments.allowedExtensions = ['.pdf'];
    config.features.attachments.maxFileSizeMB = 5;

    const out = sanitize(config);
    expect(out.features.fileAttachmentsEnabled).toBe(true);
    expect(out.features.allowedExtensions).toEqual(['.pdf']);
    expect(out.features.maxFileSizeKB).toBe(5 * 1024);
  });

  it('preserves branding fields', () => {
    const config = createDefaultConfig('basic', 'chat');
    config.branding.companyName = 'Test Co';
    const out = sanitize(config);
    expect(out.branding.companyName).toBe('Test Co');
    expect(out.branding.firstMessage).toBe(config.branding.firstMessage);
  });
});

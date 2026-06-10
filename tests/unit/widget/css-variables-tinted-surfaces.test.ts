/**
 * Tinted-surface scale tests for widget/src/theming/css-variables.ts.
 *
 * Contract under test: theme.color.grayscale (GrayscaleConfig) is ChatKit-scale
 * (tint 0-9, shade -4..4, see widget/src/types.ts). generateTintedSurfaces'
 * formulas were written for the legacy 0-20 slider scale, so it converts
 * internally (tintLevel = tint/9*20; shadeLevel = shade*2.5 + 10). These tests
 * pin the formula outputs through the public createCSSVariables() entry point
 * (generateTintedSurfaces itself is module-private).
 *
 * Formula table (light): sat = 10 + tintLevel*3 ; lit = 98 - shadeLevel*2
 * Formula table (dark):  sat = 5 + tintLevel*2  ; lit = 10 + shadeLevel*0.5
 *
 * NOTE: the legacy vitest suite tests/widget/theming/css-variables.test.ts is
 * excluded from jest (testPathIgnorePatterns), hence this separate jest file.
 */
import { createCSSVariables } from '@/widget/src/theming/css-variables';
import type { WidgetConfig } from '@/widget/src/types';

function baseConfig(): WidgetConfig {
  return {
    branding: {
      companyName: 'Support',
      welcomeText: 'How can we help?',
      firstMessage: 'Hello!',
    },
    style: {
      theme: 'light',
      primaryColor: '#00bfff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      position: 'bottom-right',
      cornerRadius: 8,
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
    },
    features: {
      fileAttachmentsEnabled: false,
      allowedExtensions: [],
      maxFileSizeKB: 5120,
    },
    connection: { webhookUrl: 'https://example.com/webhook' },
  } as WidgetConfig;
}

function withGrayscale(
  tint: number,
  shade: number,
  colorScheme: 'light' | 'dark' = 'light'
): WidgetConfig {
  const cfg = baseConfig();
  cfg.theme = {
    colorScheme,
    color: { grayscale: { hue: 220, tint, shade } },
  };
  return cfg;
}

/** Parse `hsl(H, S%, L%)` into numbers. */
function parseHsl(value: string): { h: number; s: number; l: number } {
  const m = /^hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)$/.exec(value);
  if (!m) throw new Error(`not an hsl() value: ${value}`);
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}

describe('createCSSVariables — tinted surfaces consume ChatKit-scale grayscale', () => {
  it('light mode: tint 5 / shade 0 matches legacy output for tintLevel≈11.1 / shadeLevel 10', () => {
    const vars = createCSSVariables(withGrayscale(5, 0, 'light'));
    const bg = parseHsl(vars['--cw-surface-bg']);

    // Legacy formula at tintLevel = (5/9)*20 ≈ 11.111: sat = 10 + 33.33 ≈ 43.33
    expect(bg.h).toBe(220);
    expect(bg.s).toBeCloseTo(43.33, 0); // within ~1 unit
    // shade 0 → legacy shadeLevel 10 (neutral): lit = 98 - 20 = 78 exactly
    expect(bg.l).toBe(78);
  });

  it('dark mode: tint 5 / shade 0 matches legacy output for tintLevel≈11.1 / shadeLevel 10', () => {
    const vars = createCSSVariables(withGrayscale(5, 0, 'dark'));
    const bg = parseHsl(vars['--cw-surface-bg']);

    // Legacy dark formulas: sat = 5 + 11.111*2 ≈ 27.22 ; lit = 10 + 10*0.5 = 15
    expect(bg.h).toBe(220);
    expect(bg.s).toBeCloseTo(27.22, 0);
    expect(bg.l).toBe(15);
  });

  it('light mode endpoints span the full legacy range (no clipping, no >100% values)', () => {
    // ChatKit minimum (tint 0, shade -4) ≡ legacy tintLevel 0 / shadeLevel 0
    const min = parseHsl(createCSSVariables(withGrayscale(0, -4, 'light'))['--cw-surface-bg']);
    expect(min.s).toBe(10); // 10 + 0*3
    expect(min.l).toBe(98); // 98 - 0*2

    // ChatKit maximum (tint 9, shade 4) ≡ legacy tintLevel 20 / shadeLevel 20
    const max = parseHsl(createCSSVariables(withGrayscale(9, 4, 'light'))['--cw-surface-bg']);
    expect(max.s).toBe(70); // 10 + 20*3
    expect(max.l).toBe(58); // 98 - 20*2
  });

  it('grayscale step palette still uses ChatKit scale directly (tint*2 % saturation)', () => {
    const vars = createCSSVariables(withGrayscale(5, 0, 'light'));
    // generateGrayscalePalette: sat = tint*2 = 10%, gray-0 lightness 98 + shade*2 = 98
    expect(vars['--cw-gray-0']).toBe('hsl(220, 10%, 98%)');
  });
});

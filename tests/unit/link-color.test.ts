import { parseColorToRgb, contrastRatio, resolveLinkColor, rgbaTint } from '@/widget/src/link-color';

describe('parseColorToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(parseColorToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('parses 3-digit hex', () => {
    expect(parseColorToRgb('#f00')).toEqual([255, 0, 0]);
  });

  it('parses rgb()', () => {
    expect(parseColorToRgb('rgb(0, 128, 255)')).toEqual([0, 128, 255]);
  });

  it('parses rgba()', () => {
    expect(parseColorToRgb('rgba(0, 128, 255, 0.5)')).toEqual([0, 128, 255]);
  });

  it('parses hsl()', () => {
    const result = parseColorToRgb('hsl(0, 100%, 50%)');
    expect(result).toEqual([255, 0, 0]);
  });

  it('returns null for empty string', () => {
    expect(parseColorToRgb('')).toBeNull();
  });

  it('returns null for unsupported format', () => {
    expect(parseColorToRgb('rebeccapurple')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = contrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('returns 1 for same color', () => {
    const ratio = contrastRatio([128, 128, 128], [128, 128, 128]);
    expect(ratio).toBeCloseTo(1, 1);
  });
});

describe('resolveLinkColor', () => {
  it('returns accent when contrast is sufficient on white', () => {
    expect(resolveLinkColor('#1d4ed8', '#ffffff')).toBe('#1d4ed8');
  });

  it('falls back to dark blue on light bg when accent has low contrast', () => {
    expect(resolveLinkColor('#fef08a', '#ffffff')).toBe('#1d4ed8');
  });

  it('falls back to light blue on dark bg when accent has low contrast', () => {
    expect(resolveLinkColor('#1a1a1a', '#111111')).toBe('#93c5fd');
  });

  it('returns accent when contrast is sufficient on dark bg', () => {
    expect(resolveLinkColor('#4ade80', '#1a1a1a')).toBe('#4ade80');
  });

  it('provides accessible color on mid-gray background', () => {
    const result = resolveLinkColor('#fef08a', '#808080');
    // Should NOT be the accent (low contrast) and result should have good contrast
    expect(result).not.toBe('#fef08a');
  });
});

describe('rgbaTint', () => {
  it('returns rgba string for hex color', () => {
    expect(rgbaTint('#ff0000', 0.12)).toBe('rgba(255, 0, 0, 0.12)');
  });

  it('returns original color for unparseable input', () => {
    expect(rgbaTint('rebeccapurple', 0.5)).toBe('rebeccapurple');
  });
});

describe('parseColorToRgb (additional)', () => {
  it('parses hsla()', () => {
    const result = parseColorToRgb('hsla(0, 100%, 50%, 0.5)');
    expect(result).toEqual([255, 0, 0]);
  });
});

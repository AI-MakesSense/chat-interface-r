/**
 * Link Color Resolver
 *
 * Picks a link color that meets WCAG AA contrast (4.5:1) against
 * the message bubble background. Falls back to a luminance-appropriate
 * safe blue when the widget's accent color doesn't pass.
 */

/** Parse hex, rgb/rgba, hsl/hsla into [r, g, b]. Returns null for unsupported formats. */
export function parseColorToRgb(color: string): [number, number, number] | null {
  if (!color) return null;
  const c = color.trim();

  // Hex: #RGB or #RRGGBB
  const hex = c.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // rgb() / rgba()
  const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Math.round(+rgb[1]), Math.round(+rgb[2]), Math.round(+rgb[3])];

  // hsl() / hsla()
  const hsl = c.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
  if (hsl) return hslToRgb(+hsl[1], +hsl[2] / 100, +hsl[3] / 100);

  return null;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Returns a link color with at least 4.5:1 contrast against `bg`.
 * Uses the accent if it passes; otherwise tries progressively stronger
 * fallback blues, and ultimately falls back to black or white.
 */
export function resolveLinkColor(accent: string, bg: string): string {
  const accentRgb = parseColorToRgb(accent);
  const bgRgb = parseColorToRgb(bg);
  if (!accentRgb || !bgRgb) return accent;
  if (contrastRatio(accentRgb, bgRgb) >= 4.5) return accent;

  // Try progressively stronger fallbacks
  const lum = relativeLuminance(bgRgb);
  const candidates = lum > 0.5
    ? ['#1d4ed8', '#1e3a8a', '#172554'] // increasingly dark blues for light bgs
    : ['#93c5fd', '#bfdbfe', '#dbeafe']; // increasingly light blues for dark bgs

  for (const c of candidates) {
    const rgb = parseColorToRgb(c)!;
    if (contrastRatio(rgb, bgRgb) >= 4.5) return c;
  }

  // Ultimate fallback: black or white
  return lum > 0.5 ? '#000000' : '#ffffff';
}

/** Returns an rgba() tint string for the given color at the given alpha. */
export function rgbaTint(color: string, alpha: number): string {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

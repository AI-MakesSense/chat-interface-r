/**
 * CSS Variables Generator
 *
 * Purpose: Converts widget configuration to CSS custom properties
 * Responsibility: Maps style configuration to CSS variable names
 * Assumptions: Config values are validated before reaching this module
 *
 * Extended to support ChatKit-compatible theming options including:
 * - Grayscale palette with tinted hues
 * - Accent colors with intensity levels
 * - Surface background/foreground colors
 * - User message colors
 * - Typography customization
 * - Radius and density options
 */

import { WidgetConfig, RadiusOption, DensityOption } from '../types';

/**
 * Radius values mapping
 */
const RADIUS_MAP: Record<RadiusOption, number> = {
  'none': 0,
  'small': 6,
  'medium': 12,
  'large': 18,
  'pill': 9999,
};

/**
 * Density/spacing multipliers
 */
const DENSITY_MAP: Record<DensityOption, { padding: number; gap: number }> = {
  'compact': { padding: 0.75, gap: 0.75 },
  'normal': { padding: 1, gap: 1 },
  'spacious': { padding: 1.25, gap: 1.25 },
};

/**
 * Generate grayscale palette from hue, tint, and shade
 * Matches the preview component's algorithm exactly
 */
function generateGrayscalePalette(hue: number, tint: number, shade: number = 0): Record<string, string> {
  // Base lightness values for grayscale steps (0-12)
  const baseLightness = [98, 96, 92, 88, 80, 70, 60, 50, 40, 30, 22, 14, 8];

  // Adjust saturation based on tint level (0-9 maps to 0-18% saturation)
  const saturation = tint * 2;

  // Generate palette
  const palette: Record<string, string> = {};

  baseLightness.forEach((l, i) => {
    // Apply shade adjustment (-4 to 4 maps to -8% to 8% lightness)
    const adjustedL = Math.max(0, Math.min(100, l + shade * 2));
    palette[`--cw-gray-${i}`] = `hsl(${hue}, ${saturation}%, ${adjustedL}%)`;
  });

  return palette;
}

/**
 * Generate tinted surface colors matching the preview component's logic
 */
function generateTintedSurfaces(
  hue: number,
  tintLevel: number,
  shadeLevel: number,
  isDark: boolean
): {
  bg: string;
  surface: string;
  composerSurface: string;
  border: string;
  text: string;
  subText: string;
  hoverSurface: string;
} {
  if (isDark) {
    const sat = 5 + tintLevel * 2;
    const lit = 10 + shadeLevel * 0.5;

    return {
      bg: `hsl(${hue}, ${sat}%, ${lit}%)`,
      surface: `hsl(${hue}, ${sat}%, ${lit + 5}%)`,
      composerSurface: `hsl(${hue}, ${sat}%, ${lit + 5}%)`,
      border: `hsla(${hue}, ${sat}%, 90%, 0.08)`,
      text: `hsl(${hue}, ${Math.max(0, sat - 10)}%, 90%)`,
      subText: `hsl(${hue}, ${Math.max(0, sat - 10)}%, 60%)`,
      hoverSurface: `hsla(${hue}, ${sat}%, 90%, 0.05)`,
    };
  } else {
    const sat = 10 + tintLevel * 3;
    const lit = 98 - shadeLevel * 2;

    return {
      bg: `hsl(${hue}, ${sat}%, ${lit}%)`,
      surface: `hsl(${hue}, ${sat}%, ${lit - 5}%)`,
      composerSurface: `hsl(${hue}, ${sat}%, 100%)`,
      border: `hsla(${hue}, ${sat}%, 10%, 0.08)`,
      text: `hsl(${hue}, ${sat}%, 10%)`,
      subText: `hsl(${hue}, ${sat}%, 40%)`,
      hoverSurface: `hsla(${hue}, ${sat}%, 10%, 0.05)`,
    };
  }
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * percent));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * percent));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * percent));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

/**
 * Generate accent color palette from primary color
 */
function generateAccentPalette(primary: string, level: number = 1): Record<string, string> {
  // Level affects the intensity/spread of the palette
  const intensityMultiplier = 0.15 + (level * 0.05);

  return {
    '--cw-accent-primary': primary,
    '--cw-accent-hover': darkenColor(primary, intensityMultiplier),
    '--cw-accent-active': darkenColor(primary, intensityMultiplier * 1.5),
    '--cw-accent-light': lightenColor(primary, 0.9),
    '--cw-accent-lighter': lightenColor(primary, 0.95),
  };
}

/**
 * Creates CSS variables from widget configuration
 * @param config - Widget configuration object
 * @returns Object mapping CSS variable names to values
 */
export function createCSSVariables(config: WidgetConfig): Record<string, string> {
  const theme = config.theme;
  const colorScheme = theme?.colorScheme || config.style.theme || 'light';
  const isDark = colorScheme === 'dark';

  // Start with legacy/basic variables for backward compatibility
  const variables: Record<string, string> = {
    // Legacy variables (still used by existing code)
    '--cw-primary-color': config.style.primaryColor,
    '--cw-bg-color': config.style.backgroundColor,
    '--cw-text-color': config.style.textColor,
    '--cw-font-family': config.style.fontFamily,
    '--cw-font-size': `${config.style.fontSize}px`,
    '--cw-corner-radius': `${config.style.cornerRadius}px`,
  };

  // === Extended Theme Variables ===

  // Color scheme
  variables['--cw-color-scheme'] = colorScheme;

  // Radius
  const radius = theme?.radius || 'medium';
  const radiusValue = RADIUS_MAP[radius] ?? 12;
  variables['--cw-radius-sm'] = `${Math.max(0, radiusValue - 4)}px`;
  variables['--cw-radius-md'] = `${radiusValue}px`;
  variables['--cw-radius-lg'] = `${radiusValue + 4}px`;
  variables['--cw-radius-xl'] = `${radiusValue + 8}px`;
  variables['--cw-radius-full'] = radius === 'pill' ? '9999px' : `${radiusValue * 2}px`;

  // Density/spacing
  const density = theme?.density || 'normal';
  const densityValues = DENSITY_MAP[density] ?? DENSITY_MAP.normal;
  variables['--cw-spacing-xs'] = `${4 * densityValues.padding}px`;
  variables['--cw-spacing-sm'] = `${8 * densityValues.padding}px`;
  variables['--cw-spacing-md'] = `${12 * densityValues.padding}px`;
  variables['--cw-spacing-lg'] = `${16 * densityValues.padding}px`;
  variables['--cw-spacing-xl'] = `${24 * densityValues.padding}px`;
  variables['--cw-gap'] = `${8 * densityValues.gap}px`;

  // Typography
  const typography = theme?.typography;
  if (typography) {
    if (typography.baseSize) {
      variables['--cw-font-size'] = `${typography.baseSize}px`;
      variables['--cw-font-size-sm'] = `${typography.baseSize - 2}px`;
      variables['--cw-font-size-lg'] = `${typography.baseSize + 2}px`;
      variables['--cw-font-size-xl'] = `${typography.baseSize + 4}px`;
    }
    if (typography.fontFamily) {
      variables['--cw-font-family'] = typography.fontFamily;
    }
    if (typography.fontFamilyMono) {
      variables['--cw-font-family-mono'] = typography.fontFamilyMono;
    }
  }

  // Grayscale palette
  const grayscale = theme?.color?.grayscale;
  if (grayscale) {
    const grayscalePalette = generateGrayscalePalette(
      grayscale.hue,
      grayscale.tint,
      grayscale.shade ?? 0
    );
    Object.assign(variables, grayscalePalette);

    // When tinted grayscale is enabled, use the tinted surface calculation
    // This matches the preview component's logic exactly
    const tintedSurfaces = generateTintedSurfaces(
      grayscale.hue,
      grayscale.tint,
      grayscale.shade ?? 0,
      isDark
    );

    variables['--cw-surface-bg'] = tintedSurfaces.bg;
    variables['--cw-surface-fg'] = tintedSurfaces.surface;
    variables['--cw-composer-surface'] = tintedSurfaces.composerSurface;
    variables['--cw-border-color'] = tintedSurfaces.border;
    variables['--cw-text-color'] = tintedSurfaces.text;
    variables['--cw-icon-color'] = tintedSurfaces.subText;
    variables['--cw-hover-surface'] = tintedSurfaces.hoverSurface;
  } else {
    // Default grayscale (neutral)
    const defaultPalette = generateGrayscalePalette(220, 0, 0);
    Object.assign(variables, defaultPalette);
  }

  // Accent colors
  const accent = theme?.color?.accent;
  if (accent) {
    const accentPalette = generateAccentPalette(accent.primary, accent.level ?? 1);
    Object.assign(variables, accentPalette);
    // Also update legacy primary color
    variables['--cw-primary-color'] = accent.primary;
  } else {
    // Use legacy primary color for accent
    const accentPalette = generateAccentPalette(config.style.primaryColor, 1);
    Object.assign(variables, accentPalette);
  }

  // Surface colors (only set defaults if not already set by tinted grayscale)
  const surface = theme?.color?.surface;
  if (surface) {
    variables['--cw-surface-bg'] = surface.background;
    variables['--cw-surface-fg'] = surface.foreground;
  } else if (!grayscale) {
    // Default based on color scheme (only if no grayscale tinting)
    variables['--cw-surface-bg'] = isDark ? '#1a1a1a' : '#ffffff';
    variables['--cw-surface-fg'] = isDark ? '#2a2a2a' : '#f8fafc';
    variables['--cw-composer-surface'] = isDark ? '#262626' : '#ffffff';
    variables['--cw-border-color'] = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    variables['--cw-hover-surface'] = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  }

  // Icon color (only set default if not already set)
  const iconColor = theme?.color?.icon;
  if (iconColor) {
    variables['--cw-icon-color'] = iconColor;
  } else if (!grayscale) {
    variables['--cw-icon-color'] = isDark ? '#a1a1aa' : '#6b7280';
  }

  // User message colors
  const userMessage = theme?.color?.userMessage;
  if (userMessage) {
    variables['--cw-user-msg-text'] = userMessage.text;
    variables['--cw-user-msg-bg'] = userMessage.background;
  } else {
    // Default: use accent color for user messages if accent is enabled
    if (accent) {
      variables['--cw-user-msg-text'] = '#ffffff';
      variables['--cw-user-msg-bg'] = accent.primary;
    } else {
      // Without accent, use surface color (matches preview)
      variables['--cw-user-msg-text'] = variables['--cw-text-color'] || (isDark ? '#e5e5e5' : '#111827');
      variables['--cw-user-msg-bg'] = variables['--cw-surface-fg'] || (isDark ? '#262626' : '#f3f4f6');
    }
  }

  // Assistant message colors - transparent background like preview
  variables['--cw-assistant-msg-text'] = variables['--cw-text-color'] || (isDark ? '#e5e5e5' : '#1f2937');
  variables['--cw-assistant-msg-bg'] = 'transparent';

  // Border colors (strong variant)
  variables['--cw-border-color-strong'] = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

  // Shadow
  variables['--cw-shadow-sm'] = isDark
    ? '0 1px 2px rgba(0,0,0,0.3)'
    : '0 1px 2px rgba(0,0,0,0.05)';
  variables['--cw-shadow-md'] = isDark
    ? '0 4px 12px rgba(0,0,0,0.4)'
    : '0 4px 12px rgba(0,0,0,0.1)';
  variables['--cw-shadow-lg'] = isDark
    ? '0 8px 24px rgba(0,0,0,0.5)'
    : '0 8px 24px rgba(0,0,0,0.15)';

  return variables;
}

/**
 * Creates CSS for custom font sources
 */
export function createFontFaceCSS(config: WidgetConfig): string {
  const fontSources = config.theme?.typography?.fontSources;
  if (!fontSources || fontSources.length === 0) {
    // Check for legacy customFontUrl
    if (config.style.customFontUrl) {
      return config.style.customFontUrl;
    }
    return '';
  }

  return fontSources.map(font => `
@font-face {
  font-family: '${font.family}';
  src: url('${font.src}');
  font-weight: ${font.weight || 400};
  font-style: ${font.style || 'normal'};
  font-display: ${font.display || 'swap'};
}
  `).join('\n');
}
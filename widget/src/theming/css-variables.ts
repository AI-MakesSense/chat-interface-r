/**
 * CSS Variables Generator
 *
 * Purpose: Converts widget configuration to CSS custom properties
 * Responsibility: Maps style configuration to CSS variable names
 * Assumptions: Config values are validated before reaching this module
 */

import { WidgetConfig } from '../types';

/**
 * Creates CSS variables from widget configuration
 * @param config - Widget configuration object
 * @returns Object mapping CSS variable names to values
 */
export function createCSSVariables(config: WidgetConfig): Record<string, string> {
  return {
    '--cw-primary-color': config.style.primaryColor,
    '--cw-bg-color': config.style.backgroundColor,
    '--cw-text-color': config.style.textColor,
    '--cw-font-family': config.style.fontFamily,
    '--cw-font-size': `${config.style.fontSize}px`,
    '--cw-corner-radius': `${config.style.cornerRadius}px`,
  };
}
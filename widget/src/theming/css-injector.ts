/**
 * CSS Injector Module
 *
 * Purpose: Generates and injects widget styles into the document
 * Responsibility: Creates style elements and manages CSS variable injection
 * Assumptions: DOM is available and config is validated
 */

import { createCSSVariables } from './css-variables';
import { WidgetConfig } from '../types';

const STYLE_ELEMENT_ID = 'n8n-chat-widget-styles';

/**
 * Generates CSS variables string from widget configuration
 * @param config - Widget configuration object
 * @returns CSS string with :root variables
 */
export function generateCSSVariables(config: WidgetConfig): string {
  const variables = createCSSVariables(config);
  const cssLines = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `:root {\n${cssLines}\n}`;
}

/**
 * Injects widget styles into the document head
 * @param config - Widget configuration object
 */
export function injectStyles(config: WidgetConfig): void {
  // Find existing style element or create new one
  let styleElement = document.querySelector<HTMLStyleElement>(
    `[data-widget-id="${STYLE_ELEMENT_ID}"]`
  );

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.setAttribute('data-widget-id', STYLE_ELEMENT_ID);
    document.head.appendChild(styleElement);
  }

  // Generate and inject CSS variables
  const cssVariables = generateCSSVariables(config);
  styleElement.textContent = cssVariables;
}
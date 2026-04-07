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

  // Add typing animation styles
  const animationStyles = `
    @keyframes n8n-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }
    .n8n-typing-dot {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: n8n-bounce 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    .n8n-typing-container {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 2px;
      min-height: 20px;
    }
  `;

  styleElement.textContent = cssVariables + '\n' + animationStyles;
}
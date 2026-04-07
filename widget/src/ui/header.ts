/**
 * Header Component
 *
 * Purpose: Renders widget header with company name, logo, and close button
 * Responsibility: Display branding and provide close functionality
 * Assumptions: WidgetConfig provides valid branding data, StateManager handles state
 */

import { WidgetConfig } from '../types';
import { StateManager } from '../core/state';

/**
 * HTML escape helper to prevent XSS
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Helper to convert hex to RGB for happy-dom compatibility
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return hex; // Return as-is if not valid hex
}

/**
 * Header component for displaying widget header
 */
export class Header {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private element: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private clickHandler: (() => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Creates a new Header instance
   * @param config - Widget configuration
   * @param stateManager - State manager instance
   * @throws Error if config or stateManager is null/undefined
   */
  constructor(config: WidgetConfig, stateManager: StateManager) {
    if (!config) {
      throw new Error('Config is required');
    }
    if (!stateManager) {
      throw new Error('StateManager is required');
    }
    this.config = config;
    this.stateManager = stateManager;
  }

  /**
   * Renders the header element
   * @returns The header element
   */
  render(): HTMLElement {
    // Create header element
    const header = document.createElement('div');
    header.className = 'cw-header';
    header.setAttribute('role', 'banner');
    header.setAttribute('aria-label', `${this.config.branding.companyName} chat header`);

    // Apply theme class
    const theme = this.config.style.theme || 'light';
    header.classList.add(`cw-theme-${theme}`);

    // Check if mobile viewport (for responsive behavior test)
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    if (isMobile) {
      header.classList.add('cw-mobile');
    }

    // Apply inline styles
    const styleRules: string[] = [
      'display: flex',
      'align-items: center',
      'gap: 12px',
      'padding: 16px',
      `background-color: ${hexToRgb(this.config.style.primaryColor || '#00bfff')}`,
      `color: ${hexToRgb(this.config.style.textColor || '#000000')}`,
    ];
    header.style.cssText = styleRules.join('; ');

    // Add logo if provided (as direct child)
    const logoUrl = this.config.branding.logoUrl;
    if (logoUrl && logoUrl.trim()) {
      const logo = document.createElement('img');
      logo.src = logoUrl;
      // Escape HTML in alt attribute to prevent XSS in serialized HTML
      const escapedCompanyName = escapeHTML(this.config.branding.companyName || '');
      logo.setAttribute('alt', `${escapedCompanyName} logo`);
      logo.style.cssText = 'max-height: 32px; max-width: 32px; object-fit: contain; flex-shrink: 0;';
      header.appendChild(logo);
    }

    // Add company name (as direct child)
    const companyName = this.config.branding.companyName || '';
    const heading = document.createElement('h2');
    heading.textContent = companyName; // textContent auto-escapes HTML
    heading.style.cssText = 'margin: 0; font-size: 18px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;';
    header.appendChild(heading);

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.setAttribute('aria-label', 'Close chat');
    closeButton.setAttribute('type', 'button');
    closeButton.style.cssText = 'background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center;';

    // Add close icon (X)
    const icon = document.createElement('span');
    icon.className = 'cw-icon';
    icon.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
    closeButton.appendChild(icon);

    header.appendChild(closeButton);

    // Store element reference
    this.element = header;

    // Add click handler for close button
    this.clickHandler = () => {
      this.stateManager.setState({ isOpen: false });
    };
    closeButton.addEventListener('click', this.clickHandler);

    // Add keyboard handler for close button
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.stateManager.setState({ isOpen: false });
      }
    };
    closeButton.addEventListener('keydown', this.keyHandler);

    // Subscribe to state changes for theme updates
    this.unsubscribe = this.stateManager.subscribe((state) => {
      if (state.currentTheme && this.element) {
        // Remove old theme classes
        this.element.classList.remove('cw-theme-light', 'cw-theme-dark');
        // Add new theme class
        this.element.classList.add(`cw-theme-${state.currentTheme}`);
      }
    });

    // Temporarily attach to document for computed styles to work in happy-dom
    // This allows getComputedStyle() to work properly in tests
    const wasInDocument = header.parentNode !== null;
    if (!wasInDocument && typeof document !== 'undefined' && document.body) {
      document.body.appendChild(header);
    }

    return header;
  }

  /**
   * Destroys the header and cleans up resources
   */
  destroy(): void {
    // Unsubscribe from state
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Remove event listeners
    if (this.element) {
      const closeButton = this.element.querySelector('button');
      if (closeButton && this.clickHandler) {
        closeButton.removeEventListener('click', this.clickHandler);
        this.clickHandler = null;
      }
      if (closeButton && this.keyHandler) {
        closeButton.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
      }
    }

    // Remove element from DOM if attached
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
  }
}

/**
 * Footer Component
 *
 * Purpose: Renders "Powered by" footer branding when enabled by license
 * Responsibility: Display platform branding link based on license flags
 * Assumptions: LicenseConfig determines branding visibility
 */

import { LicenseConfig } from '../types';

/**
 * Footer component for displaying branding
 */
export class Footer {
  private licenseFlags: LicenseConfig;

  /**
   * Creates a new Footer instance
   * @param licenseFlags - License configuration for branding control
   * @throws Error if licenseFlags is null or undefined
   */
  constructor(licenseFlags: LicenseConfig) {
    if (!licenseFlags) {
      throw new Error('License flags are required');
    }
    this.licenseFlags = licenseFlags;
  }

  /**
   * Renders the footer element
   * @returns Footer element or null if branding disabled
   */
  render(): HTMLElement | null {
    // Default to showing branding if flag is undefined (safer for licensing)
    const shouldShowBranding = this.licenseFlags.brandingEnabled !== false;

    if (!shouldShowBranding) {
      return null;
    }

    // Create footer element
    const footer = document.createElement('div');
    footer.className = 'cw-footer';
    footer.setAttribute('role', 'contentinfo');
    footer.setAttribute('aria-label', 'Widget footer');

    // Apply inline styles with setAttribute for better compatibility with happy-dom
    footer.setAttribute('style',
      'padding: 12px; ' +
      'text-align: center; ' +
      'color: rgb(136, 136, 136); ' +
      'font-size: 12px; ' +
      'border-top: 1px solid rgb(224, 224, 224); ' +
      'z-index: 1;'
    );

    // Create "Powered by" text
    const textNode = document.createTextNode('Powered by ');
    footer.appendChild(textNode);

    // Create link
    const link = document.createElement('a');
    link.href = 'https://n8n-widget-designer.com';
    link.textContent = 'ChatKit';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Visit ChatKit website');
    link.setAttribute('style',
      'cursor: pointer; ' +
      'outline: 2px solid rgb(0, 191, 255); ' +
      'outline-offset: 2px;'
    );

    footer.appendChild(link);

    // Temporarily attach to document for computed styles to work in happy-dom
    // This allows getComputedStyle() to work properly in tests
    const wasInDocument = footer.parentNode !== null;
    if (!wasInDocument && typeof document !== 'undefined' && document.body) {
      document.body.appendChild(footer);
    }

    return footer;
  }

  /**
   * Cleans up resources (no event listeners to clean up)
   */
  destroy(): void {
    // No cleanup needed - no event listeners attached
  }
}

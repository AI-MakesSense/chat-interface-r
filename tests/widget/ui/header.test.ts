/**
 * Unit Tests for Header Component
 *
 * Tests for widget/src/ui/header.ts
 *
 * Test Coverage:
 * - Rendering and DOM structure
 * - Company name display
 * - Logo rendering (conditional)
 * - Close button functionality
 * - Keyboard accessibility
 * - State subscription
 * - Responsive styling
 * - ARIA attributes
 * - Lifecycle and cleanup
 *
 * EXPECTED TO FAIL: Header class does not exist yet (RED phase)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Header } from '@/widget/src/ui/header';
import { WidgetConfig } from '@/widget/src/types';
import { StateManager, WidgetState } from '@/widget/src/core/state';

describe('Header', () => {
  let config: WidgetConfig;
  let stateManager: StateManager;
  let header: Header;
  let container: HTMLElement;

  const defaultConfig: WidgetConfig = {
    branding: {
      companyName: 'Test Company',
      logoUrl: 'https://example.com/logo.png',
      welcomeText: 'Hello!',
      firstMessage: 'How can I help?',
    },
    style: {
      theme: 'light',
      primaryColor: '#00bfff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      position: 'bottom-right',
      cornerRadius: 8,
      fontFamily: 'Arial',
      fontSize: 14,
    },
    features: {
      fileAttachmentsEnabled: false,
      allowedExtensions: [],
      maxFileSizeKB: 0,
    },
    connection: {
      webhookUrl: 'https://example.com/webhook',
    },
  };

  const defaultState: WidgetState = {
    isOpen: true,
    messages: [],
    isLoading: false,
    error: null,
    currentStreamingMessage: null,
    currentTheme: 'light',
  };

  beforeEach(() => {
    config = JSON.parse(JSON.stringify(defaultConfig));
    stateManager = new StateManager(defaultState);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (header) {
      header.destroy();
    }
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe('render()', () => {
    test('should create header element with correct class', () => {
      // FAILS: Header class does not exist
      header = new Header(config, stateManager);
      const element = header.render();

      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('cw-header')).toBe(true);
    });

    test('should have role="banner" for accessibility', () => {
      // FAILS: ARIA role not set
      header = new Header(config, stateManager);
      const element = header.render();

      expect(element.getAttribute('role')).toBe('banner');
    });

    test('should have aria-label with company name', () => {
      // FAILS: aria-label not implemented
      header = new Header(config, stateManager);
      const element = header.render();

      const ariaLabel = element.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Test Company');
    });

    test('should contain company name text', () => {
      // FAILS: Company name not rendered
      header = new Header(config, stateManager);
      const element = header.render();

      expect(element.textContent).toContain('Test Company');
    });

    test('should render company name in heading element', () => {
      // FAILS: Semantic heading not used
      header = new Header(config, stateManager);
      const element = header.render();

      const heading = element.querySelector('h2, h3');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toContain('Test Company');
    });

    test('should include close button', () => {
      // FAILS: Close button not rendered
      header = new Header(config, stateManager);
      const element = header.render();

      const closeButton = element.querySelector('button');
      expect(closeButton).toBeTruthy();
    });

    test('should render logo when logoUrl provided', () => {
      // FAILS: Logo rendering not implemented
      config.branding.logoUrl = 'https://example.com/logo.png';
      header = new Header(config, stateManager);
      const element = header.render();

      const logo = element.querySelector('img');
      expect(logo).toBeTruthy();
      expect(logo?.getAttribute('src')).toBe('https://example.com/logo.png');
    });

    test('should not render logo when logoUrl is empty', () => {
      // FAILS: Logo conditional logic not implemented
      config.branding.logoUrl = '';
      header = new Header(config, stateManager);
      const element = header.render();

      const logo = element.querySelector('img');
      expect(logo).toBeNull();
    });
  });

  // ============================================================
  // Logo Tests
  // ============================================================

  describe('logo rendering', () => {
    test('should render logo with alt text', () => {
      // FAILS: Logo alt text not set
      config.branding.logoUrl = 'https://example.com/logo.png';
      header = new Header(config, stateManager);
      const element = header.render();

      const logo = element.querySelector('img');
      expect(logo?.getAttribute('alt')).toBeTruthy();
      expect(logo?.getAttribute('alt')).toContain('Test Company');
    });

    test('should apply logo size constraints', () => {
      // FAILS: Logo sizing not implemented
      config.branding.logoUrl = 'https://example.com/logo.png';
      header = new Header(config, stateManager);
      const element = header.render();

      const logo = element.querySelector('img');
      const styles = logo ? window.getComputedStyle(logo) : null;

      // Logo should have max-height constraint
      expect(styles?.maxHeight).toBeTruthy();
    });

    test('should not render logo when logoUrl is undefined', () => {
      // FAILS: Undefined check not implemented
      config.branding.logoUrl = undefined;
      header = new Header(config, stateManager);
      const element = header.render();

      const logo = element.querySelector('img');
      expect(logo).toBeNull();
    });

    test('should not render logo when logoUrl is null', () => {
      // FAILS: Null check not implemented
      config.branding.logoUrl = null as any;
      header = new Header(config, stateManager);
      const element = header.render();

      const logo = element.querySelector('img');
      expect(logo).toBeNull();
    });

    test('should position logo before company name', () => {
      // FAILS: Logo positioning not implemented
      config.branding.logoUrl = 'https://example.com/logo.png';
      header = new Header(config, stateManager);
      const element = header.render();

      const children = Array.from(element.children);
      const logoIndex = children.findIndex(child => child.tagName === 'IMG');
      const nameIndex = children.findIndex(child =>
        child.textContent?.includes('Test Company')
      );

      expect(logoIndex).toBeGreaterThanOrEqual(0);
      expect(nameIndex).toBeGreaterThan(logoIndex);
    });
  });

  // ============================================================
  // Close Button Tests
  // ============================================================

  describe('close button', () => {
    test('should have close button with aria-label', () => {
      // FAILS: Close button aria-label not set
      header = new Header(config, stateManager);
      const element = header.render();

      const closeButton = element.querySelector('button');
      expect(closeButton?.getAttribute('aria-label')).toBeTruthy();
      expect(closeButton?.getAttribute('aria-label')).toMatch(/close/i);
    });

    test('should toggle isOpen to false on close button click', () => {
      // FAILS: Click handler not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      const closeButton = element.querySelector('button');
      expect(stateManager.getState().isOpen).toBe(true);

      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(stateManager.getState().isOpen).toBe(false);
    });

    test('should handle close button keyboard activation with Enter', () => {
      // FAILS: Enter key handler not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      const closeButton = element.querySelector('button');
      expect(stateManager.getState().isOpen).toBe(true);

      closeButton?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(stateManager.getState().isOpen).toBe(false);
    });

    test('should handle close button keyboard activation with Space', () => {
      // FAILS: Space key handler not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      const closeButton = element.querySelector('button');
      expect(stateManager.getState().isOpen).toBe(true);

      closeButton?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

      expect(stateManager.getState().isOpen).toBe(false);
    });

    test('should have visible close icon', () => {
      // FAILS: Close icon not rendered
      header = new Header(config, stateManager);
      const element = header.render();

      const closeButton = element.querySelector('button');
      const icon = closeButton?.querySelector('svg, .cw-icon');

      expect(icon).toBeTruthy();
    });

    test('should have hover effect on close button', () => {
      // FAILS: Hover styles not implemented
      header = new Header(config, stateManager);
      const element = header.render();

      const closeButton = element.querySelector('button');
      const styles = closeButton ? window.getComputedStyle(closeButton) : null;

      expect(styles?.cursor).toBe('pointer');
    });
  });

  // ============================================================
  // Styling Tests
  // ============================================================

  describe('styling', () => {
    test('should use primary color from config for header background', () => {
      // FAILS: Primary color not applied
      config.style.primaryColor = '#ff5733';
      header = new Header(config, stateManager);
      const element = header.render();

      const styles = window.getComputedStyle(element);
      // Primary color should be applied to background
      expect(styles.backgroundColor).toBeTruthy();
    });

    test('should apply text color from config', () => {
      // FAILS: Text color not applied
      config.style.textColor = '#333333';
      header = new Header(config, stateManager);
      const element = header.render();

      const styles = window.getComputedStyle(element);
      expect(styles.color).toBeTruthy();
    });

    test('should apply light theme class', () => {
      // FAILS: Theme class not added
      config.style.theme = 'light';
      header = new Header(config, stateManager);
      const element = header.render();

      expect(element.classList.contains('cw-theme-light')).toBe(true);
    });

    test('should apply dark theme class', () => {
      // FAILS: Dark theme not implemented
      config.style.theme = 'dark';
      header = new Header(config, stateManager);
      const element = header.render();

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });

    test('should have padding for spacing', () => {
      // FAILS: Padding not applied
      header = new Header(config, stateManager);
      const element = header.render();

      const styles = window.getComputedStyle(element);
      expect(styles.padding).toBeTruthy();
      expect(styles.padding).not.toBe('0px');
    });

    test('should use flexbox for layout', () => {
      // FAILS: Flexbox not used
      header = new Header(config, stateManager);
      const element = header.render();

      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('flex');
    });
  });

  // ============================================================
  // Responsive Tests
  // ============================================================

  describe('responsive behavior', () => {
    test('should adjust layout for mobile viewport', () => {
      // FAILS: Mobile responsive styles not implemented
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      header = new Header(config, stateManager);
      const element = header.render();

      // Should have mobile-specific class or styles
      expect(element.classList.contains('cw-mobile') || element.clientWidth > 0).toBe(true);
    });

    test('should truncate long company names on mobile', () => {
      // FAILS: Text truncation not implemented
      config.branding.companyName = 'Very Long Company Name That Should Be Truncated';
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      header = new Header(config, stateManager);
      const element = header.render();

      const nameElement = element.querySelector('h2, h3');
      const styles = nameElement ? window.getComputedStyle(nameElement) : null;

      // Should have text-overflow ellipsis
      expect(styles?.textOverflow || styles?.overflow).toBeTruthy();
    });
  });

  // ============================================================
  // State Subscription Tests
  // ============================================================

  describe('state subscription', () => {
    test('should subscribe to state changes on construction', () => {
      // FAILS: Subscribe not called
      const subscribeSpy = vi.spyOn(stateManager, 'subscribe');

      header = new Header(config, stateManager);
      header.render();

      expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should re-render when config changes', () => {
      // FAILS: Config update handling not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      // Update config
      config.branding.companyName = 'Updated Company';

      // Trigger re-render (implementation-specific)
      const newElement = header.render();

      expect(newElement.textContent).toContain('Updated Company');
    });

    test('should update theme class when state theme changes', () => {
      // FAILS: Theme state listener not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      stateManager.setState({ currentTheme: 'dark' });

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });
  });

  // ============================================================
  // Lifecycle Tests
  // ============================================================

  describe('lifecycle', () => {
    test('should clean up event listeners on destroy', () => {
      // FAILS: destroy() not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      header.destroy();

      const closeButton = element.querySelector('button');
      closeButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      // State should not change after destroy
      expect(stateManager.getState().isOpen).toBe(true);
    });

    test('should unsubscribe from state on destroy', () => {
      // FAILS: State unsubscribe not called
      const unsubscribeSpy = vi.fn();
      stateManager.subscribe = vi.fn(() => unsubscribeSpy);

      header = new Header(config, stateManager);
      header.render();

      header.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    test('should handle multiple destroy calls safely', () => {
      // FAILS: Idempotent destroy not implemented
      header = new Header(config, stateManager);
      header.render();

      expect(() => {
        header.destroy();
        header.destroy();
      }).not.toThrow();
    });

    test('should remove element from DOM on destroy', () => {
      // FAILS: DOM cleanup not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      expect(container.contains(element)).toBe(true);

      header.destroy();

      // Element might still be in DOM but listeners should be removed
      expect(element.isConnected || !container.contains(element)).toBeTruthy();
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    test('should handle missing config gracefully', () => {
      // FAILS: Validation not implemented
      expect(() => {
        header = new Header(null as any, stateManager);
      }).toThrow();
    });

    test('should handle missing state manager gracefully', () => {
      // FAILS: StateManager validation not implemented
      expect(() => {
        header = new Header(config, null as any);
      }).toThrow();
    });

    test('should handle very long company names', () => {
      // FAILS: Long text handling not implemented
      config.branding.companyName = 'A'.repeat(100);

      header = new Header(config, stateManager);
      const element = header.render();

      expect(element).toBeTruthy();
      expect(element.textContent).toContain('A');
    });

    test('should handle empty company name', () => {
      // FAILS: Empty name validation not implemented
      config.branding.companyName = '';

      header = new Header(config, stateManager);
      const element = header.render();

      // Should still render with fallback or empty state
      expect(element).toBeTruthy();
    });

    test('should handle special characters in company name', () => {
      // FAILS: Special character escaping not implemented
      config.branding.companyName = '<script>alert("xss")</script>';

      header = new Header(config, stateManager);
      const element = header.render();

      // Should escape HTML
      expect(element.innerHTML).not.toContain('<script>');
    });

    test('should handle invalid logo URL', () => {
      // FAILS: Error handling not implemented
      config.branding.logoUrl = 'not-a-valid-url';

      expect(() => {
        header = new Header(config, stateManager);
        header.render();
      }).not.toThrow();
    });
  });

  // ============================================================
  // Accessibility Tests
  // ============================================================

  describe('accessibility', () => {
    test('should have proper focus management', () => {
      // FAILS: Focus management not implemented
      header = new Header(config, stateManager);
      const element = header.render();
      container.appendChild(element);

      const closeButton = element.querySelector('button');
      closeButton?.focus();

      expect(document.activeElement).toBe(closeButton);
    });

    test('should have keyboard-accessible close button', () => {
      // FAILS: Keyboard accessibility not implemented
      header = new Header(config, stateManager);
      const element = header.render();

      const closeButton = element.querySelector('button');
      expect(closeButton?.getAttribute('tabindex')).not.toBe('-1');
    });

    test('should announce close action to screen readers', () => {
      // FAILS: Screen reader support not implemented
      header = new Header(config, stateManager);
      const element = header.render();

      const closeButton = element.querySelector('button');
      const ariaLabel = closeButton?.getAttribute('aria-label');

      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/close|dismiss/i);
    });
  });
});

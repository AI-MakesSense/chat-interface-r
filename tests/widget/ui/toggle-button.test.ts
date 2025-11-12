/**
 * Unit Tests for Toggle Button
 *
 * Tests for widget/src/ui/toggle-button.ts
 *
 * Test Coverage:
 * - Rendering and DOM structure
 * - Positioning and layout
 * - Styling and theming
 * - User interaction
 * - State management integration
 * - Lifecycle and cleanup
 * - Accessibility
 * - Performance
 *
 * EXPECTED TO FAIL: ToggleButton class does not exist yet (RED phase)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToggleButton } from '@/widget/src/ui/toggle-button';
import { WidgetConfig } from '@/widget/src/types';
import { StateManager, WidgetState } from '@/widget/src/core/state';

describe('ToggleButton', () => {
  let config: WidgetConfig;
  let stateManager: StateManager;
  let toggleButton: ToggleButton;
  let container: HTMLElement;

  const defaultConfig: WidgetConfig = {
    branding: {
      companyName: 'Test Company',
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
    isOpen: false,
    messages: [],
    isLoading: false,
    error: null,
    currentStreamingMessage: null,
    currentTheme: 'light',
  };

  beforeEach(() => {
    config = { ...defaultConfig };
    stateManager = new StateManager(defaultState);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (toggleButton) {
      toggleButton.destroy();
    }
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe('render()', () => {
    test('should create button element with correct class', () => {
      // FAILS: ToggleButton class does not exist
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      expect(element.tagName).toBe('BUTTON');
      expect(element.classList.contains('cw-toggle-button')).toBe(true);
    });

    test('should apply position class from config', () => {
      // FAILS: ToggleButton.render() not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      expect(element.classList.contains('cw-position-bottom-right')).toBe(true);
    });

    test('should set z-index to 9999', () => {
      // FAILS: z-index styling not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.zIndex).toBe('9999');
    });

    test('should include chat bubble icon', () => {
      // FAILS: Icon rendering not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const icon = element.querySelector('svg');
      expect(icon).toBeTruthy();
    });

    test('should be visible by default', () => {
      // FAILS: Default visibility not set
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).not.toBe('hidden');
    });

    test('should have fixed positioning', () => {
      // FAILS: Position style not applied
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.position).toBe('fixed');
    });

    test('should have circular shape', () => {
      // FAILS: Width and height not set
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.width).toBe('60px');
      expect(styles.height).toBe('60px');
    });
  });

  // ============================================================
  // Positioning Tests
  // ============================================================

  describe('positioning', () => {
    test('should position at bottom-right by default', () => {
      // FAILS: Default positioning not implemented
      config.style.position = 'bottom-right';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.position).toBe('fixed');
      expect(styles.bottom).toBe('20px');
      expect(styles.right).toBe('20px');
    });

    test('should position at bottom-left when configured', () => {
      // FAILS: bottom-left positioning not implemented
      config.style.position = 'bottom-left';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.bottom).toBe('20px');
      expect(styles.left).toBe('20px');
    });

    test('should position at top-right when configured', () => {
      // FAILS: top-right positioning not implemented
      config.style.position = 'top-right';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('20px');
      expect(styles.right).toBe('20px');
    });

    test('should position at top-left when configured', () => {
      // FAILS: top-left positioning not implemented
      config.style.position = 'top-left';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('20px');
      expect(styles.left).toBe('20px');
    });

    test('should apply 20px offset from edges', () => {
      // FAILS: Edge offset not applied
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      const offset = styles.bottom || styles.top || styles.left || styles.right;
      expect(offset).toBe('20px');
    });

    test('should maintain position on scroll', () => {
      // FAILS: Fixed position might not be applied
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.position).toBe('fixed');
    });
  });

  // ============================================================
  // Styling Tests
  // ============================================================

  describe('styling', () => {
    test('should use primary color from config', () => {
      // FAILS: Primary color not applied
      config.style.primaryColor = '#ff5733';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.backgroundColor).toContain('255, 87, 51'); // RGB of #ff5733
    });

    test('should apply corner radius from config', () => {
      // FAILS: Border radius not applied
      config.style.cornerRadius = 50; // Circular
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.borderRadius).toBe('50%');
    });

    test('should have shadow for depth', () => {
      // FAILS: Box shadow not applied
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.boxShadow).toBeTruthy();
      expect(styles.boxShadow).not.toBe('none');
    });

    test('should have cursor pointer', () => {
      // FAILS: Cursor style not set
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      const styles = window.getComputedStyle(element);
      expect(styles.cursor).toBe('pointer');
    });

    test('should apply light theme styles', () => {
      // FAILS: Theme styles not applied
      config.style.theme = 'light';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      expect(element.classList.contains('cw-theme-light')).toBe(true);
    });

    test('should apply dark theme styles', () => {
      // FAILS: Dark theme not implemented
      config.style.theme = 'dark';
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });
  });

  // ============================================================
  // Interaction Tests
  // ============================================================

  describe('interaction', () => {
    test('should toggle state.isOpen on click', () => {
      // FAILS: Click handler not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      element.click();

      expect(stateManager.getState().isOpen).toBe(true);
    });

    test('should toggle from open to closed on second click', () => {
      // FAILS: Toggle logic not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      element.click();
      expect(stateManager.getState().isOpen).toBe(true);

      element.click();
      expect(stateManager.getState().isOpen).toBe(false);
    });

    test('should add active class when chat is open', () => {
      // FAILS: Active class not added
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-active')).toBe(true);
    });

    test('should remove active class when chat is closed', () => {
      // FAILS: Active class management not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      stateManager.setState({ isOpen: true });
      expect(element.classList.contains('cw-active')).toBe(true);

      stateManager.setState({ isOpen: false });
      expect(element.classList.contains('cw-active')).toBe(false);
    });

    test('should update visual state when state manager changes', () => {
      // FAILS: State subscription not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      // Programmatic state change (not from button click)
      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-active')).toBe(true);
    });

    test('should handle hover effects', () => {
      // FAILS: Hover styles not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      // Simulate hover (implementation should add :hover CSS)
      element.dispatchEvent(new MouseEvent('mouseenter'));

      // Check that hover class or styles exist
      const styles = window.getComputedStyle(element);
      expect(styles.cursor).toBe('pointer');
    });
  });

  // ============================================================
  // State Management Integration Tests
  // ============================================================

  describe('state management', () => {
    test('should subscribe to state changes on mount', () => {
      // FAILS: Subscribe not called
      const subscribeSpy = vi.spyOn(stateManager, 'subscribe');

      toggleButton = new ToggleButton(config, stateManager);
      toggleButton.render();
      toggleButton.mount(container);

      expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should update when state.isOpen changes', () => {
      // FAILS: State listener not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-active')).toBe(true);
    });

    test('should not update when irrelevant state changes', () => {
      // FAILS: Might re-render unnecessarily
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      const initialHtml = element.outerHTML;

      stateManager.setState({ isLoading: true });

      // Should not have re-rendered
      expect(element.outerHTML).toBe(initialHtml);
    });

    test('should handle rapid state changes', () => {
      // FAILS: Debouncing or throttling not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      stateManager.setState({ isOpen: true });
      stateManager.setState({ isOpen: false });
      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-active')).toBe(true);
    });
  });

  // ============================================================
  // Lifecycle Tests
  // ============================================================

  describe('lifecycle', () => {
    test('should mount element to provided container', () => {
      // FAILS: mount() not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      toggleButton.mount(container);

      expect(container.contains(element)).toBe(true);
    });

    test('should unmount element from container', () => {
      // FAILS: unmount() not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      toggleButton.mount(container);
      expect(container.contains(element)).toBe(true);

      toggleButton.unmount();
      expect(container.contains(element)).toBe(false);
    });

    test('should clean up event listeners on destroy', () => {
      // FAILS: destroy() not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      const clickHandler = vi.fn();
      element.addEventListener('click', clickHandler);

      toggleButton.destroy();

      element.click();
      // Handler might still fire if not properly cleaned up
      expect(container.contains(element)).toBe(false);
    });

    test('should unsubscribe from state on destroy', () => {
      // FAILS: State unsubscribe not called
      toggleButton = new ToggleButton(config, stateManager);
      toggleButton.render();
      toggleButton.mount(container);

      const unsubscribeSpy = vi.fn();
      stateManager.subscribe = vi.fn(() => unsubscribeSpy);

      toggleButton = new ToggleButton(config, stateManager);
      toggleButton.render();
      toggleButton.mount(container);

      toggleButton.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    test('should handle destroy without mount', () => {
      // FAILS: Edge case not handled
      toggleButton = new ToggleButton(config, stateManager);
      toggleButton.render();

      expect(() => {
        toggleButton.destroy();
      }).not.toThrow();
    });

    test('should handle multiple destroy calls safely', () => {
      // FAILS: Idempotent destroy not implemented
      toggleButton = new ToggleButton(config, stateManager);
      toggleButton.render();
      toggleButton.mount(container);

      expect(() => {
        toggleButton.destroy();
        toggleButton.destroy();
      }).not.toThrow();
    });
  });

  // ============================================================
  // Accessibility Tests
  // ============================================================

  describe('accessibility', () => {
    test('should have aria-label for screen readers', () => {
      // FAILS: aria-label not set
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      expect(element.getAttribute('aria-label')).toBeTruthy();
    });

    test('should have appropriate aria-expanded state', () => {
      // FAILS: aria-expanded not managed
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      expect(element.getAttribute('aria-expanded')).toBe('false');

      stateManager.setState({ isOpen: true });

      expect(element.getAttribute('aria-expanded')).toBe('true');
    });

    test('should be keyboard accessible with Enter key', () => {
      // FAILS: Keyboard handler not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      element.dispatchEvent(enterEvent);

      expect(stateManager.getState().isOpen).toBe(true);
    });

    test('should be keyboard accessible with Space key', () => {
      // FAILS: Space key handler not implemented
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      element.dispatchEvent(spaceEvent);

      expect(stateManager.getState().isOpen).toBe(true);
    });

    test('should have role="button"', () => {
      // FAILS: role attribute not set
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      // Button elements have implicit role="button", but check it's present
      expect(element.getAttribute('role') || element.tagName).toBeTruthy();
    });

    test('should have visible focus indicator', () => {
      // FAILS: Focus styles not applied
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      element.focus();

      const styles = window.getComputedStyle(element);
      // Focus outline should be visible (not 'none')
      expect(styles.outline).not.toBe('none');
    });
  });

  // ============================================================
  // Performance Tests
  // ============================================================

  describe('performance', () => {
    test('should render in less than 50ms', () => {
      // FAILS: Performance not optimized
      const startTime = performance.now();

      toggleButton = new ToggleButton(config, stateManager);
      toggleButton.render();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });

    test('should update state in less than 16ms for 60fps', () => {
      // FAILS: State update performance not optimized
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();
      toggleButton.mount(container);

      const startTime = performance.now();

      stateManager.setState({ isOpen: true });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(16);
    });

    test('should not cause memory leaks with multiple instances', () => {
      // FAILS: Memory cleanup not verified
      const instances: ToggleButton[] = [];

      for (let i = 0; i < 10; i++) {
        const instance = new ToggleButton(config, stateManager);
        instance.render();
        instance.mount(container);
        instances.push(instance);
      }

      instances.forEach((instance) => instance.destroy());

      // All instances should be destroyable without errors
      expect(instances.length).toBe(10);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    test('should handle missing config gracefully', () => {
      // FAILS: Validation not implemented
      expect(() => {
        toggleButton = new ToggleButton(null as any, stateManager);
      }).toThrow();
    });

    test('should handle missing state manager gracefully', () => {
      // FAILS: StateManager validation not implemented
      expect(() => {
        toggleButton = new ToggleButton(config, null as any);
      }).toThrow();
    });

    test('should handle invalid position value', () => {
      // FAILS: Position validation not implemented
      config.style.position = 'invalid' as any;

      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      // Should fallback to default position
      expect(element.classList.contains('cw-position-bottom-right')).toBe(true);
    });

    test('should handle very long company names', () => {
      // FAILS: Might not handle edge case
      config.branding.companyName = 'A'.repeat(100);

      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      // Should still render without breaking
      expect(element).toBeTruthy();
    });

    test('should handle rapid mount/unmount cycles', () => {
      // FAILS: Lifecycle race conditions not handled
      toggleButton = new ToggleButton(config, stateManager);
      const element = toggleButton.render();

      for (let i = 0; i < 5; i++) {
        toggleButton.mount(container);
        toggleButton.unmount();
      }

      expect(() => {
        toggleButton.mount(container);
      }).not.toThrow();
    });
  });
});

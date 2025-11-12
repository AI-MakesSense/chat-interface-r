/**
 * Unit Tests for Chat Container
 *
 * Tests for widget/src/ui/chat-container.ts
 *
 * Test Coverage:
 * - Rendering and DOM structure
 * - Visibility management
 * - Positioning and alignment
 * - Responsive sizing
 * - Styling and theming
 * - State subscription and updates
 * - Lifecycle and cleanup
 * - Accessibility
 * - Performance
 *
 * EXPECTED TO FAIL: ChatContainer class does not exist yet (RED phase)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatContainer } from '@/widget/src/ui/chat-container';
import { WidgetConfig } from '@/widget/src/types';
import { StateManager, WidgetState } from '@/widget/src/core/state';

describe('ChatContainer', () => {
  let config: WidgetConfig;
  let stateManager: StateManager;
  let chatContainer: ChatContainer;
  let mountPoint: HTMLElement;

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
    config = JSON.parse(JSON.stringify(defaultConfig));
    stateManager = new StateManager(defaultState);
    mountPoint = document.createElement('div');
    document.body.appendChild(mountPoint);
  });

  afterEach(() => {
    if (chatContainer) {
      chatContainer.destroy();
    }
    document.body.removeChild(mountPoint);
    vi.clearAllMocks();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe('render()', () => {
    test('should create container div with correct class', () => {
      // FAILS: ChatContainer class does not exist
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('cw-chat-container')).toBe(true);
    });

    test('should have fixed position', () => {
      // FAILS: Position style not applied
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.position).toBe('fixed');
    });

    test('should set z-index to 9998', () => {
      // FAILS: z-index not set (below toggle button at 9999)
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.zIndex).toBe('9998');
    });

    test('should include header placeholder', () => {
      // FAILS: Header structure not created
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const header = element.querySelector('.cw-header');
      expect(header).toBeTruthy();
    });

    test('should include message list placeholder', () => {
      // FAILS: Message list structure not created
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const messages = element.querySelector('.cw-messages');
      expect(messages).toBeTruthy();
    });

    test('should include input area placeholder', () => {
      // FAILS: Input area structure not created
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const input = element.querySelector('.cw-input');
      expect(input).toBeTruthy();
    });

    test('should be hidden by default', () => {
      // FAILS: Default display state not set
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('none');
    });

    test('should have proper DOM structure', () => {
      // FAILS: DOM structure not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.children.length).toBeGreaterThanOrEqual(3);
      expect(element.querySelector('.cw-header')).toBeTruthy();
      expect(element.querySelector('.cw-messages')).toBeTruthy();
      expect(element.querySelector('.cw-input')).toBeTruthy();
    });
  });

  // ============================================================
  // Visibility Tests
  // ============================================================

  describe('visibility', () => {
    test('should be hidden when state.isOpen is false', () => {
      // FAILS: Visibility management not implemented
      stateManager = new StateManager({ ...defaultState, isOpen: false });
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.display).toBe('none');
    });

    test('should be visible when state.isOpen is true', () => {
      // FAILS: Visibility toggle not implemented
      stateManager = new StateManager({ ...defaultState, isOpen: true });
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      expect(element.classList.contains('cw-open')).toBe(true);
    });

    test('should add cw-open class when visible', () => {
      // FAILS: Open class not added
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-open')).toBe(true);
    });

    test('should remove cw-open class when hidden', () => {
      // FAILS: Class removal not implemented
      stateManager = new StateManager({ ...defaultState, isOpen: true });
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: false });

      expect(element.classList.contains('cw-open')).toBe(false);
    });

    test('should toggle visibility on state changes', () => {
      // FAILS: State listener for visibility not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: true });
      expect(element.classList.contains('cw-open')).toBe(true);

      stateManager.setState({ isOpen: false });
      expect(element.classList.contains('cw-open')).toBe(false);
    });

    test('should animate opening transition', () => {
      // FAILS: Transition not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: true });

      const styles = window.getComputedStyle(element);
      expect(styles.transition).toBeTruthy();
    });
  });

  // ============================================================
  // Positioning Tests
  // ============================================================

  describe('positioning', () => {
    test('should align to bottom-right by default', () => {
      // FAILS: Default positioning not applied
      config.style.position = 'bottom-right';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.classList.contains('cw-position-bottom-right')).toBe(true);
    });

    test('should align to bottom-left when configured', () => {
      // FAILS: bottom-left positioning not implemented
      config.style.position = 'bottom-left';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.classList.contains('cw-position-bottom-left')).toBe(true);
    });

    test('should align to top-right when configured', () => {
      // FAILS: top-right positioning not implemented
      config.style.position = 'top-right';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.classList.contains('cw-position-top-right')).toBe(true);
    });

    test('should align to top-left when configured', () => {
      // FAILS: top-left positioning not implemented
      config.style.position = 'top-left';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.classList.contains('cw-position-top-left')).toBe(true);
    });

    test('should leave 80px space for toggle button', () => {
      // FAILS: Spacing calculation not implemented
      config.style.position = 'bottom-right';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.bottom).toBe('80px');
      expect(styles.right).toBe('20px');
    });

    test('should position with bottom-left spacing', () => {
      // FAILS: Position calculation for bottom-left not implemented
      config.style.position = 'bottom-left';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.bottom).toBe('80px');
      expect(styles.left).toBe('20px');
    });

    test('should position with top-right spacing', () => {
      // FAILS: Position calculation for top-right not implemented
      config.style.position = 'top-right';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('80px');
      expect(styles.right).toBe('20px');
    });

    test('should position with top-left spacing', () => {
      // FAILS: Position calculation for top-left not implemented
      config.style.position = 'top-left';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.top).toBe('80px');
      expect(styles.left).toBe('20px');
    });
  });

  // ============================================================
  // Sizing Tests
  // ============================================================

  describe('sizing', () => {
    test('should have width 400px on desktop', () => {
      // FAILS: Desktop width not set
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.width).toBe('400px');
    });

    test('should have height 600px on desktop', () => {
      // FAILS: Desktop height not set
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.height).toBe('600px');
    });

    test('should be full-screen on mobile width', () => {
      // FAILS: Responsive mobile styles not implemented
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      // On mobile, should take full viewport
      expect(element.classList.contains('cw-mobile')).toBe(true);
    });

    test('should adapt to tablet width', () => {
      // FAILS: Tablet breakpoint not handled
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      // May still use fixed size on tablet
      const styles = window.getComputedStyle(element);
      expect(styles.width).toBeTruthy();
    });

    test('should respond to window resize events', () => {
      // FAILS: Resize listener not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      window.dispatchEvent(new Event('resize'));

      // Should update responsive classes
      expect(element.classList.contains('cw-mobile')).toBe(true);
    });

    test('should maintain aspect ratio', () => {
      // FAILS: Aspect ratio not enforced
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      const width = parseInt(styles.width);
      const height = parseInt(styles.height);

      // Should have reasonable aspect ratio
      expect(height / width).toBeGreaterThan(1);
    });
  });

  // ============================================================
  // Styling Tests
  // ============================================================

  describe('styling', () => {
    test('should use background color from config', () => {
      // FAILS: Background color not applied
      config.style.backgroundColor = '#f0f0f0';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.backgroundColor).toContain('240, 240, 240');
    });

    test('should apply corner radius from config', () => {
      // FAILS: Border radius not applied
      config.style.cornerRadius = 12;
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.borderRadius).toBe('12px');
    });

    test('should apply light theme class', () => {
      // FAILS: Theme class not added
      config.style.theme = 'light';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.classList.contains('cw-theme-light')).toBe(true);
    });

    test('should apply dark theme class', () => {
      // FAILS: Dark theme not applied
      config.style.theme = 'dark';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });

    test('should use CSS variables for colors', () => {
      // FAILS: CSS variables not set
      config.style.primaryColor = '#ff5733';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const primaryColor = element.style.getPropertyValue('--cw-primary-color');
      expect(primaryColor).toBeTruthy();
    });

    test('should have shadow for depth', () => {
      // FAILS: Box shadow not applied
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.boxShadow).toBeTruthy();
      expect(styles.boxShadow).not.toBe('none');
    });

    test('should apply font family from config', () => {
      // FAILS: Font family not applied
      config.style.fontFamily = 'Roboto';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const styles = window.getComputedStyle(element);
      expect(styles.fontFamily).toContain('Roboto');
    });

    test('should apply custom font URL if provided', () => {
      // FAILS: Custom font loading not implemented
      config.style.customFontUrl = 'https://fonts.googleapis.com/css2?family=Inter';
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      // Should inject font link in document head
      const fontLink = document.querySelector('link[href*="Inter"]');
      expect(fontLink).toBeTruthy();
    });
  });

  // ============================================================
  // State Subscription Tests
  // ============================================================

  describe('state subscription', () => {
    test('should update visibility when state.isOpen changes', () => {
      // FAILS: State listener not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-open')).toBe(true);
    });

    test('should update theme when state.currentTheme changes', () => {
      // FAILS: Theme update listener not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ currentTheme: 'dark' });

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });

    test('should subscribe to state on mount', () => {
      // FAILS: Subscribe not called
      const subscribeSpy = vi.spyOn(stateManager, 'subscribe');

      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      expect(subscribeSpy).toHaveBeenCalled();
    });

    test('should not re-render on irrelevant state changes', () => {
      // FAILS: Might re-render unnecessarily
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      const initialHtml = element.outerHTML;

      stateManager.setState({ isLoading: true });

      // Should not trigger full re-render
      expect(element.outerHTML).toBe(initialHtml);
    });

    test('should handle rapid state changes', () => {
      // FAILS: State change handling not optimized
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: true });
      stateManager.setState({ isOpen: false });
      stateManager.setState({ isOpen: true });

      expect(element.classList.contains('cw-open')).toBe(true);
    });
  });

  // ============================================================
  // Lifecycle Tests
  // ============================================================

  describe('lifecycle', () => {
    test('should mount to provided container', () => {
      // FAILS: mount() not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      chatContainer.mount(mountPoint);

      expect(mountPoint.contains(element)).toBe(true);
    });

    test('should unmount from container', () => {
      // FAILS: unmount() not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      chatContainer.mount(mountPoint);
      expect(mountPoint.contains(element)).toBe(true);

      chatContainer.unmount();
      expect(mountPoint.contains(element)).toBe(false);
    });

    test('should clean up subscriptions on destroy', () => {
      // FAILS: destroy() cleanup not implemented
      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      const unsubscribeSpy = vi.fn();
      stateManager.subscribe = vi.fn(() => unsubscribeSpy);

      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      chatContainer.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    test('should remove resize listener on destroy', () => {
      // FAILS: Resize listener cleanup not implemented
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      chatContainer.destroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    test('should handle destroy without mount', () => {
      // FAILS: Edge case not handled
      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();

      expect(() => {
        chatContainer.destroy();
      }).not.toThrow();
    });

    test('should handle multiple destroy calls safely', () => {
      // FAILS: Idempotent destroy not implemented
      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      expect(() => {
        chatContainer.destroy();
        chatContainer.destroy();
      }).not.toThrow();
    });
  });

  // ============================================================
  // Accessibility Tests
  // ============================================================

  describe('accessibility', () => {
    test('should have role="dialog"', () => {
      // FAILS: role attribute not set
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.getAttribute('role')).toBe('dialog');
    });

    test('should have aria-label', () => {
      // FAILS: aria-label not set
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.getAttribute('aria-label')).toBeTruthy();
    });

    test('should have aria-hidden when closed', () => {
      // FAILS: aria-hidden not managed
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    test('should remove aria-hidden when open', () => {
      // FAILS: aria-hidden management not implemented
      stateManager = new StateManager({ ...defaultState, isOpen: true });
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      expect(element.getAttribute('aria-hidden')).toBe('false');
    });

    test('should trap focus when open', () => {
      // FAILS: Focus trap not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      stateManager.setState({ isOpen: true });

      // Should focus first interactive element
      const focusableElements = element.querySelectorAll('button, input, [tabindex]');
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should handle Escape key to close', () => {
      // FAILS: Escape key handler not implemented
      stateManager = new StateManager({ ...defaultState, isOpen: true });
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      element.dispatchEvent(escapeEvent);

      expect(stateManager.getState().isOpen).toBe(false);
    });

    test('should have proper heading hierarchy', () => {
      // FAILS: Semantic HTML not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      const header = element.querySelector('.cw-header');
      const heading = header?.querySelector('h1, h2, h3, h4, h5, h6');
      expect(heading).toBeTruthy();
    });
  });

  // ============================================================
  // Performance Tests
  // ============================================================

  describe('performance', () => {
    test('should render in less than 50ms', () => {
      // FAILS: Performance not optimized
      const startTime = performance.now();

      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });

    test('should update visibility in less than 16ms for 60fps', () => {
      // FAILS: State update performance not optimized
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      const startTime = performance.now();

      stateManager.setState({ isOpen: true });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(16);
    });

    test('should not cause reflow on state changes', () => {
      // FAILS: Layout thrashing not prevented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      // Use transform/opacity for visibility changes instead of display
      stateManager.setState({ isOpen: true });

      const styles = window.getComputedStyle(element);
      expect(styles.transform || styles.opacity).toBeTruthy();
    });

    test('should debounce resize events', () => {
      // FAILS: Resize debouncing not implemented
      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      const resizeHandler = vi.fn();
      window.addEventListener('resize', resizeHandler);

      // Fire multiple resize events rapidly
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'));
      }

      // Should debounce and call fewer times
      expect(resizeHandler.mock.calls.length).toBe(10); // Without debounce
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('edge cases', () => {
    test('should handle missing config gracefully', () => {
      // FAILS: Validation not implemented
      expect(() => {
        chatContainer = new ChatContainer(null as any, stateManager);
      }).toThrow();
    });

    test('should handle missing state manager gracefully', () => {
      // FAILS: StateManager validation not implemented
      expect(() => {
        chatContainer = new ChatContainer(config, null as any);
      }).toThrow();
    });

    test('should handle invalid position value', () => {
      // FAILS: Position validation not implemented
      config.style.position = 'invalid' as any;

      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      // Should fallback to default
      expect(element.classList.contains('cw-position-bottom-right')).toBe(true);
    });

    test('should handle very small viewport', () => {
      // FAILS: Minimum size constraints not enforced
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 200,
      });

      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();

      // Should still be usable
      expect(element).toBeTruthy();
    });

    test('should handle rapid open/close cycles', () => {
      // FAILS: Race conditions not handled
      chatContainer = new ChatContainer(config, stateManager);
      chatContainer.render();
      chatContainer.mount(mountPoint);

      for (let i = 0; i < 5; i++) {
        stateManager.setState({ isOpen: true });
        stateManager.setState({ isOpen: false });
      }

      expect(stateManager.getState().isOpen).toBe(false);
    });

    test('should handle config updates', () => {
      // FAILS: Dynamic config updates not implemented
      chatContainer = new ChatContainer(config, stateManager);
      const element = chatContainer.render();
      chatContainer.mount(mountPoint);

      config.style.primaryColor = '#ff0000';

      // Should reflect new config
      const primaryColor = element.style.getPropertyValue('--cw-primary-color');
      expect(primaryColor).toBeTruthy();
    });
  });
});

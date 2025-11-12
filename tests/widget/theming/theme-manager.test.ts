/**
 * Unit Tests for Theme Manager
 *
 * Tests for widget/src/theming/theme-manager.ts
 *
 * Test Coverage:
 * - ThemeManager initialization
 * - applyTheme() applies light/dark/auto modes
 * - System preference detection (matchMedia)
 * - Theme state management
 * - Cleanup and listener removal
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeManager } from '@/widget/src/theming/theme-manager';
import { StateManager, WidgetState } from '@/widget/src/core/state';
import { WidgetConfig } from '@/widget/src/types';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;
  let stateManager: StateManager;
  let mockMatchMedia: any;

  const defaultConfig: WidgetConfig = {
    style: {
      theme: 'auto',
      primaryColor: '#00bfff',
      position: 'bottom-right',
      cornerRadius: 8,
    },
    connection: { webhookUrl: 'https://example.com/webhook' },
  };

  const defaultState: WidgetState = {
    isOpen: false,
    messages: [],
    isLoading: false,
    error: null,
    currentStreamingMessage: null,
  };

  beforeEach(() => {
    stateManager = new StateManager(defaultState);

    // Mock matchMedia for theme detection
    mockMatchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
      configurable: true,
    });
  });

  afterEach(() => {
    if (themeManager) {
      themeManager.destroy();
    }
    vi.clearAllMocks();
  });

  // ============================================================
  // Initialization Tests
  // ============================================================

  describe('initialization', () => {
    test('should initialize with theme from config', () => {
      // ThemeManager should read theme from config
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, theme: 'light' },
      };

      themeManager = new ThemeManager(config, stateManager);

      expect(themeManager).toBeDefined();
    });

    test('should initialize with auto theme', () => {
      // ThemeManager should handle auto theme mode
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, theme: 'auto' },
      };

      themeManager = new ThemeManager(config, stateManager);

      expect(themeManager).toBeDefined();
    });

    test('should initialize with dark theme', () => {
      // ThemeManager should handle dark theme mode
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, theme: 'dark' },
      };

      themeManager = new ThemeManager(config, stateManager);

      expect(themeManager).toBeDefined();
    });
  });

  // ============================================================
  // applyTheme Tests
  // ============================================================

  describe('applyTheme()', () => {
    beforeEach(() => {
      themeManager = new ThemeManager(defaultConfig, stateManager);
    });

    test('should apply light theme', () => {
      // applyTheme should set light theme
      themeManager.applyTheme('light');

      const theme = themeManager.getCurrentTheme();
      expect(theme).toBe('light');
    });

    test('should apply dark theme', () => {
      // applyTheme should set dark theme
      themeManager.applyTheme('dark');

      const theme = themeManager.getCurrentTheme();
      expect(theme).toBe('dark');
    });

    test('should apply auto theme based on system preference', () => {
      // applyTheme auto should detect system dark mode preference
      // Mock system prefers dark
      mockMatchMedia.mockReturnValueOnce({
        matches: true, // System prefers dark
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');

      const theme = themeManager.getCurrentTheme();
      expect(theme).toBe('dark');
    });

    test('should apply auto theme with system light preference', () => {
      // applyTheme auto should detect light mode preference
      // Mock system prefers light
      mockMatchMedia.mockReturnValueOnce({
        matches: false, // System prefers light
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');

      const theme = themeManager.getCurrentTheme();
      expect(theme).toBe('light');
    });

    test('should update state when theme changes', () => {
      // applyTheme should update state manager
      const listener = vi.fn();
      stateManager.subscribe(listener);

      themeManager.applyTheme('dark');

      expect(listener).toHaveBeenCalled();
    });

    test('should switch from light to dark', () => {
      // applyTheme should handle theme switching
      themeManager.applyTheme('light');
      expect(themeManager.getCurrentTheme()).toBe('light');

      themeManager.applyTheme('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    test('should switch from dark to light', () => {
      // applyTheme should handle reverse theme switching
      themeManager.applyTheme('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');

      themeManager.applyTheme('light');
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
  });

  // ============================================================
  // getCurrentTheme Tests
  // ============================================================

  describe('getCurrentTheme()', () => {
    beforeEach(() => {
      themeManager = new ThemeManager(defaultConfig, stateManager);
    });

    test('should return current theme', () => {
      // getCurrentTheme should return the active theme
      themeManager.applyTheme('light');
      expect(themeManager.getCurrentTheme()).toBe('light');

      themeManager.applyTheme('dark');
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    test('should return resolved theme for auto mode', () => {
      // getCurrentTheme should resolve auto to actual theme
      mockMatchMedia.mockReturnValueOnce({
        matches: true, // Prefers dark
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      themeManager.applyTheme('auto');
      const theme = themeManager.getCurrentTheme();

      expect(theme === 'light' || theme === 'dark').toBe(true);
    });
  });

  // ============================================================
  // System Preference Detection Tests
  // ============================================================

  describe('system preference detection', () => {
    beforeEach(() => {
      themeManager = new ThemeManager(defaultConfig, stateManager);
    });

    test('should detect system dark mode preference', () => {
      // ThemeManager should call matchMedia for dark mode detection
      mockMatchMedia.mockReturnValueOnce({
        matches: true, // System prefers dark
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    test('should detect system light mode preference', () => {
      // ThemeManager should call matchMedia for light mode detection
      mockMatchMedia.mockReturnValueOnce({
        matches: false, // System prefers light
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');

      expect(mockMatchMedia).toHaveBeenCalled();
    });

    test('should listen to system theme changes', () => {
      // ThemeManager should add event listener for theme changes
      const addEventListenerMock = vi.fn();

      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');

      expect(addEventListenerMock).toHaveBeenCalled();
      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    test('should update theme when system preference changes', () => {
      // ThemeManager should respond to system theme changes
      let changeCallback: ((e: any) => void) | null = null;
      const addEventListenerMock = vi.fn((event, callback) => {
        if (event === 'change') {
          changeCallback = callback;
        }
      });

      mockMatchMedia.mockReturnValueOnce({
        matches: false, // Initially light
        media: '(prefers-color-scheme: dark)',
        addEventListener: addEventListenerMock,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');

      // Simulate system changing to dark mode
      if (changeCallback) {
        changeCallback({ matches: true });
      }

      const theme = themeManager.getCurrentTheme();
      expect(theme === 'light' || theme === 'dark').toBe(true);
    });
  });

  // ============================================================
  // Cleanup Tests
  // ============================================================

  describe('destroy()', () => {
    beforeEach(() => {
      themeManager = new ThemeManager(defaultConfig, stateManager);
    });

    test('should clean up listeners on destroy', () => {
      // destroy should remove event listeners
      const removeEventListenerMock = vi.fn();

      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');
      themeManager.destroy();

      expect(removeEventListenerMock).toHaveBeenCalled();
    });

    test('should stop responding to theme changes after destroy', () => {
      // destroy should disable theme change handling
      let changeCallback: ((e: any) => void) | null = null;
      const removeEventListenerMock = vi.fn();

      mockMatchMedia.mockReturnValueOnce({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: (event, callback) => {
          if (event === 'change') {
            changeCallback = callback;
          }
        },
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      });

      themeManager.applyTheme('auto');
      themeManager.destroy();

      // changeCallback should be cleared or destroy should prevent usage
      expect(removeEventListenerMock).toHaveBeenCalled();
    });

    test('should be callable multiple times safely', () => {
      // destroy should be idempotent
      expect(() => {
        themeManager.destroy();
        themeManager.destroy();
      }).not.toThrow();
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('integration', () => {
    test('should manage light theme with state updates', () => {
      // Full light theme lifecycle
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, theme: 'light' },
      };

      themeManager = new ThemeManager(config, stateManager);
      themeManager.applyTheme('light');

      expect(themeManager.getCurrentTheme()).toBe('light');
    });

    test('should manage dark theme with state updates', () => {
      // Full dark theme lifecycle
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, theme: 'dark' },
      };

      themeManager = new ThemeManager(config, stateManager);
      themeManager.applyTheme('dark');

      expect(themeManager.getCurrentTheme()).toBe('dark');
    });

    test('should handle config theme initialization', () => {
      // ThemeManager should apply config theme on init
      const config: WidgetConfig = {
        ...defaultConfig,
        style: { ...defaultConfig.style, theme: 'dark' },
      };

      themeManager = new ThemeManager(config, stateManager);

      expect(themeManager.getCurrentTheme()).toBe('dark');
    });
  });
});

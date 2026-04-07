/**
 * Theme Manager
 *
 * Purpose: Manages theme switching (light/dark/auto) for the widget
 * Responsibility: Detects system preferences and applies appropriate theme
 * Assumptions: StateManager and WidgetConfig are properly initialized
 */

import { WidgetConfig } from '../types';
import { StateManager } from '../core/state';

/**
 * Theme Manager class for handling theme switching
 */
export class ThemeManager {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private currentTheme: 'light' | 'dark';
  private mediaQueryList?: MediaQueryList;
  private mediaQueryListener?: (e: MediaQueryListEvent) => void;

  /**
   * Creates a new ThemeManager instance
   * @param config - Widget configuration
   * @param stateManager - State manager instance
   */
  constructor(config: WidgetConfig, stateManager: StateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.currentTheme = 'light';

    // Apply initial theme from config
    if (config.style?.theme) {
      this.applyTheme(config.style.theme);
    }
  }

  /**
   * Applies the specified theme
   * @param theme - Theme to apply (light, dark, or auto)
   */
  applyTheme(theme: 'light' | 'dark' | 'auto'): void {
    // Clean up any existing media query listeners first
    this.cleanupMediaQuery();

    if (theme === 'auto') {
      // Clear cached mediaQueryList to get fresh system preference
      this.mediaQueryList = undefined;
      // Detect system theme first, then setup listener
      this.currentTheme = this.detectSystemTheme();
      this.setupMediaQuery();
    } else {
      this.currentTheme = theme;
    }

    // Update state manager with current theme
    this.stateManager.setState({ currentTheme: this.currentTheme });
  }

  /**
   * Gets the currently active theme
   * @returns Current theme (light or dark)
   */
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }

  /**
   * Detects system theme preference
   * @returns Detected system theme
   */
  private detectSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      // Create mediaQueryList if it doesn't exist yet
      if (!this.mediaQueryList) {
        this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      }
      return this.mediaQueryList.matches ? 'dark' : 'light';
    }
    return 'light';
  }

  /**
   * Sets up media query listener for system theme changes
   */
  private setupMediaQuery(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Always use the existing mediaQueryList if available (created by detectSystemTheme)
    // Otherwise create a new one
    if (!this.mediaQueryList) {
      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    }

    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      this.currentTheme = e.matches ? 'dark' : 'light';
      this.stateManager.setState({ currentTheme: this.currentTheme });
    };

    // Use addEventListener for modern browsers
    if (this.mediaQueryList.addEventListener) {
      this.mediaQueryList.addEventListener('change', this.mediaQueryListener);
    } else {
      // Fallback for older browsers
      (this.mediaQueryList as any).addListener(this.mediaQueryListener);
    }
  }

  /**
   * Cleans up media query listener
   */
  private cleanupMediaQuery(): void {
    if (this.mediaQueryList && this.mediaQueryListener) {
      if (this.mediaQueryList.removeEventListener) {
        this.mediaQueryList.removeEventListener('change', this.mediaQueryListener);
      } else {
        // Fallback for older browsers
        (this.mediaQueryList as any).removeListener(this.mediaQueryListener);
      }
    }
  }

  /**
   * Cleans up all listeners and resources
   */
  destroy(): void {
    this.cleanupMediaQuery();
  }
}
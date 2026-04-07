/**
 * Toggle Button Component
 *
 * Purpose: Renders the floating toggle button that opens/closes the chat widget
 * Responsibility: Button rendering, positioning, state management integration
 * Assumptions: Config provides valid positioning and styling values
 */

import { WidgetConfig } from '../types';
import { StateManager } from '../core/state';

/**
 * ToggleButton class - manages the chat widget toggle button
 */
export class ToggleButton {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private element: HTMLButtonElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private clickHandler: (() => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Creates a new ToggleButton instance
   * @param config - Widget configuration
   * @param stateManager - State manager instance
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
   * Renders the toggle button element
   * @returns The button element
   */
  render(): HTMLButtonElement {
    // Create button element
    const button = document.createElement('button');
    button.className = 'cw-toggle-button';
    button.setAttribute('aria-label', 'Toggle chat window');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('type', 'button');

    // Apply position class
    const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    const position = validPositions.includes(this.config.style.position)
      ? this.config.style.position
      : 'bottom-right';

    const positionClasses = {
      'bottom-right': 'cw-position-bottom-right',
      'bottom-left': 'cw-position-bottom-left',
      'top-right': 'cw-position-top-right',
      'top-left': 'cw-position-top-left',
    };
    button.classList.add(positionClasses[position]);

    // Apply theme class
    if (this.config.style.theme) {
      button.classList.add(`cw-theme-${this.config.style.theme}`);
    }

    // Helper to convert hex to RGB for happy-dom compatibility
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgb(${r}, ${g}, ${b})`;
      }
      return hex; // Return as-is if not valid hex
    };

    // Apply inline styles - use cssText for jsdom compatibility
    const styleRules: string[] = [
      'position: fixed',
      'z-index: 9999',
      'width: 60px',
      'height: 60px',
      `border-radius: ${this.config.style.cornerRadius}%`,
      `background-color: ${hexToRgb(this.config.style.primaryColor)}`,
      'border: none',
      'cursor: pointer',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.15)',
      'outline: auto',
    ];

    // Position offsets
    const offset = '20px';
    if (position === 'bottom-right') {
      styleRules.push(`bottom: ${offset}`, `right: ${offset}`);
    } else if (position === 'bottom-left') {
      styleRules.push(`bottom: ${offset}`, `left: ${offset}`);
    } else if (position === 'top-right') {
      styleRules.push(`top: ${offset}`, `right: ${offset}`);
    } else if (position === 'top-left') {
      styleRules.push(`top: ${offset}`, `left: ${offset}`);
    }

    button.style.cssText = styleRules.join('; ');

    // Add chat bubble icon
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
              fill="white"/>
      </svg>
    `;

    // Temporarily attach to document for computed styles to work in happy-dom
    // This allows getComputedStyle() to work properly in tests
    const wasInDocument = button.parentNode !== null;
    if (!wasInDocument && typeof document !== 'undefined' && document.body) {
      document.body.appendChild(button);
    }

    // Store element reference
    this.element = button;

    // Add click handler
    this.clickHandler = () => {
      const currentState = this.stateManager.getState();
      this.stateManager.setState({ isOpen: !currentState.isOpen });
    };
    button.addEventListener('click', this.clickHandler);

    // Add keyboard handler
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    };
    button.addEventListener('keydown', this.keyHandler);

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((state) => {
      if (state.isOpen) {
        button.classList.add('cw-active');
        button.setAttribute('aria-expanded', 'true');
      } else {
        button.classList.remove('cw-active');
        button.setAttribute('aria-expanded', 'false');
      }
    });

    return button;
  }

  /**
   * Mounts the button to a container
   * @param container - Container element
   */
  mount(container: HTMLElement): void {
    if (this.element && !container.contains(this.element)) {
      container.appendChild(this.element);
    }
  }

  /**
   * Unmounts the button from its container
   */
  unmount(): void {
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Destroys the button and cleans up resources
   */
  destroy(): void {
    // Unsubscribe from state
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Remove event listeners
    if (this.element && this.clickHandler) {
      this.element.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }

    if (this.element && this.keyHandler) {
      this.element.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }

    // Remove element from DOM
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
  }
}

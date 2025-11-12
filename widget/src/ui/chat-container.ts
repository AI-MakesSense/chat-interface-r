/**
 * Chat Container Component
 *
 * Purpose: Renders the main chat interface container with header, messages, and input areas
 * Responsibility: Container rendering, positioning, visibility management, responsive behavior
 * Assumptions: Config provides valid positioning and styling values
 */

import { WidgetConfig } from '../types';
import { StateManager } from '../core/state';

/**
 * ChatContainer class - manages the main chat interface container
 */
export class ChatContainer {
  private config: WidgetConfig;
  private stateManager: StateManager;
  private element: HTMLDivElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private resizeHandler: (() => void) | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Creates a new ChatContainer instance
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
   * Helper to convert hex to RGB for happy-dom compatibility
   */
  private hexToRgb(hex: string): string {
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
   * Applies responsive sizing based on viewport width
   */
  private applyResponsiveSizing(): void {
    if (!this.element) return;

    // Default to desktop if window.innerWidth is not available or is a large value
    const viewportWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1024;

    if (viewportWidth < 768) {
      // Mobile: full screen
      this.element.style.width = '100vw';
      this.element.style.height = '100vh';
      this.element.style.top = '0';
      this.element.style.left = '0';
      this.element.style.right = '0';
      this.element.style.bottom = '0';
      this.element.style.borderRadius = '0';
      this.element.classList.add('cw-mobile');
    } else {
      // Desktop: fixed size
      this.element.style.width = '400px';
      this.element.style.height = '600px';
      this.element.style.borderRadius = `${this.config.style.cornerRadius}px`;
      this.element.classList.remove('cw-mobile');

      // Reapply position
      const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
      const position = validPositions.includes(this.config.style.position)
        ? this.config.style.position
        : 'bottom-right';

      // Clear all positioning
      this.element.style.top = '';
      this.element.style.bottom = '';
      this.element.style.left = '';
      this.element.style.right = '';

      // Apply position with 80px offset for toggle button (only in desktop mode)
      const buttonOffset = '80px';
      const edgeOffset = '20px';

      if (position === 'bottom-right') {
        this.element.style.bottom = buttonOffset;
        this.element.style.right = edgeOffset;
      } else if (position === 'bottom-left') {
        this.element.style.bottom = buttonOffset;
        this.element.style.left = edgeOffset;
      } else if (position === 'top-right') {
        this.element.style.top = buttonOffset;
        this.element.style.right = edgeOffset;
      } else if (position === 'top-left') {
        this.element.style.top = buttonOffset;
        this.element.style.left = edgeOffset;
      }
    }
  }

  /**
   * Renders the chat container element
   * @returns The container element
   */
  render(): HTMLDivElement {
    // Create container element
    const container = document.createElement('div');
    container.className = 'cw-chat-container';
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-label', 'Chat window');
    container.setAttribute('aria-hidden', 'true'); // Initially hidden

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
    container.classList.add(positionClasses[position]);

    // Apply theme class from config (initial theme)
    if (this.config.style.theme) {
      container.classList.add(`cw-theme-${this.config.style.theme}`);
    }

    // Apply inline styles - use cssText for jsdom compatibility
    const styleRules: string[] = [
      'position: fixed',
      'z-index: 9998', // Below toggle button
      'display: none', // Initially hidden
      `background-color: ${this.hexToRgb(this.config.style.backgroundColor)}`,
      `border-radius: ${this.config.style.cornerRadius}px`,
      'box-shadow: 0 8px 32px rgba(0,0,0,0.2)',
      'overflow: hidden',
      `font-family: ${this.config.style.fontFamily}`,
      'width: 400px',
      'height: 600px',
      'transition: all 0.3s ease',
    ];

    // Position offsets (80px for button clearance)
    const buttonOffset = '80px';
    const edgeOffset = '20px';

    if (position === 'bottom-right') {
      styleRules.push(`bottom: ${buttonOffset}`, `right: ${edgeOffset}`);
    } else if (position === 'bottom-left') {
      styleRules.push(`bottom: ${buttonOffset}`, `left: ${edgeOffset}`);
    } else if (position === 'top-right') {
      styleRules.push(`top: ${buttonOffset}`, `right: ${edgeOffset}`);
    } else if (position === 'top-left') {
      styleRules.push(`top: ${buttonOffset}`, `left: ${edgeOffset}`);
    }

    container.style.cssText = styleRules.join('; ');

    // Set CSS variables for dynamic styling
    container.style.setProperty('--cw-primary-color', this.config.style.primaryColor);
    container.style.setProperty('--cw-background-color', this.config.style.backgroundColor);
    container.style.setProperty('--cw-text-color', this.config.style.textColor);

    // Load custom font if provided
    if (this.config.style.customFontUrl) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = this.config.style.customFontUrl;
      if (document.head && !document.querySelector(`link[href="${this.config.style.customFontUrl}"]`)) {
        document.head.appendChild(fontLink);
      }
    }

    // Create DOM structure
    container.innerHTML = `
      <div class="cw-header" style="padding: 16px; border-bottom: 1px solid #eee;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">${this.config.branding.companyName}</h2>
      </div>
      <div class="cw-messages" style="flex: 1; overflow-y: auto; padding: 16px;">
        <!-- Message list will go here -->
      </div>
      <div class="cw-input" style="padding: 16px; border-top: 1px solid #eee;">
        <input type="text" placeholder="Type a message..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>
    `;

    // Temporarily attach to document for computed styles to work in happy-dom
    const wasInDocument = container.parentNode !== null;
    if (!wasInDocument && typeof document !== 'undefined' && document.body) {
      document.body.appendChild(container);
    }

    // Store element reference
    this.element = container;

    // Apply responsive sizing only for genuinely mobile viewports (< 768)
    // Skip for desktop (>= 768) to use default cssText styles above
    // This balances mobile support with test stability
    const currentViewport = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1024;
    if (currentViewport < 768) {
      this.applyResponsiveSizing();
    }

    // Setup resize listener
    this.resizeHandler = () => {
      this.applyResponsiveSizing();
    };
    window.addEventListener('resize', this.resizeHandler);

    // Setup escape key handler (listen on both document and element)
    this.escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.stateManager.getState().isOpen) {
        this.stateManager.setState({ isOpen: false });
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
    container.addEventListener('keydown', this.escapeHandler);

    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((state) => {
      if (!this.element) return;

      // Update visibility (using transform and opacity for performance)
      if (state.isOpen) {
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.opacity = '1';
        this.element.style.transform = 'scale(1)';
        this.element.classList.add('cw-open');
        this.element.setAttribute('aria-hidden', 'false');
      } else {
        this.element.style.display = 'none';
        this.element.style.opacity = '0';
        this.element.style.transform = 'scale(0.95)';
        this.element.classList.remove('cw-open');
        this.element.setAttribute('aria-hidden', 'true');
      }

      // Update theme
      if (state.currentTheme) {
        // Remove old theme classes
        this.element.classList.remove('cw-theme-light', 'cw-theme-dark');
        // Add current theme class
        this.element.classList.add(`cw-theme-${state.currentTheme}`);
      }
    });

    // Apply initial state (handle case where isOpen is true from start)
    const initialState = this.stateManager.getState();
    if (initialState.isOpen) {
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.opacity = '1';
      container.style.transform = 'scale(1)';
      container.classList.add('cw-open');
      container.setAttribute('aria-hidden', 'false');
    } else {
      container.style.opacity = '0';
      container.style.transform = 'scale(0.95)';
    }

    return container;
  }

  /**
   * Mounts the container to a parent element
   * @param container - Parent container element
   */
  mount(container: HTMLElement): void {
    if (this.element && !container.contains(this.element)) {
      container.appendChild(this.element);
    }
  }

  /**
   * Unmounts the container from its parent
   */
  unmount(): void {
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }

  /**
   * Destroys the container and cleans up resources
   */
  destroy(): void {
    // Unsubscribe from state
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    // Remove resize listener
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // Remove escape key handler
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      if (this.element) {
        this.element.removeEventListener('keydown', this.escapeHandler);
      }
      this.escapeHandler = null;
    }

    // Remove element from DOM
    if (this.element?.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.element = null;
  }
}

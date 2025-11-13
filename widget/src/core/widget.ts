/**
 * Widget Class
 *
 * Purpose: Main widget class with support for multiple rendering modes
 * Modes:
 * - normal: Traditional bubble + chat window (default)
 * - portal: Full-screen chat (no bubble)
 * - embedded: Embedded in container (no bubble)
 *
 * TDD Phase: REFACTOR
 * Extracted PortalRenderer and ConfigValidator for better separation of concerns
 */

import { WidgetConfig, Message } from '../types';
import { createChatWidget } from '../widget';
import { PortalRenderer } from './portal-renderer';
import { ConfigValidator } from './config-validator';

export type WidgetMode = 'normal' | 'portal' | 'embedded';

export interface PortalConfig {
  showHeader?: boolean;
  headerTitle?: string;
  showPoweredBy?: boolean;
}

export interface ExtendedWidgetConfig extends WidgetConfig {
  mode?: WidgetMode;
  portal?: PortalConfig;
}

export class Widget {
  private config: ExtendedWidgetConfig;
  private mode: WidgetMode;
  private chatWindow: HTMLElement | null = null;

  constructor(config: ExtendedWidgetConfig) {
    ConfigValidator.validate(config);
    this.config = config;
    this.mode = config.mode || 'normal';
  }

  /**
   * Check if widget is in portal mode
   */
  public isPortalMode(): boolean {
    return this.mode === 'portal';
  }

  /**
   * Check if widget is in embedded mode
   */
  public isEmbeddedMode(): boolean {
    return this.mode === 'embedded';
  }

  /**
   * Render the widget based on mode
   */
  public render(): void {
    if (this.isPortalMode()) {
      this.renderPortalMode();
    } else if (this.isEmbeddedMode()) {
      this.renderEmbeddedMode();
    } else {
      this.renderNormalMode();
    }
  }

  /**
   * Render portal mode - fullscreen chat
   */
  private renderPortalMode(): void {
    const renderer = new PortalRenderer(this.config);
    this.chatWindow = renderer.render();
  }

  /**
   * Render embedded mode - chat in container (no bubble)
   */
  private renderEmbeddedMode(): void {
    // TODO: Implement embedded mode
    // For now, use portal mode rendering
    this.renderPortalMode();
  }

  /**
   * Render normal mode - bubble + chat window (existing behavior)
   */
  private renderNormalMode(): void {
    // Use existing createChatWidget function
    createChatWidget(this.config);
  }
}

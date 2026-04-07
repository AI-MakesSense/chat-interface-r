/**
 * ConfigValidator
 *
 * Handles validation of widget configuration
 * Extracted from Widget class for better separation of concerns
 */

import { ExtendedWidgetConfig } from './widget';

export class ConfigValidator {
  /**
   * Validate widget configuration
   * @throws Error if configuration is invalid
   */
  public static validate(config: ExtendedWidgetConfig): void {
    // Portal mode requires either license (legacy) or widgetKey (v2.0)
    if (config.mode === 'portal' && !config.license && !(config as any).widgetKey) {
      throw new Error('License or widgetKey required for portal mode');
    }

    // Validate webhook URL if provided
    if (config.connection?.webhookUrl && !this.isValidUrl(config.connection.webhookUrl)) {
      console.error('Invalid webhook URL:', config.connection.webhookUrl);
    }
  }

  /**
   * Check if URL is valid
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

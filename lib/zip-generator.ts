/**
 * Zip Generator
 *
 * Purpose: Generate downloadable code packages as zip files
 * Supports: Website widget, Portal page, Chrome extension
 * TDD Phase: REFACTOR - Extracted templates into separate modules
 */

import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
import type { WidgetConfig } from '@/widget/src/types';
import { HTMLTemplates } from './zip-generator/html-templates';
import { READMETemplates } from './zip-generator/readme-templates';
import { ExtensionTemplates, IconGenerator } from './zip-generator/extension-templates';

export type PackageType = 'website' | 'portal' | 'extension';

export class ZipGenerator {
  private widgetScriptPath: string;

  constructor() {
    // Path to compiled widget bundle
    this.widgetScriptPath = path.join(process.cwd(), 'public', 'widget', 'chat-widget.iife.js');
  }

  /**
   * Generate website widget package
   * Contains: index.html, chat-widget.js, README.md
   */
  async generateWebsitePackage(config: WidgetConfig): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // Add widget script
    const widgetScript = await this.getWidgetScript();
    zip.file('chat-widget.js', widgetScript);

    // Add index.html
    const indexHtml = HTMLTemplates.generateWebsiteHTML(config);
    zip.file('index.html', indexHtml);

    // Add README
    const readme = READMETemplates.generateWebsiteREADME();
    zip.file('README.md', readme);

    // Generate zip buffer
    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  /**
   * Generate portal page package
   * Contains: portal.html, chat-widget.js, README.md
   */
  async generatePortalPackage(config: WidgetConfig, widgetId: string): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // Add widget script
    const widgetScript = await this.getWidgetScript();
    zip.file('chat-widget.js', widgetScript);

    // Add portal.html
    const portalHtml = HTMLTemplates.generatePortalHTML(config, widgetId);
    zip.file('portal.html', portalHtml);

    // Add README
    const readme = READMETemplates.generatePortalREADME(widgetId);
    zip.file('README.md', readme);

    // Generate zip buffer
    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  /**
   * Generate Chrome extension package
   * Contains: manifest.json, sidepanel.html, background.js, chat-widget.js, icons/, README.md
   */
  async generateExtensionPackage(config: WidgetConfig, widgetId: string): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // Add widget script
    const widgetScript = await this.getWidgetScript();
    zip.file('chat-widget.js', widgetScript);

    // Add manifest.json
    const manifest = ExtensionTemplates.generateManifest(config);
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Add sidepanel.html
    const sidepanelHtml = ExtensionTemplates.generateSidepanel(config, widgetId);
    zip.file('sidepanel.html', sidepanelHtml);

    // Add background.js (service worker)
    const backgroundScript = ExtensionTemplates.generateBackground();
    zip.file('background.js', backgroundScript);

    // Add icon files
    const iconColor = { r: 0, g: 191, b: 255 }; // Primary blue color
    const iconSizes = [16, 48, 128];
    for (const size of iconSizes) {
      const iconBuffer = await IconGenerator.generate(size, iconColor);
      zip.file(`icons/icon-${size}.png`, iconBuffer);
    }

    // Add README
    const readme = ExtensionTemplates.generateREADME(widgetId);
    zip.file('README.md', readme);

    // Generate zip buffer
    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }

  /**
   * Get widget script from file system
   */
  private async getWidgetScript(): Promise<string> {
    try {
      return await fs.readFile(this.widgetScriptPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read widget script: ${error}`);
    }
  }

  /**
   * Validate widget configuration
   */
  private validateConfig(config: WidgetConfig): void {
    if (!config) {
      throw new Error('Widget config is required');
    }

    if (!config.license || config.license.trim() === '') {
      throw new Error('License key is required');
    }
  }
}

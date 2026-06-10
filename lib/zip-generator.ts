import JSZip from 'jszip';
// Make sure this import matches where your WidgetConfig type is defined
import type { WidgetConfig } from '@/stores/widget-store';
import { HTMLTemplates } from './zip-generator/html-templates';
import { ExtensionTemplates, IconGenerator } from './zip-generator/extension-templates';

export type PackageType = 'website' | 'portal' | 'extension';

/**
 * Downloaded packages are loader-based (Task 18). Instead of bundling the widget
 * runtime (the old chat-widget.iife.js, now deleted), every generated HTML embeds
 * the hosted loader snippet pointing at the SaaS origin:
 *
 *   <script src="${baseUrl}/widget/loader.js" data-widget-key="KEY" async></script>
 *
 * This makes the download a self-contained, auto-updating embed and removes the
 * dependency on a local bundle file. The `licenseKey` parameter carries the public
 * widgetKey (the download route passes widget.widgetKey).
 */
export class ZipGenerator {
  /**
   * Generate website widget package
   */
  async generateWebsitePackage(
    config: WidgetConfig,
    widgetId: string,
    licenseKey: string,
    baseUrl: string
  ): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // 1. Add index.html (loader-based embed)
    const sanitizedConfig = this.sanitizeConfig(config);
    const indexHtml = HTMLTemplates.generateWebsiteHTML(sanitizedConfig, licenseKey, baseUrl);
    zip.file('index.html', indexHtml);

    // 2. Add README (Dynamic)
    const readme = READMETemplates.generateWebsiteREADME(licenseKey, baseUrl);
    zip.file('README.md', readme);

    return await this.createZip(zip);
  }

  /**
   * Generate portal page package
   */
  async generatePortalPackage(
    config: WidgetConfig,
    widgetId: string,
    licenseKey: string,
    baseUrl: string
  ): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // 1. Add portal.html (loader-based embed)
    const sanitizedConfig = this.sanitizeConfig(config);
    const portalHtml = HTMLTemplates.generatePortalHTML(sanitizedConfig, widgetId, licenseKey, baseUrl);
    zip.file('portal.html', portalHtml);

    // 2. Add README (Dynamic)
    const readme = READMETemplates.generatePortalREADME(widgetId, licenseKey, baseUrl);
    zip.file('README.md', readme);

    return await this.createZip(zip);
  }

  /**
   * Generate Chrome extension package
   */
  async generateExtensionPackage(
    config: WidgetConfig,
    widgetId: string,
    licenseKey: string,
    baseUrl: string
  ): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // 1. Add extension files (sidepanel embeds the hosted loader)
    const sanitizedConfig = this.sanitizeConfig(config);
    const manifest = ExtensionTemplates.generateManifest(sanitizedConfig, baseUrl);
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const sidepanelHtml = ExtensionTemplates.generateSidepanel(licenseKey, baseUrl);
    zip.file('sidepanel.html', sidepanelHtml);

    const backgroundScript = ExtensionTemplates.generateBackground();
    zip.file('background.js', backgroundScript);

    // 3. Generate Icons (with fallback)
    try {
      const iconColor = { r: 0, g: 100, b: 255 }; // Default blue
      const iconSizes = [16, 48, 128];
      for (const size of iconSizes) {
        const iconBuffer = await IconGenerator.generate(size, iconColor);
        zip.file(`icons/icon-${size}.png`, iconBuffer);
      }
    } catch (e) {
      console.warn('Icon generation failed, skipping icons', e);
    }

    // 4. Add README (Dynamic)
    const readme = READMETemplates.generateExtensionREADME(widgetId, baseUrl);
    zip.file('README.md', readme);

    return await this.createZip(zip);
  }

  private validateConfig(config: WidgetConfig): void {
    if (!config) {
      throw new Error('Widget config is required');
    }
  }

  private sanitizeConfig(config: WidgetConfig): any {
    // Ensure all required fields for the widget runtime are present.
    // NOTE: the downloaded widget runtime (widget/src) still consumes the
    // LEGACY shape (style.*, features.fileAttachmentsEnabled), so this
    // method reads from the canonical config but emits the legacy shape.
    return {
      ...config,
      branding: {
        ...config.branding,
        companyName: config.branding.companyName || '',
        welcomeText: config.branding.welcomeText || '',
        firstMessage: config.branding.firstMessage || '',
      },
      style: {
        theme: config.theme.mode,
        primaryColor: config.theme.colors.primary,
        position: config.theme.position.position,
        cornerRadius: config.theme.cornerRadius,
        backgroundColor: config.theme.colors.background || '#ffffff',
        textColor: config.theme.colors.text || '#000000',
        fontFamily: config.theme.typography.fontFamily || 'Inter, sans-serif',
        fontSize: config.theme.typography.fontSize || 16,
        // Runtime reads style.customFontUrl (widget/src/ui/chat-container.ts,
        // widget/src/theming/css-variables.ts) — must not be dropped.
        // Fallback: the sidebar's custom-font flow stores into
        // theme.typography.customFontCss (either @font-face CSS or a bare
        // URL), mirroring ChatKitEmbed's fontSources extraction.
        customFontUrl:
          config.theme.typography.fontUrl ||
          this.extractFontUrl(config.theme.typography.customFontCss) ||
          undefined,
      },
      features: {
        fileAttachmentsEnabled: config.features.attachments.enabled || false,
        allowedExtensions: config.features.attachments.allowedExtensions || [],
        maxFileSizeKB: (config.features.attachments.maxFileSizeMB || 5) * 1024,
      }
    };
  }

  /**
   * Extract a font URL from theme.typography.customFontCss. Mirrors
   * ChatKitEmbed's url(...) extraction; additionally accepts a bare URL,
   * which is what the sidebar's custom-font flow actually stores.
   */
  private extractFontUrl(customFontCss: string): string | undefined {
    if (!customFontCss) return undefined;
    const urlMatch = customFontCss.match(/url\(['"]?([^'")]+)['"]?\)/);
    if (urlMatch) return urlMatch[1];
    try {
      new URL(customFontCss);
      return customFontCss;
    } catch {
      return undefined;
    }
  }

  private async createZip(zip: JSZip): Promise<Buffer> {
    return await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
  }
}

// =============================================================================
// README TEMPLATES 
// =============================================================================

class READMETemplates {
  static generateWebsiteREADME(licenseKey: string, baseUrl: string): string {
    return `# Chat Widget - Website Embed

This package contains a reference implementation to help you get started.

## ✅ Hosted Embed (Recommended)

Add this single line to your HTML, just before the closing \`</body>\` tag:

\`\`\`html
<script src="${baseUrl}/widget/loader.js" data-widget-key="${licenseKey}" async></script>
\`\`\`

**Benefits:**
- Automatic updates (no need to redeploy)
- Secure relay (hides your N8n webhook URL)
- No CORS issues

The included \`index.html\` is a ready-to-use demo page with this snippet already
in place — open it in a browser to see the widget, or copy the snippet above into
your own site.
`;
  }

  static generatePortalREADME(widgetId: string, licenseKey: string, baseUrl: string): string {
    return `# Chat Widget - Portal Page

This package contains a full-page chat interface.

## ✅ Quick Deployment

The included \`portal.html\` is a ready-to-host full-page chat. It embeds the hosted
loader:

\`\`\`html
<script src="${baseUrl}/widget/loader.js" data-widget-key="${licenseKey}" data-mode="portal" async></script>
\`\`\`

Host \`portal.html\` at your own domain (e.g., \`chat.yourcompany.com\`), or link
directly to the hosted portal: \`${baseUrl}/chat/${licenseKey}\`.

## Widget Details
- **Widget ID:** \`${widgetId}\`
- **Widget Key:** \`${licenseKey}\`
`;
  }

  static generateExtensionREADME(widgetId: string, baseUrl: string): string {
    return `# Chat Widget - Chrome Extension

This is a packed Chrome Extension for your chat widget.

## Installation

1. Unzip this folder.
2. Open Chrome and go to \`chrome://extensions\`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked**.
5. Select this unzipped folder.

## Configuration

The extension is pre-configured for Widget ID: \`${widgetId}\`
`;
  }
}
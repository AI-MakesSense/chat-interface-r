import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
// Make sure this import matches where your WidgetConfig type is defined
import type { WidgetConfig } from '@/stores/widget-store';
import { HTMLTemplates } from './zip-generator/html-templates';
import { ExtensionTemplates, IconGenerator } from './zip-generator/extension-templates';

export type PackageType = 'website' | 'portal' | 'extension';

export class ZipGenerator {
  private widgetScriptPath: string;

  constructor() {
    // Path to compiled widget bundle in public folder
    this.widgetScriptPath = path.join(process.cwd(), 'public', 'widget', 'chat-widget.iife.js');
  }

  /**
   * Generate website widget package
   * UPDATED: Now accepts licenseKey and baseUrl
   */
  async generateWebsitePackage(
    config: WidgetConfig,
    widgetId: string,
    licenseKey: string,
    baseUrl: string
  ): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // 1. Add widget script
    const widgetScript = await this.getWidgetScript();
    zip.file('chat-widget.js', widgetScript);

    // 2. Add index.html
    const indexHtml = HTMLTemplates.generateWebsiteHTML(config);
    zip.file('index.html', indexHtml);

    // 3. Add README (Dynamic)
    const readme = READMETemplates.generateWebsiteREADME(licenseKey, baseUrl);
    zip.file('README.md', readme);

    return await this.createZip(zip);
  }

  /**
   * Generate portal page package
   * UPDATED: Now accepts licenseKey and baseUrl
   */
  async generatePortalPackage(
    config: WidgetConfig,
    widgetId: string,
    licenseKey: string,
    baseUrl: string
  ): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // 1. Add widget script
    const widgetScript = await this.getWidgetScript();
    zip.file('chat-widget.js', widgetScript);

    // 2. Add portal.html
    const portalHtml = HTMLTemplates.generatePortalHTML(config, widgetId);
    zip.file('portal.html', portalHtml);

    // 3. Add README (Dynamic)
    const readme = READMETemplates.generatePortalREADME(widgetId, licenseKey, baseUrl);
    zip.file('README.md', readme);

    return await this.createZip(zip);
  }

  /**
   * Generate Chrome extension package
   * UPDATED: Now accepts licenseKey and baseUrl
   */
  async generateExtensionPackage(
    config: WidgetConfig,
    widgetId: string,
    licenseKey: string,
    baseUrl: string
  ): Promise<Buffer> {
    this.validateConfig(config);

    const zip = new JSZip();

    // 1. Add widget script
    const widgetScript = await this.getWidgetScript();
    zip.file('chat-widget.js', widgetScript);

    // 2. Add extension files
    const manifest = ExtensionTemplates.generateManifest(config);
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const sidepanelHtml = ExtensionTemplates.generateSidepanel(config, widgetId);
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

  private async getWidgetScript(): Promise<string> {
    try {
      return await fs.readFile(this.widgetScriptPath, 'utf-8');
    } catch (error) {
      console.error('Missing widget script at:', this.widgetScriptPath);
      throw new Error('System configuration error: Widget script not found.');
    }
  }

  private validateConfig(config: WidgetConfig): void {
    if (!config) {
      throw new Error('Widget config is required');
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

## ✅ Option 1: Hosted Embed (Recommended)

This is the easiest way. Add this single line to your HTML, just before the closing \`</body>\` tag:

\`\`\`html
<script src="${baseUrl}/api/widget/${licenseKey}/chat-widget.js"></script>
\`\`\`

**Benefits:**
- Automatic updates (no need to redeploy)
- Secure relay (hides your N8n webhook URL)
- No CORS issues

---

## ⚙️ Option 2: Self-Hosted

If you prefer to host the files yourself:

1. Upload \`chat-widget.js\` to your server.
2. Add the following code to your HTML:

\`\`\`html
<script>
  window.ChatWidgetConfig = {
    // ... see index.html for your specific config ...
  };
</script>
<script src="/path/to/chat-widget.js"></script>
\`\`\`
`;
  }

  static generatePortalREADME(widgetId: string, licenseKey: string, baseUrl: string): string {
    return `# Chat Widget - Portal Page

This package contains a full-page chat interface.

## ✅ Quick Deployment

Simply create an HTML page with this content:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Support Chat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <script src="${baseUrl}/api/widget/${licenseKey}/chat-widget.js"></script>
</body>
</html>
\`\`\`

Host this HTML file at your own domain (e.g., \`chat.yourcompany.com\`).

## Widget Details
- **Widget ID:** \`${widgetId}\`
- **License Key:** \`${licenseKey}\`
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
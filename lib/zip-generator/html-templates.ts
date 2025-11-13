/**
 * HTML Templates
 *
 * Purpose: Generate HTML templates for widget packages
 * Extracted from ZipGenerator for better separation of concerns
 */

import type { WidgetConfig } from '@/widget/src/types';

export class HTMLTemplates {
  /**
   * Generate website HTML with embedded config
   */
  static generateWebsiteHTML(config: WidgetConfig): string {
    const configJson = JSON.stringify(config, null, 2);
    const timestamp = new Date().toISOString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.branding?.companyName || 'Chat Widget'} - Support</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    h1 {
      margin: 0 0 16px 0;
      color: #1a202c;
    }
    p {
      color: #4a5568;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- Generated on ${timestamp} -->

  <div class="container">
    <h1>Welcome to ${config.branding?.companyName || 'Our'} Support</h1>
    <p>This is a demo page for your chat widget. Click the chat bubble in the bottom-right corner to start a conversation!</p>
    <p>You can customize this page or integrate the widget into your existing website.</p>
  </div>

  <!-- Chat Widget Script -->
  <script src="./chat-widget.js"></script>

  <!-- Initialize Widget -->
  <script>
    // Widget Configuration
    const widgetConfig = ${configJson};

    // Initialize widget when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initWidget);
    } else {
      initWidget();
    }

    function initWidget() {
      if (typeof Widget !== 'undefined') {
        const widget = new Widget(widgetConfig);
        widget.render();
      } else {
        console.error('Widget class not loaded');
      }
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate portal HTML with embedded config
   */
  static generatePortalHTML(config: WidgetConfig, widgetId: string): string {
    const portalConfig = {
      ...config,
      mode: 'portal',
      portal: {
        showHeader: true,
        headerTitle: config.branding?.companyName || 'Chat',
        ...config.portal,
      },
    };

    const configJson = JSON.stringify(portalConfig, null, 2);
    const timestamp = new Date().toISOString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.branding?.companyName || 'Chat'} - Support Portal</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
  </style>
</head>
<body>
  <!-- Generated on ${timestamp} -->
  <!-- Widget ID: ${widgetId} -->

  <!-- Portal Container -->
  <div id="chat-portal"></div>

  <!-- Chat Widget Script -->
  <script src="./chat-widget.js"></script>

  <!-- Initialize Portal Widget -->
  <script>
    // Portal Configuration
    const portalConfig = ${configJson};

    // Initialize portal when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPortal);
    } else {
      initPortal();
    }

    function initPortal() {
      if (typeof Widget !== 'undefined') {
        const widget = new Widget(portalConfig);
        widget.render();
      } else {
        console.error('Widget class not loaded');
      }
    }
  </script>
</body>
</html>`;
  }
}

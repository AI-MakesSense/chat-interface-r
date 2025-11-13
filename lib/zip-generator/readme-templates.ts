/**
 * README Templates
 *
 * Purpose: Generate README files for widget packages
 * Extracted from ZipGenerator for better separation of concerns
 */

export class READMETemplates {
  /**
   * Generate website package README
   */
  static generateWebsiteREADME(): string {
    return `# Chat Widget Installation

This package contains everything you need to add the chat widget to your website.

## Files Included

- \`index.html\` - Example HTML page with the widget
- \`chat-widget.js\` - Widget JavaScript bundle
- \`README.md\` - This file

## Installation

### Option 1: Use the Example HTML

1. Open \`index.html\` in a web browser to see the widget in action
2. Customize the HTML to match your website's design
3. Upload the files to your web server

### Option 2: Integrate into Existing Website

Add these lines to your HTML, just before the closing \`</body>\` tag:

\`\`\`html
<!-- Chat Widget Script -->
<script src="./chat-widget.js"></script>

<!-- Initialize Widget -->
<script>
  const widgetConfig = {
    license: 'YOUR_LICENSE_KEY',
    branding: {
      companyName: 'Your Company',
      logoUrl: 'https://example.com/logo.png',
      firstMessage: 'Hello! How can we help you today?'
    },
    style: {
      primaryColor: '#00bfff',
      theme: 'light'
    },
    connection: {
      webhookUrl: 'https://your-n8n-instance.com/webhook/chat'
    }
  };

  if (typeof Widget !== 'undefined') {
    const widget = new Widget(widgetConfig);
    widget.render();
  }
</script>
\`\`\`

## Configuration

Update the \`widgetConfig\` object in your HTML to customize:

- **license**: Your widget license key
- **branding**: Company name, logo, welcome message
- **style**: Colors, theme (light/dark)
- **connection**: N8n webhook URL

## Support

For more information, visit your dashboard or contact support.
`;
  }

  /**
   * Generate portal package README
   */
  static generatePortalREADME(widgetId: string): string {
    return `# Chat Portal Package

This package contains a standalone full-screen chat portal.

## Files Included

- \`portal.html\` - Full-screen chat portal page
- \`chat-widget.js\` - Widget JavaScript bundle
- \`README.md\` - This file

## Installation

### Quick Start

1. Open \`portal.html\` in a web browser to see the portal in action
2. Upload the files to your web server
3. Share the URL with your users

### Customization

Edit \`portal.html\` to customize:

- Company name and branding
- Portal colors and theme
- Webhook URL for N8n integration
- Header title and visibility

### Portal Mode Features

- **Full-screen chat interface** - No bubble button, always visible
- **Clean URL** - Host at your own domain (e.g., chat.yourcompany.com)
- **Mobile-friendly** - Responsive design for all devices
- **Embeddable** - Use in iframes if needed

## Widget ID

Your portal widget ID: \`${widgetId}\`

## Support

For more information, visit your dashboard or contact support.
`;
  }
}

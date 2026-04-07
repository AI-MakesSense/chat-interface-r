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
    return `# Chat Widget - Website Embed

This package contains a reference implementation to help you get started.

## Recommended: Use Hosted Embed (Relay)

**This is the easiest way to add the widget to your website:**

Add this single line to your HTML, just before the closing \`</body>\` tag:

\`\`\`html
<!-- Chat Widget (Relay) - Zero Configuration Required -->
<script src="https://YOUR-PLATFORM-URL.com/api/widget/YOUR-LICENSE-KEY/chat-widget.js"></script>
\`\`\`

**That's it!** The widget will appear on your page automatically.

### Why use the hosted version?

✅ Zero configuration required
✅ Automatic updates
✅ Secure relay (no CORS issues)
✅ Your N8n webhook URL stays private

## Alternative: Self-Hosted (Advanced)

If you need to host the widget files yourself:

1. Upload \`chat-widget.js\` to your web server
2. Add the initialization code to your HTML
3. **Note:** You'll need to configure CORS on your N8n instance

See \`index.html\` for a reference implementation.

## Support

For your embed code and license key, visit your dashboard.
`;
  }

  /**
   * Generate portal package README
   */
  static generatePortalREADME(widgetId: string): string {
    return `# Chat Widget - Portal Page

This package contains a full-page chat interface.

## Recommended: Use Hosted Embed (Relay)

**Easiest way to deploy your portal:**

Simply create an HTML page with this single line:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Support Chat</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <!-- Chat Portal (Relay) - Zero Configuration Required -->
  <script src="https://YOUR-PLATFORM-URL.com/api/widget/YOUR-LICENSE-KEY/chat-widget.js"></script>
</body>
</html>
\`\`\`

**That's it!** Host this HTML file at your own domain (e.g., chat.yourcompany.com).

### Why use the hosted version?

✅ Zero configuration required
✅ Automatic updates
✅ Secure relay (no CORS issues)
✅ Your N8n webhook URL stays private
✅ Full-screen chat interface

### Portal Mode Features

- **Full-screen chat interface** - No bubble button, always visible
- **Clean URL** - Host at your own domain
- **Mobile-friendly** - Responsive design for all devices
- **Embeddable** - Use in iframes if needed

## Widget ID

Your portal widget ID: \`${widgetId}\`

## Support

For your embed code and license key, visit your dashboard.
`;
  }
}

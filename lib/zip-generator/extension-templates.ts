/**
 * Chrome Extension Templates
 *
 * Purpose: Generate Chrome Extension files (Manifest V3, HTML, Service Worker)
 * Extracted from ZipGenerator for better separation of concerns
 */

import type { WidgetConfig } from '@/widget/src/types';

export class ExtensionTemplates {
  /**
   * Generate manifest.json for Chrome Extension (Manifest V3)
   */
  static generateManifest(config: WidgetConfig): any {
    const companyName = config.branding?.companyName || 'Your Company';

    return {
      manifest_version: 3,
      name: `${companyName} Chat Assistant`,
      version: '1.0.0',
      description: `AI-powered chat assistant for ${companyName}`,
      icons: {
        '16': 'icons/icon-16.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png'
      },
      action: {
        default_icon: {
          '16': 'icons/icon-16.png',
          '48': 'icons/icon-48.png',
          '128': 'icons/icon-128.png'
        },
        default_title: 'Open Chat'
      },
      side_panel: {
        default_path: 'sidepanel.html'
      },
      background: {
        service_worker: 'background.js'
      },
      permissions: [
        'sidePanel'
      ]
    };
  }

  /**
   * Generate sidepanel.html for Chrome Extension
   */
  static generateSidepanel(config: WidgetConfig, widgetId: string): string {
    const configJSON = JSON.stringify({
      ...config,
      mode: 'portal',
      widgetId
    }, null, 2);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Assistant</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #chat-portal {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="chat-portal"></div>

  <script src="./chat-widget.js"></script>
  <script>
    const widgetConfig = ${configJSON};

    if (typeof Widget !== 'undefined') {
      const widget = new Widget(widgetConfig);
      widget.render();
    } else {
      console.error('Widget failed to load');
    }
  </script>
</body>
</html>`;
  }

  /**
   * Generate background.js service worker for Chrome Extension
   */
  static generateBackground(): string {
    return `/**
 * Chrome Extension Background Service Worker
 * Handles side panel interactions
 */

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Chat Assistant Extension installed');
});
`;
  }

  /**
   * Generate extension README
   */
  static generateREADME(widgetId: string): string {
    return `# Chrome Extension - Chat Assistant

This package contains a Chrome extension that adds an AI-powered chat assistant to your browser.

## Files Included

- \`manifest.json\` - Chrome Extension Manifest V3
- \`sidepanel.html\` - Side panel chat interface
- \`background.js\` - Background service worker
- \`chat-widget.js\` - Widget JavaScript bundle
- \`icons/\` - Extension icons (16x16, 48x48, 128x128)
- \`README.md\` - This file

## Installation

### Step 1: Load the Extension

1. Open Chrome and navigate to \`chrome://extensions\`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the folder containing these extension files

### Step 2: Pin the Extension

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Chat Assistant" in the list
3. Click the pin icon to keep it visible

### Step 3: Open the Chat

1. Click the extension icon in your toolbar
2. The chat assistant will open in a side panel
3. Start chatting!

## Features

- **Side Panel Chat** - Chat interface appears in Chrome's side panel
- **Always Accessible** - Access your chat assistant from any webpage
- **Persistent Sessions** - Your conversation history is maintained
- **Keyboard Shortcut** - Click the extension icon to toggle the chat

## Widget ID

Your extension widget ID: \`${widgetId}\`

## Updating the Extension

To update the extension:

1. Replace the files in the extension folder
2. Go to \`chrome://extensions\`
3. Click the refresh icon on the extension card

## Troubleshooting

**Extension not loading:**
- Make sure all files are in the same folder
- Check that Developer mode is enabled
- Look for error messages in \`chrome://extensions\`

**Chat not appearing:**
- Click the extension icon to open the side panel
- Check the browser console for errors (F12 → Console)

## Support

For more information, visit your dashboard or contact support.
`;
  }
}

/**
 * Icon Generator for Chrome Extensions
 *
 * Generates simple PNG icons programmatically without external dependencies
 */
export class IconGenerator {
  /**
   * Generate a simple colored square icon as PNG
   */
  static async generate(size: number, color: { r: number; g: number; b: number }): Promise<Buffer> {
    const png = this.createPNG(size, size, color);
    return Buffer.from(png);
  }

  /**
   * Create a minimal valid PNG buffer
   */
  private static createPNG(width: number, height: number, color: { r: number; g: number; b: number }): Uint8Array {
    // PNG signature
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];

    // IHDR chunk
    const ihdr = this.createChunk('IHDR', [
      ...this.to32Bit(width),
      ...this.to32Bit(height),
      8, // bit depth
      2, // color type (RGB)
      0, // compression
      0, // filter
      0  // interlace
    ]);

    // Create simple IDAT chunk with solid color
    const pixels: number[] = [];
    for (let y = 0; y < height; y++) {
      pixels.push(0); // filter type for scanline
      for (let x = 0; x < width; x++) {
        pixels.push(color.r, color.g, color.b);
      }
    }

    // Compress pixels (simplified - just wrap in zlib structure)
    const compressed = this.zlibCompress(pixels);
    const idat = this.createChunk('IDAT', compressed);

    // IEND chunk
    const iend = this.createChunk('IEND', []);

    return new Uint8Array([...signature, ...ihdr, ...idat, ...iend]);
  }

  /**
   * Create a PNG chunk
   */
  private static createChunk(type: string, data: number[]): number[] {
    const length = this.to32Bit(data.length);
    const typeBytes = Array.from(type).map(c => c.charCodeAt(0));
    const crc = this.crc32([...typeBytes, ...data]);
    return [...length, ...typeBytes, ...data, ...this.to32Bit(crc)];
  }

  /**
   * Convert number to 32-bit big-endian
   */
  private static to32Bit(num: number): number[] {
    return [
      (num >> 24) & 0xff,
      (num >> 16) & 0xff,
      (num >> 8) & 0xff,
      num & 0xff
    ];
  }

  /**
   * Calculate CRC32 checksum
   */
  private static crc32(data: number[]): number {
    let crc = 0xffffffff;
    for (const byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  /**
   * Simple zlib compression (DEFLATE with zlib header/footer)
   */
  private static zlibCompress(data: number[]): number[] {
    // Zlib header (CMF + FLG)
    const header = [0x78, 0x01]; // deflate, default compression

    // Uncompressed DEFLATE blocks
    const blocks: number[] = [];
    const chunkSize = 65535;

    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
      const isLast = i + chunkSize >= data.length ? 1 : 0;

      // Block header
      blocks.push(isLast); // BFINAL + BTYPE (00 = no compression)

      // Length (little-endian)
      const len = chunk.length;
      blocks.push(len & 0xff, (len >> 8) & 0xff);
      blocks.push((~len) & 0xff, ((~len) >> 8) & 0xff); // NLEN

      // Data
      blocks.push(...chunk);
    }

    // Adler-32 checksum
    const adler = this.adler32(data);

    return [
      ...header,
      ...blocks,
      ...this.to32Bit(adler)
    ];
  }

  /**
   * Calculate Adler-32 checksum
   */
  private static adler32(data: number[]): number {
    let a = 1;
    let b = 0;

    for (const byte of data) {
      a = (a + byte) % 65521;
      b = (b + a) % 65521;
    }

    return (b << 16) | a;
  }
}

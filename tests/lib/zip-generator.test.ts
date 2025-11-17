/**
 * Zip Generator Tests
 *
 * TDD RED Phase: Writing failing tests for zip package generation
 *
 * Features to test:
 * - Website widget package (HTML + script + README)
 * - Portal page package (standalone HTML)
 * - Zip structure validation
 * - File content validation
 * - Widget config injection
 * - Error handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { ZipGenerator, PackageType } from '@/lib/zip-generator';
import type { PublicWidgetRuntimeConfig } from '@/lib/widget/runtime-config';

describe('ZipGenerator', () => {
  let generator: ZipGenerator;
  let mockConfig: PublicWidgetRuntimeConfig;

  beforeEach(() => {
    generator = new ZipGenerator();

    mockConfig = {
      uiConfig: {
        branding: {
          companyName: 'Test Company',
          logoUrl: 'https://example.com/logo.png',
          welcomeText: 'Need help?',
          firstMessage: 'Welcome to our chat!',
        },
        style: {
          theme: 'light',
          primaryColor: '#00bfff',
          backgroundColor: '#ffffff',
          textColor: '#111111',
          position: 'bottom-right',
          cornerRadius: 12,
          fontFamily: 'Inter',
          fontSize: 14,
        },
        features: {
          fileAttachmentsEnabled: false,
          allowedExtensions: [],
          maxFileSizeKB: 5120,
        },
        connection: {},
        license: { brandingEnabled: true },
      },
      relay: {
        widgetId: 'widget-test',
        licenseKey: 'test-license-key-123',
        relayUrl: 'https://app.example.com/api/chat-relay',
      },
    };
  });

  describe('Website Widget Package', () => {
    it('should generate a zip buffer for website widget', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it('should contain index.html file', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['index.html']).toBeDefined();
    });

    it('should contain chat-widget.js file', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['chat-widget.js']).toBeDefined();
    });

    it('should contain README.md file', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['README.md']).toBeDefined();
    });

    it('should inject widget config into index.html', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['index.html'].async('string');

      expect(htmlContent).toContain(mockConfig.relay.licenseKey);
      expect(htmlContent).toContain(mockConfig.uiConfig.branding?.companyName || '');
      expect(htmlContent).toContain('chat-widget.js');
    });

    it('should include working HTML with script tag', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['index.html'].async('string');

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<script src="./chat-widget.js">');
      expect(htmlContent).toContain('</html>');
    });

    it('should include README with installation instructions', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const readmeContent = await zip.files['README.md'].async('string');

      expect(readmeContent).toContain('# Chat Widget Installation');
      expect(readmeContent).toContain('Installation');
      expect(readmeContent).toContain('chat-widget.js');
    });
  });

  describe('Portal Page Package', () => {
    it('should generate a zip buffer for portal page', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it('should contain portal.html file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['portal.html']).toBeDefined();
    });

    it('should contain chat-widget.js file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['chat-widget.js']).toBeDefined();
    });

    it('should inject portal config into HTML', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['portal.html'].async('string');

      expect(htmlContent).toContain('"mode": "portal"');
      expect(htmlContent).toContain(mockConfig.relay.licenseKey);
      expect(htmlContent).toContain(widgetId);
    });

    it('should include fullscreen container div', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['portal.html'].async('string');

      expect(htmlContent).toContain('<div id="chat-portal">');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('</html>');
    });

    it('should include README with portal instructions', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['README.md']).toBeDefined();
      const readmeContent = await zip.files['README.md'].async('string');

      expect(readmeContent).toContain('# Chat Portal Package');
      expect(readmeContent).toContain('portal');
    });
  });

  describe('Widget Script Inclusion', () => {
    it('should copy actual widget bundle to website package', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const scriptContent = await zip.files['chat-widget.js'].async('string');

      expect(scriptContent.length).toBeGreaterThan(1000);
      expect(scriptContent).toContain('Widget');
    });

    it('should copy actual widget bundle to portal package', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const scriptContent = await zip.files['chat-widget.js'].async('string');

      expect(scriptContent.length).toBeGreaterThan(1000);
      expect(scriptContent).toContain('Widget');
    });
  });

  describe('Config Validation', () => {
    it('should throw error if license key missing', async () => {
      const invalidConfig = {
        ...mockConfig,
        relay: { ...mockConfig.relay, licenseKey: '' },
      };

      await expect(
        generator.generateWebsitePackage(invalidConfig)
      ).rejects.toThrow('License key is required');
    });

    it('should throw error if widget config invalid', async () => {
      const invalidConfig = null as any;

      await expect(
        generator.generateWebsitePackage(invalidConfig)
      ).rejects.toThrow();
    });

    it('should handle missing optional config fields', async () => {
      const minimalConfig: WidgetConfig = {
        license: 'test-license-123',
      };

      const zipBuffer = await generator.generateWebsitePackage(minimalConfig);
      expect(zipBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Package Metadata', () => {
    it('should include package name in website package', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const readmeContent = await zip.files['README.md'].async('string');
      expect(readmeContent).toContain('widget');
    });

    it('should include generation timestamp comment', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['index.html'].async('string');
      expect(htmlContent).toMatch(/Generated on/i);
    });
  });

  describe('File Structure', () => {
    it('should have correct number of files in website package', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));
      expect(fileNames.length).toBe(3); // index.html, chat-widget.js, README.md
    });

    it('should have correct number of files in portal package', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generatePortalPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));
      expect(fileNames.length).toBe(3); // portal.html, chat-widget.js, README.md
    });

    it('should not include any directory entries', async () => {
      const zipBuffer = await generator.generateWebsitePackage(mockConfig);
      const zip = await JSZip.loadAsync(zipBuffer);

      const directories = Object.keys(zip.files).filter(name => name.endsWith('/'));
      expect(directories.length).toBe(0);
    });
  });
});

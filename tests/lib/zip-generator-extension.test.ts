/**
 * Chrome Extension Package Tests
 *
 * TDD RED Phase: Writing failing tests for Chrome extension package generation
 *
 * Extension Package Contents:
 * - manifest.json (Manifest V3)
 * - sidepanel.html (Chrome side panel UI)
 * - background.js (service worker)
 * - chat-widget.js (widget bundle)
 * - icons/ (16x16, 48x48, 128x128)
 * - README.md (installation guide)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import JSZip from 'jszip';
import { ZipGenerator } from '@/lib/zip-generator';
import type { WidgetConfig } from '@/widget/src/types';

describe('ZipGenerator - Chrome Extension Package', () => {
  let generator: ZipGenerator;
  let mockConfig: WidgetConfig;

  beforeEach(() => {
    generator = new ZipGenerator();

    mockConfig = {
      license: 'test-extension-key-456',
      branding: {
        companyName: 'Extension Test Co',
        logoUrl: 'https://example.com/logo.png',
        firstMessage: 'Welcome to our extension chat!',
      },
      style: {
        primaryColor: '#00bfff',
        theme: 'light',
      },
      connection: {
        webhookUrl: 'https://n8n.example.com/webhook/extension',
      },
    };
  });

  describe('Extension Package Generation', () => {
    it('should generate a zip buffer for extension package', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);

      expect(zipBuffer).toBeInstanceOf(Buffer);
      expect(zipBuffer.length).toBeGreaterThan(0);
    });

    it('should contain manifest.json file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['manifest.json']).toBeDefined();
    });

    it('should contain sidepanel.html file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['sidepanel.html']).toBeDefined();
    });

    it('should contain background.js file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['background.js']).toBeDefined();
    });

    it('should contain chat-widget.js file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['chat-widget.js']).toBeDefined();
    });

    it('should contain README.md file', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['README.md']).toBeDefined();
    });

    it('should contain icon files in icons directory', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      expect(zip.files['icons/icon-16.png']).toBeDefined();
      expect(zip.files['icons/icon-48.png']).toBeDefined();
      expect(zip.files['icons/icon-128.png']).toBeDefined();
    });
  });

  describe('Manifest.json Validation', () => {
    it('should have valid Manifest V3 structure', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const manifestContent = await zip.files['manifest.json'].async('string');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.manifest_version).toBe(3);
      expect(manifest.name).toBeTruthy();
      expect(manifest.version).toBeTruthy();
      expect(manifest.description).toBeTruthy();
    });

    it('should include side_panel configuration', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const manifestContent = await zip.files['manifest.json'].async('string');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.side_panel).toBeDefined();
      expect(manifest.side_panel.default_path).toBe('sidepanel.html');
    });

    it('should include background service worker', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const manifestContent = await zip.files['manifest.json'].async('string');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.background).toBeDefined();
      expect(manifest.background.service_worker).toBe('background.js');
    });

    it('should include action with icon paths', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const manifestContent = await zip.files['manifest.json'].async('string');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.action).toBeDefined();
      expect(manifest.action.default_icon).toBeDefined();
      expect(manifest.icons).toBeDefined();
    });

    it('should include company name in manifest', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const manifestContent = await zip.files['manifest.json'].async('string');
      const manifest = JSON.parse(manifestContent);

      expect(manifest.name).toContain(mockConfig.branding?.companyName);
    });
  });

  describe('Sidepanel HTML Validation', () => {
    it('should have valid HTML structure', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['sidepanel.html'].async('string');

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html');
      expect(htmlContent).toContain('</html>');
    });

    it('should include widget script reference', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['sidepanel.html'].async('string');

      expect(htmlContent).toContain('chat-widget.js');
      expect(htmlContent).toContain('<script');
    });

    it('should include portal mode configuration', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['sidepanel.html'].async('string');

      expect(htmlContent).toContain('"mode": "portal"');
      expect(htmlContent).toContain(mockConfig.license);
    });

    it('should include chat-portal container div', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const htmlContent = await zip.files['sidepanel.html'].async('string');

      expect(htmlContent).toContain('<div id="chat-portal">');
    });
  });

  describe('Background Script Validation', () => {
    it('should have service worker code', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const bgContent = await zip.files['background.js'].async('string');

      expect(bgContent.length).toBeGreaterThan(0);
      expect(bgContent).toContain('chrome');
    });

    it('should handle sidePanel API', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const bgContent = await zip.files['background.js'].async('string');

      expect(bgContent).toContain('sidePanel');
    });
  });

  describe('README Validation', () => {
    it('should include extension installation instructions', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const readmeContent = await zip.files['README.md'].async('string');

      expect(readmeContent).toContain('# Chrome Extension');
      expect(readmeContent).toContain('chrome://extensions');
      expect(readmeContent).toContain('Developer mode');
    });

    it('should include widget ID reference', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const readmeContent = await zip.files['README.md'].async('string');

      expect(readmeContent).toContain(widgetId);
    });
  });

  describe('File Structure', () => {
    it('should have correct number of files', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const fileNames = Object.keys(zip.files).filter(name => !name.endsWith('/'));

      // Expected files: manifest.json, sidepanel.html, background.js,
      // chat-widget.js, README.md, icons/icon-16.png, icons/icon-48.png, icons/icon-128.png
      expect(fileNames.length).toBeGreaterThanOrEqual(8);
    });

    it('should have icons directory structure', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const zipBuffer = await generator.generateExtensionPackage(mockConfig, widgetId);
      const zip = await JSZip.loadAsync(zipBuffer);

      const iconFiles = Object.keys(zip.files).filter(name => name.startsWith('icons/'));
      expect(iconFiles.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Config Validation', () => {
    it('should require license key', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const invalidConfig = { ...mockConfig, license: '' };

      await expect(
        generator.generateExtensionPackage(invalidConfig, widgetId)
      ).rejects.toThrow('License key is required');
    });

    it('should handle missing optional branding', async () => {
      const widgetId = '550e8400-e29b-41d4-a716-446655440000';
      const minimalConfig: WidgetConfig = {
        license: 'test-license-789',
      };

      const zipBuffer = await generator.generateExtensionPackage(minimalConfig, widgetId);
      expect(zipBuffer).toBeInstanceOf(Buffer);
    });
  });
});

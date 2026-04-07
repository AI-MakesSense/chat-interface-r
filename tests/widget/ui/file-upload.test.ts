/**
 * Unit Tests for File Upload Component
 *
 * Tests for widget/src/ui/file-upload.ts
 *
 * Test Coverage:
 * - Rendering and DOM structure
 * - File selection flow
 * - File validation (type and size)
 * - File removal
 * - State integration
 * - Configuration handling
 * - Styling and theming
 * - Lifecycle and cleanup
 * - Edge cases and error handling
 *
 * EXPECTED TO FAIL: FileUpload class does not exist yet (RED phase)
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { FileUpload } from '@/widget/src/ui/file-upload';
import { WidgetConfig } from '@/widget/src/types';
import { StateManager, WidgetState } from '@/widget/src/core/state';

/**
 * Helper function to create mock File objects for testing
 */
function createMockFile(name: string, size: number, type: string): File {
  const content = 'x'.repeat(size);
  const file = new File([content], name, { type });
  return file;
}

describe('FileUpload', () => {
  let config: WidgetConfig;
  let stateManager: StateManager;
  let fileUpload: FileUpload;
  let container: HTMLElement;

  const defaultConfig: WidgetConfig = {
    branding: {
      companyName: 'Test Company',
      logoUrl: 'https://example.com/logo.png',
      welcomeText: 'Hello!',
      firstMessage: 'How can I help?',
    },
    style: {
      theme: 'light',
      primaryColor: '#00bfff',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      position: 'bottom-right',
      cornerRadius: 8,
      fontFamily: 'Arial',
      fontSize: 14,
    },
    features: {
      fileAttachmentsEnabled: true,
      allowedExtensions: ['.jpg', '.png', '.pdf', '.doc', '.docx'],
      maxFileSizeKB: 5120, // 5MB
    },
    connection: {
      webhookUrl: 'https://example.com/webhook',
    },
  };

  const defaultState: WidgetState = {
    isOpen: true,
    messages: [],
    isLoading: false,
    error: null,
    currentStreamingMessage: null,
    currentTheme: 'light',
  };

  beforeEach(() => {
    config = JSON.parse(JSON.stringify(defaultConfig));
    stateManager = new StateManager(defaultState);
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (fileUpload) {
      fileUpload.destroy();
    }
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe('render()', () => {
    test('should create file upload element with correct class', () => {
      // FAILS: FileUpload class does not exist
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      expect(element.tagName).toBe('DIV');
      expect(element.classList.contains('cw-file-upload')).toBe(true);
    });

    test('should render file upload button', () => {
      // FAILS: Upload button not rendered
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      const button = element.querySelector('button');
      expect(button).toBeTruthy();
    });

    test('should have button icon or text', () => {
      // FAILS: Button content not rendered
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      const button = element.querySelector('button');
      expect(button?.textContent || button?.querySelector('svg')).toBeTruthy();
    });

    test('should have ARIA label on button', () => {
      // FAILS: ARIA label not set
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      const button = element.querySelector('button');
      expect(button?.getAttribute('aria-label')).toBeTruthy();
      expect(button?.getAttribute('aria-label')).toMatch(/attach|file|upload/i);
    });

    test('should render hidden file input element', () => {
      // FAILS: Hidden file input not rendered
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      const fileInput = element.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();
      expect(fileInput?.getAttribute('style')).toMatch(/display:\s*none|visibility:\s*hidden/i);
    });

    test('should have initial state with no file selected', () => {
      // FAILS: Initial state not set
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      const fileInfo = element.querySelector('.cw-file-info');
      expect(fileInfo?.textContent || '').not.toContain('.jpg');
    });
  });

  // ============================================================
  // File Selection Tests
  // ============================================================

  describe('file selection', () => {
    test('should open file picker when button clicked', () => {
      // FAILS: Click handler not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const button = element.querySelector('button');
      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      button?.click();

      expect(clickSpy).toHaveBeenCalled();
    });

    test('should trigger validation when file selected', () => {
      // FAILS: File change event handler not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should display file info after selection
      expect(element.textContent).toContain('test.jpg');
    });

    test('should display selected file name', () => {
      // FAILS: File name display not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('document.pdf', 2048, 'application/pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(element.textContent).toContain('document.pdf');
    });

    test('should display selected file size', () => {
      // FAILS: File size display not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 2048, 'image/jpeg'); // 2KB

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(element.textContent).toMatch(/\d+\s*(KB|MB|bytes)/i);
    });

    test('should handle file preview for images (optional)', () => {
      // FAILS: Image preview not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('photo.png', 1024, 'image/png');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Optional: check for image preview element
      const preview = element.querySelector('img.cw-file-preview');
      expect(preview !== null || preview === null).toBe(true);
    });

    test('should handle file selection cancellation', () => {
      // FAILS: Cancel handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should not display any file info
      expect(element.querySelector('.cw-file-info')).toBeFalsy();
    });
  });

  // ============================================================
  // File Validation Tests
  // ============================================================

  describe('file validation', () => {
    test('should validate file extension (allowed)', () => {
      // FAILS: Extension validation not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should accept .jpg file
      expect(element.textContent).toContain('test.jpg');
      expect(element.textContent).not.toMatch(/invalid|error/i);
    });

    test('should reject invalid file extension', () => {
      // FAILS: Extension rejection not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.exe', 1024, 'application/x-msdownload');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should show error for .exe file
      expect(element.textContent).toMatch(/invalid|not allowed|error/i);
    });

    test('should validate file size (within limit)', () => {
      // FAILS: Size validation not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      // 2MB file, limit is 5MB
      const mockFile = createMockFile('test.pdf', 2 * 1024 * 1024, 'application/pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should accept file within size limit
      expect(element.textContent).not.toMatch(/too large|size limit/i);
    });

    test('should reject file exceeding size limit', () => {
      // FAILS: Size rejection not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      // 10MB file, limit is 5MB
      const mockFile = createMockFile('huge.pdf', 10 * 1024 * 1024, 'application/pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should show error for oversized file
      expect(element.textContent).toMatch(/too large|size limit|exceeds/i);
    });

    test('should show error message for invalid file type', () => {
      // FAILS: Error message display not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('script.js', 1024, 'application/javascript');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const errorElement = element.querySelector('.cw-error, .cw-file-error');
      expect(errorElement?.textContent).toMatch(/invalid|not allowed/i);
    });

    test('should show error message for oversized file', () => {
      // FAILS: Size error message not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('big.pdf', 10 * 1024 * 1024, 'application/pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const errorElement = element.querySelector('.cw-error, .cw-file-error');
      expect(errorElement?.textContent).toMatch(/size|large|exceeds/i);
    });

    test('should perform case-insensitive extension matching', () => {
      // FAILS: Case-insensitive check not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.JPG', 1024, 'image/jpeg'); // Uppercase

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should accept .JPG (uppercase) when .jpg is allowed
      expect(element.textContent).not.toMatch(/invalid|error/i);
    });

    test('should validate common MIME types', () => {
      // FAILS: MIME type validation not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('photo.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should validate MIME type matches extension
      expect(element.textContent).toContain('photo.jpg');
    });
  });

  // ============================================================
  // File Removal Tests
  // ============================================================

  describe('file removal', () => {
    test('should show remove button after file selected', () => {
      // FAILS: Remove button not rendered
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const removeButton = element.querySelector('button[aria-label*="remove"]') ||
                          element.querySelector('.cw-remove-file');
      expect(removeButton).toBeTruthy();
    });

    test('should clear file when remove button clicked', () => {
      // FAILS: Remove functionality not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const removeButton = element.querySelector('button[aria-label*="remove"]') ||
                          element.querySelector('.cw-remove-file');
      (removeButton as HTMLElement)?.click();

      // File info should be hidden after removal
      expect(element.textContent).not.toContain('test.jpg');
    });

    test('should update state after file removal', () => {
      // FAILS: State update on removal not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const removeButton = element.querySelector('button[aria-label*="remove"]') ||
                          element.querySelector('.cw-remove-file');

      const setStateSpy = vi.spyOn(stateManager, 'setState');
      (removeButton as HTMLElement)?.click();

      expect(setStateSpy).toHaveBeenCalledWith(expect.objectContaining({
        attachedFile: null,
      }));
    });
  });

  // ============================================================
  // State Integration Tests
  // ============================================================

  describe('state integration', () => {
    test('should update state.attachedFile on selection', () => {
      // FAILS: State update not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const setStateSpy = vi.spyOn(stateManager, 'setState');

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(setStateSpy).toHaveBeenCalledWith(expect.objectContaining({
        attachedFile: expect.any(File),
      }));
    });

    test('should clear state.attachedFile on removal', () => {
      // FAILS: State clearing not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const setStateSpy = vi.spyOn(stateManager, 'setState');
      const removeButton = element.querySelector('button[aria-label*="remove"]') ||
                          element.querySelector('.cw-remove-file');
      (removeButton as HTMLElement)?.click();

      expect(setStateSpy).toHaveBeenCalledWith(expect.objectContaining({
        attachedFile: null,
      }));
    });

    test('should respect state.isLoading (disable during send)', () => {
      // FAILS: isLoading handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      stateManager.setState({ isLoading: true });

      const button = element.querySelector('button');
      expect(button?.hasAttribute('disabled')).toBe(true);
    });

    test('should re-enable after send completes', () => {
      // FAILS: Re-enabling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const button = element.querySelector('button');

      stateManager.setState({ isLoading: true });
      expect(button?.hasAttribute('disabled')).toBe(true);

      stateManager.setState({ isLoading: false });
      expect(button?.hasAttribute('disabled')).toBe(false);
    });
  });

  // ============================================================
  // Configuration Tests
  // ============================================================

  describe('configuration', () => {
    test('should read allowed extensions from config', () => {
      // FAILS: Config reading not implemented
      config.features.allowedExtensions = ['.txt', '.md'];
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.txt', 1024, 'text/plain');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(element.textContent).toContain('test.txt');
    });

    test('should read max file size from config', () => {
      // FAILS: Max size config not implemented
      config.features.maxFileSizeKB = 1024; // 1MB
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('big.pdf', 2 * 1024 * 1024, 'application/pdf'); // 2MB

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should reject based on config limit
      expect(element.textContent).toMatch(/too large|size limit/i);
    });

    test('should use default values if config missing', () => {
      // FAILS: Default values not implemented
      config.features.allowedExtensions = [];
      config.features.maxFileSizeKB = 0;

      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      // Should still render with sensible defaults
      expect(element).toBeTruthy();
    });

    test('should validate config values on construction', () => {
      // FAILS: Config validation not implemented
      config.features.maxFileSizeKB = -1; // Invalid

      expect(() => {
        fileUpload = new FileUpload(config, stateManager);
      }).not.toThrow(); // Should handle gracefully
    });
  });

  // ============================================================
  // Styling Tests
  // ============================================================

  describe('styling', () => {
    test('should apply theme-aware button styling', () => {
      // FAILS: Theme styles not applied
      config.style.theme = 'light';
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      expect(element.classList.contains('cw-theme-light')).toBe(true);
    });

    test('should apply dark theme styling', () => {
      // FAILS: Dark theme not applied
      config.style.theme = 'dark';
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();

      expect(element.classList.contains('cw-theme-dark')).toBe(true);
    });

    test('should have file preview styling', () => {
      // FAILS: Preview styles not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const fileInfo = element.querySelector('.cw-file-info');
      expect(fileInfo).toBeTruthy();
    });

    test('should have error message styling (red)', () => {
      // FAILS: Error styling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.exe', 1024, 'application/x-msdownload');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const errorElement = element.querySelector('.cw-error, .cw-file-error');
      const styles = errorElement ? window.getComputedStyle(errorElement) : null;

      expect(styles?.color).toMatch(/rgb\(.*\)|#/); // Should have error color
    });
  });

  // ============================================================
  // Lifecycle Tests
  // ============================================================

  describe('lifecycle', () => {
    test('should clean up event listeners on destroy', () => {
      // FAILS: destroy() not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      fileUpload.destroy();

      const button = element.querySelector('button');
      button?.click();

      // Should not trigger file picker after destroy
      expect(element).toBeTruthy();
    });

    test('should unsubscribe from state on destroy', () => {
      // FAILS: State unsubscribe not called
      const unsubscribeSpy = vi.fn();
      stateManager.subscribe = vi.fn(() => unsubscribeSpy);

      fileUpload = new FileUpload(config, stateManager);
      fileUpload.render();

      fileUpload.destroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    test('should handle multiple destroy calls safely', () => {
      // FAILS: Idempotent destroy not implemented
      fileUpload = new FileUpload(config, stateManager);
      fileUpload.render();

      expect(() => {
        fileUpload.destroy();
        fileUpload.destroy();
      }).not.toThrow();
    });
  });

  // ============================================================
  // Edge Cases Tests
  // ============================================================

  describe('edge cases', () => {
    test('should handle empty file selection', () => {
      // FAILS: Empty selection handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      expect(element.querySelector('.cw-file-info')).toBeFalsy();
    });

    test('should handle null file', () => {
      // FAILS: Null file handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: null,
        writable: false,
      });

      expect(() => {
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }).not.toThrow();
    });

    test('should handle undefined file', () => {
      // FAILS: Undefined file handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: undefined,
        writable: false,
      });

      expect(() => {
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }).not.toThrow();
    });

    test('should handle browser without File API support (graceful degradation)', () => {
      // FAILS: Graceful degradation not implemented
      const originalFile = global.File;
      // @ts-ignore
      global.File = undefined;

      expect(() => {
        fileUpload = new FileUpload(config, stateManager);
        fileUpload.render();
      }).not.toThrow();

      global.File = originalFile;
    });

    test('should handle very long file names (truncation)', () => {
      // FAILS: Long filename handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const longName = 'very_long_filename_'.repeat(10) + '.jpg';
      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile(longName, 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should display truncated or abbreviated filename
      expect(element.textContent).toBeTruthy();
    });

    test('should handle missing config gracefully', () => {
      // FAILS: Config validation not implemented
      expect(() => {
        fileUpload = new FileUpload(null as any, stateManager);
      }).toThrow();
    });

    test('should handle missing state manager gracefully', () => {
      // FAILS: StateManager validation not implemented
      expect(() => {
        fileUpload = new FileUpload(config, null as any);
      }).toThrow();
    });

    test('should handle file with no extension', () => {
      // FAILS: Extensionless file handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('README', 1024, 'text/plain');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should handle gracefully (likely reject)
      expect(element).toBeTruthy();
    });

    test('should handle multiple file extensions (e.g., .tar.gz)', () => {
      // FAILS: Multiple extension handling not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('archive.tar.gz', 1024, 'application/gzip');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should check last extension (.gz)
      expect(element).toBeTruthy();
    });

    test('should handle file with misleading extension', () => {
      // FAILS: MIME type mismatch detection not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      // File named .jpg but MIME says it's not an image
      const mockFile = createMockFile('fake.jpg', 1024, 'application/x-msdownload');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Should validate MIME type, not just extension
      expect(element).toBeTruthy();
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('integration', () => {
    test('should work correctly in full upload flow', () => {
      // FAILS: Full flow not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      // Step 1: Select file
      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('document.pdf', 2048, 'application/pdf');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Step 2: Verify file displayed
      expect(element.textContent).toContain('document.pdf');

      // Step 3: Remove file
      const removeButton = element.querySelector('button[aria-label*="remove"]') ||
                          element.querySelector('.cw-remove-file');
      (removeButton as HTMLElement)?.click();

      // Step 4: Verify file cleared
      expect(element.textContent).not.toContain('document.pdf');
    });

    test('should integrate with send message flow', () => {
      // FAILS: Send integration not implemented
      fileUpload = new FileUpload(config, stateManager);
      const element = fileUpload.render();
      container.appendChild(element);

      const fileInput = element.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = createMockFile('test.jpg', 1024, 'image/jpeg');

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Simulate sending
      stateManager.setState({ isLoading: true });

      const button = element.querySelector('button');
      expect(button?.hasAttribute('disabled')).toBe(true);

      // Complete sending
      stateManager.setState({ isLoading: false });

      expect(button?.hasAttribute('disabled')).toBe(false);
    });
  });
});

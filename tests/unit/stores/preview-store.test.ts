/**
 * Preview Store Tests (RED Phase)
 *
 * Tests for widget preview state management.
 * These tests should FAIL initially as they expose missing functionality or bugs.
 *
 * Test Coverage:
 * - setDeviceMode
 * - sendConfigUpdate with postMessage
 * - debouncing behavior (if implemented)
 * - iframe ready state
 * - openWidget/closeWidget
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePreviewStore, PreviewMessageType } from '@/stores/preview-store';
import type { WidgetConfig } from '@/stores/widget-store';

describe('Preview Store', () => {
  beforeEach(() => {
    // Clear store state before each test
    usePreviewStore.setState({
      deviceMode: 'desktop',
      isPreviewReady: false,
      isWidgetOpen: false,
      previewError: null,
      lastUpdateTime: 0,
      iframeRef: null,
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should fail - initial state should be desktop mode', () => {
      // WHY THIS SHOULD FAIL: Verify default state
      const state = usePreviewStore.getState();

      expect(state.deviceMode).toBe('desktop');
      expect(state.isPreviewReady).toBe(false);
      expect(state.isWidgetOpen).toBe(false);
      expect(state.previewError).toBeNull();
      expect(state.iframeRef).toBeNull();
    });
  });

  describe('Device Mode', () => {
    it('should fail - setDeviceMode should change device mode', () => {
      // WHY THIS SHOULD FAIL: Need to verify device mode switching
      const { setDeviceMode } = usePreviewStore.getState();

      setDeviceMode('mobile');

      expect(usePreviewStore.getState().deviceMode).toBe('mobile');

      setDeviceMode('tablet');

      expect(usePreviewStore.getState().deviceMode).toBe('tablet');

      setDeviceMode('desktop');

      expect(usePreviewStore.getState().deviceMode).toBe('desktop');
    });

    it('should fail - getDeviceDimensions should return correct dimensions', () => {
      // WHY THIS SHOULD FAIL: Need to verify dimension lookup
      const { setDeviceMode, getDeviceDimensions } = usePreviewStore.getState();

      // Desktop
      setDeviceMode('desktop');
      let dimensions = getDeviceDimensions();
      expect(dimensions.width).toBe(1440);
      expect(dimensions.height).toBe(900);
      expect(dimensions.label).toBe('Desktop');

      // Tablet
      setDeviceMode('tablet');
      dimensions = getDeviceDimensions();
      expect(dimensions.width).toBe(768);
      expect(dimensions.height).toBe(1024);
      expect(dimensions.label).toBe('Tablet');

      // Mobile
      setDeviceMode('mobile');
      dimensions = getDeviceDimensions();
      expect(dimensions.width).toBe(375);
      expect(dimensions.height).toBe(667);
      expect(dimensions.label).toBe('Mobile');
    });
  });

  describe('Preview Ready State', () => {
    it('should fail - setPreviewReady should update ready state', () => {
      // WHY THIS SHOULD FAIL: Need to verify ready state management
      const { setPreviewReady } = usePreviewStore.getState();

      setPreviewReady(true);

      expect(usePreviewStore.getState().isPreviewReady).toBe(true);

      setPreviewReady(false);

      expect(usePreviewStore.getState().isPreviewReady).toBe(false);
    });

    it('should fail - setPreviewReady(true) should clear error', () => {
      // WHY THIS SHOULD FAIL: Need to verify error clearing on ready
      const { setPreviewError, setPreviewReady } = usePreviewStore.getState();

      // Set error
      setPreviewError('Test error');
      expect(usePreviewStore.getState().previewError).toBe('Test error');

      // Set ready
      setPreviewReady(true);

      expect(usePreviewStore.getState().previewError).toBeNull();
    });
  });

  describe('sendConfigUpdate', () => {
    it('should fail - sendConfigUpdate should call postMessage with correct payload', () => {
      // WHY THIS SHOULD FAIL: Need to verify postMessage is called
      const { sendConfigUpdate, setIframeRef, setPreviewReady } = usePreviewStore.getState();

      // Create mock iframe
      const mockPostMessage = vi.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      setPreviewReady(true);

      const testConfig: WidgetConfig = {
        branding: {
          companyName: 'Test Company',
        },
        style: {
          theme: 'dark',
          primaryColor: '#ff0000',
          position: 'bottom-right',
          cornerRadius: 8,
        },
        connection: {
          webhookUrl: 'https://test.com',
        },
      };

      sendConfigUpdate(testConfig);

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: PreviewMessageType.CONFIG_UPDATE,
          payload: testConfig,
        },
        '*'
      );
    });

    it('should fail - sendConfigUpdate should update lastUpdateTime', () => {
      // WHY THIS SHOULD FAIL: Need to verify update time tracking
      const { sendConfigUpdate, setIframeRef, setPreviewReady } = usePreviewStore.getState();

      // Create mock iframe
      const mockIframe = {
        contentWindow: {
          postMessage: vi.fn(),
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      setPreviewReady(true);

      const beforeTime = Date.now();

      sendConfigUpdate({
        branding: {},
        style: {
          theme: 'light',
          primaryColor: '#00bfff',
          position: 'bottom-right',
          cornerRadius: 12,
        },
        connection: {
          webhookUrl: '',
        },
      });

      const afterTime = Date.now();
      const lastUpdateTime = usePreviewStore.getState().lastUpdateTime;

      expect(lastUpdateTime).toBeGreaterThanOrEqual(beforeTime);
      expect(lastUpdateTime).toBeLessThanOrEqual(afterTime);
    });

    it('should fail - sendConfigUpdate should not call postMessage if iframe not ready', () => {
      // WHY THIS SHOULD FAIL: Need to verify guard against unready iframe
      const { sendConfigUpdate, setIframeRef } = usePreviewStore.getState();

      const mockPostMessage = vi.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      // Note: NOT setting preview ready

      sendConfigUpdate({
        branding: {},
        style: {
          theme: 'light',
          primaryColor: '#00bfff',
          position: 'bottom-right',
          cornerRadius: 12,
        },
        connection: {
          webhookUrl: '',
        },
      });

      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it('should fail - sendConfigUpdate should not call postMessage if iframe ref is null', () => {
      // WHY THIS SHOULD FAIL: Need to verify guard against null iframe
      const { sendConfigUpdate, setPreviewReady } = usePreviewStore.getState();

      setPreviewReady(true);
      // Note: NOT setting iframe ref

      // Should not throw
      expect(() => {
        sendConfigUpdate({
          branding: {},
          style: {
            theme: 'light',
            primaryColor: '#00bfff',
            position: 'bottom-right',
            cornerRadius: 12,
          },
          connection: {
            webhookUrl: '',
          },
        });
      }).not.toThrow();
    });
  });

  describe('openWidget / closeWidget', () => {
    it('should fail - openWidget should send OPEN_WIDGET message', () => {
      // WHY THIS SHOULD FAIL: Need to verify open widget message
      const { openWidget, setIframeRef, setPreviewReady } = usePreviewStore.getState();

      const mockPostMessage = vi.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      setPreviewReady(true);

      openWidget();

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: PreviewMessageType.OPEN_WIDGET,
        },
        '*'
      );

      expect(usePreviewStore.getState().isWidgetOpen).toBe(true);
    });

    it('should fail - closeWidget should send CLOSE_WIDGET message', () => {
      // WHY THIS SHOULD FAIL: Need to verify close widget message
      const { closeWidget, setIframeRef, setPreviewReady, setWidgetOpen } = usePreviewStore.getState();

      const mockPostMessage = vi.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      setPreviewReady(true);
      setWidgetOpen(true);

      closeWidget();

      expect(mockPostMessage).toHaveBeenCalledWith(
        {
          type: PreviewMessageType.CLOSE_WIDGET,
        },
        '*'
      );

      expect(usePreviewStore.getState().isWidgetOpen).toBe(false);
    });

    it('should fail - openWidget should not send message if not ready', () => {
      // WHY THIS SHOULD FAIL: Need to verify guard for unready iframe
      const { openWidget, setIframeRef } = usePreviewStore.getState();

      const mockPostMessage = vi.fn();
      const mockIframe = {
        contentWindow: {
          postMessage: mockPostMessage,
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      // Note: NOT setting preview ready

      openWidget();

      expect(mockPostMessage).not.toHaveBeenCalled();
      expect(usePreviewStore.getState().isWidgetOpen).toBe(false);
    });
  });

  describe('Widget Open State', () => {
    it('should fail - setWidgetOpen should update open state', () => {
      // WHY THIS SHOULD FAIL: Need to verify open state management
      const { setWidgetOpen } = usePreviewStore.getState();

      setWidgetOpen(true);

      expect(usePreviewStore.getState().isWidgetOpen).toBe(true);

      setWidgetOpen(false);

      expect(usePreviewStore.getState().isWidgetOpen).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should fail - setPreviewError should set error', () => {
      // WHY THIS SHOULD FAIL: Need to verify error setting
      const { setPreviewError } = usePreviewStore.getState();

      setPreviewError('Test error');

      expect(usePreviewStore.getState().previewError).toBe('Test error');
    });

    it('should fail - clearError should clear error', () => {
      // WHY THIS SHOULD FAIL: Need to verify error clearing
      const { setPreviewError, clearError } = usePreviewStore.getState();

      setPreviewError('Test error');
      expect(usePreviewStore.getState().previewError).toBe('Test error');

      clearError();

      expect(usePreviewStore.getState().previewError).toBeNull();
    });
  });

  describe('Iframe Reference', () => {
    it('should fail - setIframeRef should set iframe reference', () => {
      // WHY THIS SHOULD FAIL: Need to verify iframe ref management
      const { setIframeRef } = usePreviewStore.getState();

      const mockIframe = {
        contentWindow: {
          postMessage: vi.fn(),
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);

      expect(usePreviewStore.getState().iframeRef).toBe(mockIframe);
    });

    it('should fail - setIframeRef with null should clear reference', () => {
      // WHY THIS SHOULD FAIL: Need to verify clearing iframe ref
      const { setIframeRef } = usePreviewStore.getState();

      const mockIframe = {
        contentWindow: {
          postMessage: vi.fn(),
        },
      } as unknown as HTMLIFrameElement;

      setIframeRef(mockIframe);
      expect(usePreviewStore.getState().iframeRef).toBe(mockIframe);

      setIframeRef(null);

      expect(usePreviewStore.getState().iframeRef).toBeNull();
    });
  });
});

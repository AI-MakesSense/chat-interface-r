/**
 * Preview Store
 *
 * Zustand store for managing real-time widget preview state.
 * Handles device modes, preview updates, and iframe communication.
 *
 * Features:
 * - Device mode switching (desktop/tablet/mobile)
 * - Preview state management
 * - Configuration update tracking
 * - Iframe ready state
 */

import { create } from 'zustand';
import { WidgetConfig } from './widget-store';

/**
 * Device modes for responsive preview
 */
export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

/**
 * Device viewport dimensions
 */
export interface DeviceDimensions {
  width: number;
  height: number;
  label: string;
}

/**
 * Device mode configurations
 */
export const DEVICE_MODES: Record<DeviceMode, DeviceDimensions> = {
  desktop: {
    width: 1440,
    height: 900,
    label: 'Desktop',
  },
  tablet: {
    width: 768,
    height: 1024,
    label: 'Tablet',
  },
  mobile: {
    width: 375,
    height: 667,
    label: 'Mobile',
  },
};

/**
 * Preview message types for postMessage communication
 */
export enum PreviewMessageType {
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  PREVIEW_READY = 'PREVIEW_READY',
  PREVIEW_ERROR = 'PREVIEW_ERROR',
  OPEN_WIDGET = 'OPEN_WIDGET',
  CLOSE_WIDGET = 'CLOSE_WIDGET',
}

/**
 * Preview message structure
 */
export interface PreviewMessage {
  type: PreviewMessageType;
  payload?: any;
}

/**
 * Preview store state interface
 */
interface PreviewState {
  // State
  deviceMode: DeviceMode;
  isPreviewReady: boolean;
  isWidgetOpen: boolean;
  previewError: string | null;
  lastUpdateTime: number;

  // Iframe reference
  iframeRef: HTMLIFrameElement | null;

  // Actions
  setDeviceMode: (mode: DeviceMode) => void;
  setPreviewReady: (ready: boolean) => void;
  setWidgetOpen: (open: boolean) => void;
  setPreviewError: (error: string | null) => void;
  setIframeRef: (iframe: HTMLIFrameElement | null) => void;

  // Preview communication
  sendConfigUpdate: (config: WidgetConfig) => void;
  openWidget: () => void;
  closeWidget: () => void;

  // Utilities
  getDeviceDimensions: () => DeviceDimensions;
  clearError: () => void;
}

/**
 * Preview store
 *
 * Manages preview state and iframe communication
 */
export const usePreviewStore = create<PreviewState>((set, get) => ({
  // Initial state
  deviceMode: 'desktop',
  isPreviewReady: false,
  isWidgetOpen: false,
  previewError: null,
  lastUpdateTime: 0,
  iframeRef: null,

  /**
   * Set device mode for responsive preview
   */
  setDeviceMode: (mode: DeviceMode) => {
    set({ deviceMode: mode });
  },

  /**
   * Set preview ready state
   * Called when iframe signals it's ready to receive messages
   */
  setPreviewReady: (ready: boolean) => {
    set({ isPreviewReady: ready, previewError: ready ? null : get().previewError });
  },

  /**
   * Set widget open/closed state
   */
  setWidgetOpen: (open: boolean) => {
    set({ isWidgetOpen: open });
  },

  /**
   * Set preview error
   */
  setPreviewError: (error: string | null) => {
    set({ previewError: error });
  },

  /**
   * Set iframe reference
   */
  setIframeRef: (iframe: HTMLIFrameElement | null) => {
    set({ iframeRef: iframe });
  },

  /**
   * Send configuration update to iframe
   * Uses postMessage for secure cross-origin communication
   */
  sendConfigUpdate: (config: WidgetConfig) => {
    const { iframeRef, isPreviewReady } = get();

    if (!iframeRef || !iframeRef.contentWindow) {
      console.warn('Preview iframe not available');
      return;
    }

    if (!isPreviewReady) {
      console.warn('Preview not ready yet');
      return;
    }

    const message: PreviewMessage = {
      type: PreviewMessageType.CONFIG_UPDATE,
      payload: config,
    };

    // Send message to iframe
    iframeRef.contentWindow.postMessage(message, '*');

    // Track update time for latency monitoring
    set({ lastUpdateTime: Date.now() });
  },

  /**
   * Open widget in preview
   */
  openWidget: () => {
    const { iframeRef, isPreviewReady } = get();

    if (!iframeRef || !iframeRef.contentWindow || !isPreviewReady) {
      return;
    }

    const message: PreviewMessage = {
      type: PreviewMessageType.OPEN_WIDGET,
    };

    iframeRef.contentWindow.postMessage(message, '*');
    set({ isWidgetOpen: true });
  },

  /**
   * Close widget in preview
   */
  closeWidget: () => {
    const { iframeRef, isPreviewReady } = get();

    if (!iframeRef || !iframeRef.contentWindow || !isPreviewReady) {
      return;
    }

    const message: PreviewMessage = {
      type: PreviewMessageType.CLOSE_WIDGET,
    };

    iframeRef.contentWindow.postMessage(message, '*');
    set({ isWidgetOpen: false });
  },

  /**
   * Get current device dimensions
   */
  getDeviceDimensions: () => {
    const { deviceMode } = get();
    return DEVICE_MODES[deviceMode];
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ previewError: null });
  },
}));

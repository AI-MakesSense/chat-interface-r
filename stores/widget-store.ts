/**
 * Widget Store
 *
 * Zustand store for managing widget configuration state.
 * Handles creating, updating, and saving widget configurations.
 *
 * Features:
 * - Widget configuration CRUD operations
 * - Auto-save with debouncing
 * - Real-time preview updates
 * - Loading and error states
 */

import { create } from 'zustand';

/**
 * Widget configuration structure
 * Matches the JSON schema stored in database
 */
export interface WidgetConfig {
  // Branding
  branding: {
    companyName?: string;
    logoUrl?: string;
    welcomeText?: string;
    firstMessage?: string;
  };

  // Theme & Colors
  style: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    backgroundColor?: string;
    textColor?: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    cornerRadius?: number;
  };

  // Typography
  typography?: {
    fontFamily?: string;
    fontSize?: number;
  };

  // Connection
  connection: {
    webhookUrl: string;
    routeParam?: string;
  };

  // Features
  features?: {
    fileAttachments?: boolean;
    allowedExtensions?: string[];
    maxFileSize?: number;
  };

  // Advanced
  advanced?: {
    customCss?: string;
    customJs?: string;
  };
}

/**
 * Widget object from API
 */
export interface Widget {
  id: string;
  licenseId: string;
  licenseKey: string; // Added for embed code generation
  name: string;
  config: WidgetConfig;
  isDeployed: boolean;
  deployedAt: string | null;
  deployUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Widget creation payload
 */
export interface CreateWidgetData {
  licenseId: string;
  name: string;
  config: WidgetConfig;
}

/**
 * Widget update payload
 */
export interface UpdateWidgetData {
  name?: string;
  config?: WidgetConfig;
}

/**
 * Widget store state interface
 */
interface WidgetState {
  // State
  widgets: Widget[];
  currentWidget: Widget | null;
  currentConfig: WidgetConfig;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;

  // Actions
  fetchWidgets: (licenseId?: string) => Promise<void>;
  createWidget: (data: CreateWidgetData) => Promise<Widget>;
  getWidget: (id: string) => Promise<Widget>;
  updateWidget: (id: string, data: UpdateWidgetData) => Promise<Widget>;
  deleteWidget: (id: string) => Promise<void>;
  deployWidget: (id: string) => Promise<{ deployUrl: string }>;
  setCurrentWidget: (widget: Widget | null) => void;
  updateConfig: (config: Partial<WidgetConfig>) => void;
  saveConfig: () => Promise<void>;
  resetConfig: () => void;
  clearError: () => void;
}

/**
 * Default widget configuration
 */
const defaultConfig: WidgetConfig = {
  branding: {
    companyName: 'My Company',
    welcomeText: 'How can we help you today?',
    firstMessage: 'Hello! I\'m your AI assistant. Ask me anything!',
  },
  style: {
    theme: 'light',
    primaryColor: '#00bfff',
    position: 'bottom-right',
    cornerRadius: 12,
  },
  connection: {
    webhookUrl: '',
  },
};

/**
 * Widget store
 *
 * Manages widget configuration with auto-save and preview updates
 */
export const useWidgetStore = create<WidgetState>((set, get) => ({
  // Initial state
  widgets: [],
  currentWidget: null,
  currentConfig: defaultConfig,
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,

  /**
   * Fetch all widgets for current user or specific license
   */
  fetchWidgets: async (licenseId?: string) => {
    set({ isLoading: true, error: null });

    try {
      const url = licenseId ? `/api/widgets?licenseId=${licenseId}` : '/api/widgets';
      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch widgets');
      }

      const data = await response.json();

      set({
        widgets: data.widgets || [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        widgets: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widgets',
      });
      throw error;
    }
  },

  /**
   * Create a new widget
   */
  createWidget: async (data: CreateWidgetData) => {
    set({ isSaving: true, error: null });

    try {
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create widget');
      }

      const responseData = await response.json();
      const widget = responseData.widget;

      set((state) => ({
        widgets: [...state.widgets, widget],
        currentWidget: widget,
        currentConfig: widget.config,
        isSaving: false,
        error: null,
        hasUnsavedChanges: false,
      }));

      return widget;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create widget',
      });
      throw error;
    }
  },

  /**
   * Get single widget by ID
   */
  getWidget: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/widgets/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch widget');
      }

      const data = await response.json();
      const widget = data.widget;

      set({
        currentWidget: widget,
        currentConfig: widget.config,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false,
      });

      return widget;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch widget',
      });
      throw error;
    }
  },

  /**
   * Update widget
   */
  updateWidget: async (id: string, data: UpdateWidgetData) => {
    set({ isSaving: true, error: null });

    try {
      const response = await fetch(`/api/widgets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update widget');
      }

      const responseData = await response.json();
      const widget = responseData.widget;

      set((state) => ({
        widgets: state.widgets.map((w) => (w.id === id ? widget : w)),
        currentWidget: widget,
        currentConfig: widget.config,
        isSaving: false,
        error: null,
        hasUnsavedChanges: false,
      }));

      return widget;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update widget',
      });
      throw error;
    }
  },

  /**
   * Delete widget
   */
  deleteWidget: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/widgets/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete widget');
      }

      set((state) => ({
        widgets: state.widgets.filter((w) => w.id !== id),
        currentWidget: state.currentWidget?.id === id ? null : state.currentWidget,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete widget',
      });
      throw error;
    }
  },

  /**
   * Deploy widget
   */
  deployWidget: async (id: string) => {
    set({ isSaving: true, error: null });

    try {
      const response = await fetch(`/api/widgets/${id}/deploy`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deploy widget');
      }

      const data = await response.json();

      set((state) => ({
        widgets: state.widgets.map((w) =>
          w.id === id
            ? { ...w, isDeployed: true, deployUrl: data.deployUrl, deployedAt: new Date().toISOString() }
            : w
        ),
        currentWidget:
          state.currentWidget?.id === id
            ? { ...state.currentWidget, isDeployed: true, deployUrl: data.deployUrl, deployedAt: new Date().toISOString() }
            : state.currentWidget,
        isSaving: false,
        error: null,
      }));

      return { deployUrl: data.deployUrl };
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to deploy widget',
      });
      throw error;
    }
  },

  /**
   * Set current widget for editing
   */
  setCurrentWidget: (widget: Widget | null) => {
    set({
      currentWidget: widget,
      currentConfig: widget?.config || defaultConfig,
      hasUnsavedChanges: false,
    });
  },

  /**
   * Update current configuration
   * Marks as having unsaved changes for auto-save
   */
  updateConfig: (configUpdate: Partial<WidgetConfig>) => {
    set((state) => ({
      currentConfig: {
        ...state.currentConfig,
        ...configUpdate,
        branding: {
          ...state.currentConfig.branding,
          ...configUpdate.branding,
        },
        style: {
          ...state.currentConfig.style,
          ...configUpdate.style,
        },
        connection: {
          ...state.currentConfig.connection,
          ...configUpdate.connection,
        },
        typography: {
          ...state.currentConfig.typography,
          ...configUpdate.typography,
        },
        features: {
          ...state.currentConfig.features,
          ...configUpdate.features,
        },
        advanced: {
          ...state.currentConfig.advanced,
          ...configUpdate.advanced,
        },
      },
      hasUnsavedChanges: true,
    }));
  },

  /**
   * Save current configuration
   */
  saveConfig: async () => {
    const { currentWidget, currentConfig, updateWidget } = get();

    if (!currentWidget) {
      throw new Error('No widget selected');
    }

    await updateWidget(currentWidget.id, { config: currentConfig });
  },

  /**
   * Reset configuration to last saved state
   */
  resetConfig: () => {
    const { currentWidget } = get();
    if (currentWidget) {
      set({
        currentConfig: currentWidget.config,
        hasUnsavedChanges: false,
      });
    }
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

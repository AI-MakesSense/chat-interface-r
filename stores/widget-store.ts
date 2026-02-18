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
 * Starter prompt for conversation starters
 */
export interface StarterPrompt {
  label: string;
  icon: string;
}

/**
 * Widget configuration structure
 * Matches the JSON schema stored in database
 * Extended to support playground-style configurator
 */
export interface WidgetConfig {
  // Widget metadata
  widgetId?: string;
  license?: {
    key?: string;
    active?: boolean;
    plan?: string;
  };

  // Branding
  branding: {
    companyName?: string;
    /** @deprecated Not rendered in current widget — use greeting instead */
    logoUrl?: string;
    welcomeText?: string;
    /** @deprecated Not used in current widget — use greeting instead */
    firstMessage?: string;
  };

  // Theme & Colors (legacy structure for backward compatibility)
  style: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    /** @deprecated Superseded by playground color system */
    backgroundColor?: string;
    /** @deprecated Superseded by playground color system */
    textColor?: string;
    /** @deprecated No UI control — widget always uses bottom-right */
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /** @deprecated No UI control — use radius instead */
    cornerRadius?: number;
  };

  // Typography (legacy)
  typography?: {
    fontFamily?: string;
    fontSize?: number;
  };

  // Connection
  connection: {
    provider?: 'n8n' | 'chatkit';
    webhookUrl?: string;
    routeParam?: string;
    // ChatKit specific
    workflowId?: string;
    apiKey?: string;
  };

  // Features (legacy)
  features?: {
    fileAttachments?: boolean;
    /** @deprecated No UI control — hardcoded defaults only */
    allowedExtensions?: string[];
    /** @deprecated No UI control — hardcoded to 5MB */
    maxFileSize?: number;
  };

  // Advanced (legacy)
  advanced?: {
    customCss?: string;
    /** @deprecated Not exposed or executed */
    customJs?: string;
  };

  // =========================================================================
  // NEW: Playground-style configuration (optional for backward compatibility)
  // =========================================================================

  // Color System
  themeMode?: 'light' | 'dark';
  useAccent?: boolean;
  accentColor?: string;
  useTintedGrayscale?: boolean;
  tintHue?: number;
  tintLevel?: number;
  shadeLevel?: number;
  useCustomSurfaceColors?: boolean;
  surfaceBackgroundColor?: string;
  surfaceForegroundColor?: string;
  useCustomTextColor?: boolean;
  customTextColor?: string;

  // ChatKit-specific color system
  chatkitGrayscaleHue?: number;        // 0-360
  chatkitGrayscaleTint?: number;       // saturation level
  chatkitGrayscaleShade?: number;      // brightness adjustment
  chatkitAccentPrimary?: string;       // hex color
  chatkitAccentLevel?: number;         // 1-3 intensity

  // Component Colors
  useCustomIconColor?: boolean;
  customIconColor?: string;
  useCustomUserMessageColors?: boolean;
  customUserMessageTextColor?: string;
  customUserMessageBackgroundColor?: string;

  // Typography (new style)
  fontFamily?: string;
  fontSize?: number;
  useCustomFont?: boolean;
  customFontName?: string;
  customFontCss?: string;
  customCss?: string;

  // Style
  radius?: 'none' | 'small' | 'medium' | 'large' | 'pill';
  density?: 'compact' | 'normal' | 'spacious';

  // Start Screen
  greeting?: string;
  starterPrompts?: StarterPrompt[];

  // Composer
  placeholder?: string;
  disclaimer?: string;
  enableAttachments?: boolean;
  enableModelPicker?: boolean;
  enablePdfLightbox?: boolean;

  // Inline embed dimensions (pixels)
  inlineWidth?: number;
  inlineHeight?: number;
}

/**
 * Embed type for widget deployment (Schema v2.0)
 */
export type EmbedType = 'popup' | 'inline' | 'fullpage' | 'portal';

/**
 * Widget object from API
 * Schema v2.0: Added widgetKey, embedType, allowedDomains, userId
 */
export interface Widget {
  id: string;
  name: string;
  config: WidgetConfig;
  isDeployed: boolean;
  deployedAt: string | null;
  deployUrl: string | null;
  createdAt: string;
  updatedAt: string;

  // Schema v2.0: Direct user relationship
  userId?: string;

  // Schema v2.0: Widget identification for embed URLs
  widgetKey?: string;

  // Schema v2.0: Embed type (how widget is deployed)
  embedType?: EmbedType;

  // Schema v2.0: Per-widget domain whitelist (null = allow all)
  allowedDomains?: string[] | null;

  // Legacy: License relationship (for backward compatibility)
  licenseId?: string;
  licenseKey?: string;
  license?: {
    id: string;
    domains: string[];
    tier: string;
    status: string;
  };
}

/**
 * Widget creation payload
 * Schema v2.0: licenseId is now optional, added embedType and allowedDomains
 */
export interface CreateWidgetData {
  name: string;
  config: WidgetConfig;
  // Schema v2.0: Optional fields
  embedType?: EmbedType;
  allowedDomains?: string[];
  widgetType?: 'n8n' | 'chatkit';
  // Legacy: For backward compatibility
  licenseId?: string;
}

/**
 * Widget update payload
 * Schema v2.0: Added embedType and allowedDomains
 */
export interface UpdateWidgetData {
  name?: string;
  config?: WidgetConfig;
  embedType?: EmbedType;
  allowedDomains?: string[];
  status?: 'active' | 'paused';
}

/**
 * License object (simplified from license-store)
 */
export interface WidgetLicense {
  id: string;
  licenseKey: string;
  tier: string;
  status: string;
  domains: string[];
  domainLimit: number;
  brandingEnabled: boolean;
}

/**
 * Widget store state interface
 */
interface WidgetState {
  // State
  widgets: Widget[];
  currentWidget: Widget | null;
  currentLicense: WidgetLicense | null;
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
 * Includes both legacy and new playground-style properties
 */
const defaultConfig: WidgetConfig = {
  // Legacy properties (for backward compatibility)
  branding: {
    companyName: 'My Company',
    welcomeText: 'How can we help you today?',
  },
  style: {
    theme: 'light',
    primaryColor: '#00bfff',
    position: 'bottom-right',
  },
  connection: {
    provider: 'n8n',
    webhookUrl: '',
    workflowId: '',
    apiKey: '',
  },

  // New playground-style properties
  themeMode: 'light',
  useAccent: true,
  accentColor: '#0ea5e9',
  useTintedGrayscale: false,
  tintHue: 220,
  tintLevel: 10,
  shadeLevel: 10,
  useCustomSurfaceColors: false,
  surfaceBackgroundColor: '#ffffff',
  surfaceForegroundColor: '#f8fafc',
  useCustomTextColor: false,
  customTextColor: '#1e293b',

  // ChatKit-specific defaults
  chatkitGrayscaleHue: 220,
  chatkitGrayscaleTint: 6,
  chatkitGrayscaleShade: -1,
  chatkitAccentPrimary: '#0f172a',
  chatkitAccentLevel: 1,

  useCustomIconColor: false,
  customIconColor: '#64748b',
  useCustomUserMessageColors: false,
  customUserMessageTextColor: '#ffffff',
  customUserMessageBackgroundColor: '#0ea5e9',

  // Typography
  fontFamily: 'system-ui',
  fontSize: 16,
  useCustomFont: false,
  customFontName: '',
  customFontCss: '',
  customCss: '',

  // Style
  radius: 'medium',
  density: 'normal',

  // Start Screen
  greeting: 'How can I help you today?',
  starterPrompts: [],

  // Composer
  placeholder: 'Type a message...',
  disclaimer: '',
  enableAttachments: false,
  enableModelPicker: false,
  enablePdfLightbox: false,

  // Inline embed dimensions
  inlineWidth: 400,
  inlineHeight: 600,
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
  currentLicense: null,
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
        currentConfig: JSON.parse(JSON.stringify(widget.config)),
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
   * Schema v2.0: Widgets belong directly to users, no license fetch needed
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
        currentLicense: null, // Schema v2.0: No longer using licenses
        currentConfig: JSON.parse(JSON.stringify(widget.config)),
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
        method: 'PATCH',
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
        currentConfig: JSON.parse(JSON.stringify(widget.config)),
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
   * Deep-clone config so resetConfig can revert to the saved snapshot
   */
  setCurrentWidget: (widget: Widget | null) => {
    const config = widget?.config
      ? JSON.parse(JSON.stringify(widget.config))
      : defaultConfig;
    set({
      currentWidget: widget,
      currentLicense: null, // Clear license when setting widget manually
      currentConfig: config,
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
   * Deep-clone to avoid shared references with currentWidget.config
   */
  resetConfig: () => {
    const { currentWidget } = get();
    if (currentWidget) {
      set({
        currentConfig: JSON.parse(JSON.stringify(currentWidget.config)),
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

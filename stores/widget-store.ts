/**
 * Widget Store
 *
 * Zustand store for managing widget configuration state.
 * Handles creating, updating, and saving widget configurations.
 *
 * The config shape is the CANONICAL ChatWidgetConfig from
 * lib/widget-config/schema.ts — this store defines no config shape of its
 * own. Server payloads are normalized through migrateConfig on hydration,
 * and every update is validated against chatWidgetConfigSchema before it
 * lands in state.
 *
 * Kind note: this store only ever holds chat-kind configs. The n8n and
 * chatkit configurator pages are both chat-kind (provider is a field inside
 * connection, not a different config kind); display-kind configs never flow
 * through this store, so no kind gating is needed here.
 */

import { create } from 'zustand';
import {
  type ChatWidgetConfig,
  chatWidgetConfigSchema,
} from '@/lib/widget-config/schema';
import { createDefaultConfig } from '@/lib/widget-config/defaults';
import { migrateConfig } from '@/lib/widget-config/migrate';
import { deepMerge } from '@/lib/utils/deep-merge';

/**
 * Canonical widget configuration. Re-exported so existing
 * `import { WidgetConfig } from '@/stores/widget-store'` consumers keep
 * compiling; new code should import ChatWidgetConfig from
 * '@/lib/widget-config/schema' directly.
 */
export type WidgetConfig = ChatWidgetConfig;

/** Starter prompt for conversation starters (canonical startScreen element). */
export type StarterPrompt = WidgetConfig['startScreen']['starterPrompts'][number];

type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

/** Deep partial for config updates: arrays are replaced whole, objects merge. */
export type WidgetConfigUpdate = {
  [K in keyof WidgetConfig]?: DeepPartial<WidgetConfig[K]>;
};

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
  updateConfig: (config: WidgetConfigUpdate) => void;
  saveConfig: () => Promise<void>;
  resetConfig: () => void;
  markSaved: () => void;
  clearError: () => void;
}

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
  currentConfig: createDefaultConfig('basic', 'chat'),
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
        currentConfig: migrateConfig(widget.config),
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
        currentConfig: migrateConfig(widget.config),
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
        currentConfig: migrateConfig(widget.config),
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
   * Set current widget for editing.
   * Server hydration point: the raw stored config (any historical shape) is
   * normalized to the canonical schema via migrateConfig, which also returns
   * a fresh deep object so resetConfig can revert to the saved snapshot.
   */
  setCurrentWidget: (widget: Widget | null) => {
    const config = widget?.config
      ? migrateConfig(widget.config)
      : createDefaultConfig('basic', 'chat');
    set({
      currentWidget: widget,
      currentLicense: null, // Clear license when setting widget manually
      currentConfig: config,
      hasUnsavedChanges: false,
    });
  },

  /**
   * Update current configuration: deep-merge the partial over current state,
   * then validate the result against the canonical schema. Invalid updates
   * are rejected wholesale (state unchanged) with a console warning.
   */
  updateConfig: (configUpdate: WidgetConfigUpdate) => {
    set((state) => {
      const merged = deepMerge(state.currentConfig, configUpdate);
      const result = chatWidgetConfigSchema.safeParse(merged);
      if (!result.success) {
        console.warn('[widget-store] rejected invalid config update', result.error.flatten());
        return state;
      }
      return {
        ...state,
        currentConfig: result.data,
        hasUnsavedChanges: true,
      };
    });
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
   * Reset configuration to last saved state.
   * migrateConfig returns a fresh deep object, so no shared references with
   * currentWidget.config.
   */
  resetConfig: () => {
    const { currentWidget } = get();
    if (currentWidget) {
      set({
        currentConfig: migrateConfig(currentWidget.config),
        hasUnsavedChanges: false,
      });
    }
  },

  /**
   * Mark the current configuration as saved (e.g. after an external save).
   */
  markSaved: () => {
    set({ hasUnsavedChanges: false });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },
}));

'use client';

/**
 * Shared configurator orchestration hook (chat-kind only).
 *
 * Owns the orchestration that used to be duplicated across the n8n and chatkit
 * configurator pages:
 *   - widget load by ?widgetId= (GET /api/widgets/[id] via store.getWidget),
 *     or reset-to-new when no id is present
 *   - auth restore (checkAuth) + redirect to /auth/login when unauthenticated
 *   - create-on-first-save (POST /api/widgets via store.createWidget) with the
 *     correct provider seeded for the variant
 *   - save (PATCH /api/widgets/[id] via store.updateWidget / store.saveConfig)
 *   - deploy (await save then POST /api/widgets/[id]/deploy via store.deployWidget)
 *   - unsaved-changes beforeunload warning
 *
 * Display-kind does NOT use this hook — display configs never flow through the
 * widget store (see stores/widget-store.ts). The display variant keeps its own
 * dedicated page client.
 *
 * Store API matched (no invented actions): currentWidget, currentConfig,
 * isLoading, isSaving, hasUnsavedChanges, getWidget, createWidget,
 * updateWidget, saveConfig, deployWidget, resetConfig, setCurrentWidget.
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useWidgetStore, WidgetConfig, EmbedType } from '@/stores/widget-store';
import { toast } from 'sonner';

export type ConfiguratorVariant = 'n8n' | 'chatkit';

interface UseConfiguratorPageOptions {
  /** Provider variant within chat-kind. Drives provider seeding + locked provider. */
  variant: ConfiguratorVariant;
}

export interface UseConfiguratorPageResult {
  // Auth/ready
  ready: boolean;
  // Widget state
  widget: ReturnType<typeof useWidgetStore.getState>['currentWidget'];
  config: WidgetConfig;
  loading: boolean;
  saving: boolean;
  isDirty: boolean;
  // Local editable fields
  widgetName: string;
  setWidgetName: (name: string) => void;
  selectedEmbedType: EmbedType;
  setSelectedEmbedType: (embedType: EmbedType) => void;
  // Actions
  updateConfig: (config: WidgetConfig) => void;
  resetConfig: () => void;
  save: () => Promise<void>;
  deploy: () => Promise<void>;
  goToDashboard: () => void;
  // Variant metadata
  kind: 'chat';
  variant: ConfiguratorVariant;
}

/** Per-variant defaults that the unified client otherwise hard-codes. */
const VARIANT_DEFAULT_NAME: Record<ConfiguratorVariant, string> = {
  n8n: 'Untitled Widget',
  chatkit: 'Untitled Agent',
};

export function useConfiguratorPage({
  variant,
}: UseConfiguratorPageOptions): UseConfiguratorPageResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const widgetId = searchParams?.get('widgetId');

  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const {
    currentWidget,
    currentConfig,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    getWidget,
    createWidget,
    updateWidget,
    saveConfig,
    deployWidget,
    updateConfig,
    resetConfig,
  } = useWidgetStore();

  const defaultName = VARIANT_DEFAULT_NAME[variant];
  const [widgetName, setWidgetName] = useState(defaultName);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const urlEmbedType = (searchParams?.get('embedType') as EmbedType) || 'popup';
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedType>(urlEmbedType);

  // Load widget by ?widgetId=, otherwise reset for a new widget.
  useEffect(() => {
    if (widgetId) {
      if (!currentWidget || currentWidget.id !== widgetId) {
        getWidget(widgetId).catch(console.error);
      }
    } else {
      useWidgetStore.getState().setCurrentWidget(null);
      setWidgetName(searchParams?.get('name') || defaultName);
    }
  }, [widgetId, currentWidget, getWidget, searchParams, defaultName]);

  // Sync local name when a widget loads.
  useEffect(() => {
    if (currentWidget) {
      setWidgetName(currentWidget.name);
    }
  }, [currentWidget]);

  // Keep embed type in sync with loaded widget, else URL.
  useEffect(() => {
    if (currentWidget?.embedType) {
      setSelectedEmbedType(currentWidget.embedType as EmbedType);
      return;
    }
    setSelectedEmbedType(urlEmbedType);
  }, [currentWidget?.id, currentWidget?.embedType, urlEmbedType]);

  // Warn before navigating away with unsaved changes.
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Restore cookie session before redirect checks.
  useEffect(() => {
    if (isAuthenticated || hasCheckedAuth) {
      return;
    }

    let cancelled = false;
    checkAuth()
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setHasCheckedAuth(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasCheckedAuth, checkAuth]);

  useEffect(() => {
    if (isAuthenticated && !hasCheckedAuth) {
      setHasCheckedAuth(true);
    }
  }, [isAuthenticated, hasCheckedAuth]);

  // Redirect to login if unauthenticated after the auth check settles.
  useEffect(() => {
    if (hasCheckedAuth && !authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [hasCheckedAuth, authLoading, isAuthenticated, router]);

  // Create the widget on first save, seeding the provider for this variant.
  const createForVariant = async () => {
    if (!widgetName.trim()) {
      return;
    }

    const widget = await createWidget({
      name: widgetName,
      widgetType: variant,
      embedType: selectedEmbedType,
      config:
        variant === 'chatkit'
          ? {
              ...currentConfig,
              connection: { ...currentConfig.connection, provider: 'chatkit' },
            }
          : currentConfig,
    });

    toast.success(variant === 'chatkit' ? 'Agent created successfully' : 'Widget created successfully');
    router.push(`/configurator/${variant}?widgetId=${widget.id}&embedType=${selectedEmbedType}`);
    return widget;
  };

  const save = async () => {
    try {
      if (!currentWidget) {
        await createForVariant();
        return;
      }

      const widgetUpdates: Record<string, unknown> = {};
      if (currentWidget.name !== widgetName) {
        widgetUpdates.name = widgetName;
      }
      if ((currentWidget.embedType || 'popup') !== selectedEmbedType) {
        widgetUpdates.embedType = selectedEmbedType;
      }
      if (Object.keys(widgetUpdates).length > 0) {
        await updateWidget(currentWidget.id, widgetUpdates);
      }
      if (hasUnsavedChanges) {
        await saveConfig();
      }
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const deploy = async () => {
    try {
      await save();
      const target = useWidgetStore.getState().currentWidget;
      if (!target) return;
      await deployWidget(target.id);
      toast.success('Widget deployed successfully');
    } catch (error) {
      console.error('Failed to deploy widget:', error);
      toast.error('Failed to deploy widget');
    }
  };

  const ready = hasCheckedAuth && !authLoading && !isLoading && isAuthenticated && !!user;

  return {
    ready,
    widget: currentWidget,
    config: currentConfig,
    loading: authLoading || isLoading || !hasCheckedAuth,
    saving: isSaving,
    isDirty: hasUnsavedChanges,
    widgetName,
    setWidgetName,
    selectedEmbedType,
    setSelectedEmbedType,
    updateConfig: (next: WidgetConfig) => updateConfig(next),
    resetConfig,
    save,
    deploy,
    goToDashboard: () => router.push('/dashboard'),
    kind: 'chat',
    variant,
  };
}

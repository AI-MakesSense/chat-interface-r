'use client';

/**
 * Widget Configurator Page
 *
 * Modern playground-style visual configuration interface for customizing chat widgets.
 * Migrated from the chat-widget-playground design for enhanced UX.
 *
 * Features:
 * - Split-pane layout with sidebar config and resizable preview
 * - 30+ customization options across theming, typography, style
 * - Starter prompts with icon selection
 * - Three embed modes: Inline, Full Page, Website Chat (popup)
 * - Real-time preview with simulated chat
 * - Code export modal
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLicenseStore } from '@/stores/license-store';
import { useWidgetStore, WidgetConfig } from '@/stores/widget-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfigSidebar } from '@/components/configurator/config-sidebar';
import { PreviewCanvas } from '@/components/configurator/preview-canvas';
import { CodeModal } from '@/components/configurator/code-modal';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Suspense wrapper for the configurator page
 * Handles the useSearchParams() requirement for Next.js 16
 */
function ConfiguratorPageWrapper() {
  return (
    <Suspense fallback={<ConfiguratorLoading />}>
      <ConfiguratorPage />
    </Suspense>
  );
}

/**
 * Loading component
 */
function ConfiguratorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading configurator...</span>
      </div>
    </div>
  );
}

/**
 * Configurator page component
 */
function ConfiguratorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const widgetId = searchParams?.get('widgetId');

  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { licenses } = useLicenseStore();
  const {
    currentWidget,
    currentConfig,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    getWidget,
    createWidget,
    updateConfig,
    saveConfig,
    resetConfig
  } = useWidgetStore();

  const [widgetName, setWidgetName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // Load widget if widgetId is provided
  useEffect(() => {
    if (widgetId && !currentWidget) {
      getWidget(widgetId).catch(console.error);
    }
  }, [widgetId, currentWidget, getWidget]);

  // Handle creating a new widget
  const handleCreateWidget = async () => {
    if (!widgetName.trim()) {
      return;
    }

    if (!licenses || licenses.length === 0) {
      alert('You need a license to create a widget');
      router.push('/dashboard');
      return;
    }
    const firstLicense = licenses[0];

    try {
      const widget = await createWidget({
        licenseId: firstLicense.id,
        name: widgetName,
        config: currentConfig
      });

      setShowCreateForm(false);
      setWidgetName('');
      router.push(`/configurator/n8n?widgetId=${widget.id}`);
    } catch (error) {
      console.error('Failed to create widget:', error);
      toast.error('Failed to create widget. Please try again.');
    }
  };

  // Handle saving configuration
  const handleSave = async () => {
    try {
      await saveConfig();
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  // Handle config changes from sidebar
  const handleConfigChange = (newConfig: WidgetConfig) => {
    // Deep merge with current config to preserve nested objects
    updateConfig({
      ...currentConfig,
      ...newConfig,
      branding: {
        ...currentConfig.branding,
        ...newConfig.branding
      },
      style: {
        ...currentConfig.style,
        ...newConfig.style
      },
      connection: {
        ...currentConfig.connection,
        ...newConfig.connection
      }
    });
  };

  // Loading state
  if (authLoading || isLoading) {
    return <ConfiguratorLoading />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return null;
  }

  // No widget selected - show create form
  if (!currentWidget && !showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Create New Widget</CardTitle>
            <CardDescription>Configure your chat widget</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              Create Widget
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full mt-2">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create widget form
  if (showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Create New Widget</CardTitle>
            <CardDescription>Enter a name for your widget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="widget-name">Widget Name</Label>
              <Input
                id="widget-name"
                placeholder="My Chat Widget"
                value={widgetName}
                onChange={(e) => setWidgetName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateWidget();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateWidget} disabled={!widgetName.trim() || isSaving}>
                {isSaving ? 'Creating...' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main configurator interface
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="font-semibold text-sm">{currentWidget?.name || 'Widget'}</h1>
            {hasUnsavedChanges && (
              <p className="text-xs text-muted-foreground">Unsaved changes</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content - Split Pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ConfigSidebar
          config={currentConfig}
          onChange={handleConfigChange}
          onOpenCode={() => setIsCodeModalOpen(true)}
          onReset={resetConfig}
          widgetName={currentWidget?.name}
        />

        {/* Preview Canvas */}
        <PreviewCanvas config={currentConfig} />
      </div>

      {/* Code Modal */}
      <CodeModal
        config={currentConfig}
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        licenseKey={currentWidget?.licenseKey}
      />
    </div>
  );
}

export default ConfiguratorPageWrapper;

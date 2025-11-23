'use client';

/**
 * Widget Configurator Page
 *
 * Visual configuration interface for customizing chat widgets.
 * Module 3: Visual Configurator Core - MVP Implementation
 *
 * Features:
 * - Branding configuration (company name, welcome text, first message)
 * - Theme & color customization
 * - Position and corner radius
 * - Connection settings (webhook URL)
 * - Real-time preview (placeholder for Module 4)
 * - Auto-save with unsaved changes indicator
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useLicenseStore } from '@/stores/license-store';
import { useWidgetStore } from '@/stores/widget-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PreviewFrame } from '@/components/configurator/preview-frame';
import { DeviceSwitcher } from '@/components/configurator/device-switcher';
import { WidgetDownloadButtons } from '@/components/dashboard/widget-download-buttons';

/**
 * Suspense wrapper for the configurator page
 * Handles the useSearchParams() requirement for Next.js 16
 */
function ConfiguratorPageWrapper() {
  return (
    <Suspense fallback={<div>Loading configurator...</div>}>
      <ConfiguratorPage />
    </Suspense>
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
    error,
    hasUnsavedChanges,
    getWidget,
    createWidget,
    updateConfig,
    saveConfig,
    clearError,
  } = useWidgetStore();

  const [widgetName, setWidgetName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

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

    const firstLicense = licenses[0];
    if (!firstLicense) {
      alert('You need a license to create a widget');
      router.push('/dashboard');
      return;
    }

    try {
      const widget = await createWidget({
        licenseId: firstLicense.id,
        name: widgetName,
        config: currentConfig,
      });

      setShowCreateForm(false);
      setWidgetName('');
      router.push(`/configurator?widgetId=${widget.id}`);
    } catch (error) {
      console.error('Failed to create widget:', error);
    }
  };

  // Handle saving configuration
  const handleSave = async () => {
    try {
      await saveConfig();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    router.push('/auth/login');
    return null;
  }

  // No widget selected - show create form
  if (!currentWidget && !showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create New Widget</CardTitle>
              <CardDescription>
                Configure your chat widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                Create Widget
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="w-full mt-2"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create widget form
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create New Widget</CardTitle>
              <CardDescription>
                Enter a name for your widget
              </CardDescription>
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
      </div>
    );
  }

  // Configurator interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Widget Configurator</h1>
            <p className="text-sm text-muted-foreground">
              {currentWidget?.name || 'Untitled Widget'}
              {hasUnsavedChanges && ' (Unsaved changes)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={clearError}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Branding Section */}
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize your widget's branding and messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={currentConfig.branding.companyName || ''}
                    onChange={(e) =>
                      updateConfig({
                        branding: { ...currentConfig.branding, companyName: e.target.value },
                      })
                    }
                    placeholder="My Company"
                  />
                </div>
                <div>
                  <Label htmlFor="welcomeText">Welcome Text</Label>
                  <Input
                    id="welcomeText"
                    value={currentConfig.branding.welcomeText || ''}
                    onChange={(e) =>
                      updateConfig({
                        branding: { ...currentConfig.branding, welcomeText: e.target.value },
                      })
                    }
                    placeholder="How can we help you today?"
                  />
                </div>
                <div>
                  <Label htmlFor="firstMessage">First Message</Label>
                  <Input
                    id="firstMessage"
                    value={currentConfig.branding.firstMessage || ''}
                    onChange={(e) =>
                      updateConfig({
                        branding: { ...currentConfig.branding, firstMessage: e.target.value },
                      })
                    }
                    placeholder="Hello! I'm your AI assistant."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme & Colors Section */}
            <Card>
              <CardHeader>
                <CardTitle>Theme & Colors</CardTitle>
                <CardDescription>
                  Customize the visual appearance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={currentConfig.style.theme}
                    onChange={(e) =>
                      updateConfig({
                        style: { ...currentConfig.style, theme: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={currentConfig.style.primaryColor}
                      onChange={(e) =>
                        updateConfig({
                          style: { ...currentConfig.style, primaryColor: e.target.value },
                        })
                      }
                      className="w-20"
                    />
                    <Input
                      value={currentConfig.style.primaryColor}
                      onChange={(e) =>
                        updateConfig({
                          style: { ...currentConfig.style, primaryColor: e.target.value },
                        })
                      }
                      placeholder="#00bfff"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <select
                    id="position"
                    value={currentConfig.style.position}
                    onChange={(e) =>
                      updateConfig({
                        style: { ...currentConfig.style, position: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="cornerRadius">Corner Radius: {currentConfig.style.cornerRadius}px</Label>
                  <input
                    id="cornerRadius"
                    type="range"
                    min="0"
                    max="24"
                    value={currentConfig.style.cornerRadius || 12}
                    onChange={(e) =>
                      updateConfig({
                        style: { ...currentConfig.style, cornerRadius: Number(e.target.value) },
                      })
                    }
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Connection Section */}
            <Card>
              <CardHeader>
                <CardTitle>Connection</CardTitle>
                <CardDescription>
                  Connect to your N8n workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhookUrl">N8n Webhook URL *</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="webhookUrl"
                      value={currentConfig.connection.webhookUrl}
                      onChange={(e) =>
                        updateConfig({
                          connection: { ...currentConfig.connection, webhookUrl: e.target.value },
                        })
                      }
                      placeholder="https://your-n8n.com/webhook/your-id"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || isSaving}
                      title="Save webhook URL"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.location.reload()}
                      title="Refresh connection"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be an HTTPS URL from your N8n instance
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Download Packages Section */}
            {currentWidget && (
              <WidgetDownloadButtons
                widgetId={currentWidget.id}
                widgetName={currentWidget.name}
              />
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      Preview your widget in real-time
                    </CardDescription>
                  </div>
                  <DeviceSwitcher />
                </div>
              </CardHeader>
              <CardContent>
                <PreviewFrame
                  config={{
                    ...currentConfig,
                    widgetId: currentWidget?.id,
                    license: {
                      key: currentWidget?.licenseKey,
                    },
                  }}
                  className="min-h-[700px] relative"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ConfiguratorPageWrapper;

'use client';

/**
 * ChatKit Configurator Page
 *
 * Modern playground-style visual configuration interface for customizing ChatKit widgets.
 * Uses the shared architecture (ConfigSidebar, PreviewCanvas) for feature parity.
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useWidgetStore, WidgetConfig, EmbedType } from '@/stores/widget-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfigSidebar } from '@/components/configurator/config-sidebar';
import { PreviewCanvas } from '@/components/configurator/preview-canvas';
import { CodeModal } from '@/components/configurator/code-modal';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';

/**
 * Suspense wrapper for the configurator page
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
    const queryString = searchParams?.toString() || '';

    const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
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

    const [widgetName, setWidgetName] = useState('Untitled Agent');
    const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    // Get embed type from URL params (set in create-widget-modal)
    const embedType = (searchParams?.get('embedType') as EmbedType) || 'popup';

    useEffect(() => {
        if (!CHATKIT_UI_ENABLED) {
            router.replace(`/configurator/n8n${queryString ? `?${queryString}` : ''}`);
        }
    }, [router, queryString]);

    // Load widget if widgetId is provided, otherwise reset for new widget
    useEffect(() => {
        if (widgetId) {
            if (!currentWidget || currentWidget.id !== widgetId) {
                getWidget(widgetId).catch(console.error);
            }
        } else {
            // Reset for new widget
            useWidgetStore.getState().setCurrentWidget(null);
            setWidgetName(searchParams?.get('name') || 'Untitled Agent');
        }
    }, [widgetId, currentWidget, getWidget, searchParams]);

    // Update local name when widget loads
    useEffect(() => {
        if (currentWidget) {
            setWidgetName(currentWidget.name);
        }
    }, [currentWidget]);

    // Ensure cookie-based session is restored before redirect checks.
    useEffect(() => {
        if (!CHATKIT_UI_ENABLED || isAuthenticated || hasCheckedAuth) {
            return;
        }

        let cancelled = false;

        checkAuth()
            .catch(console.error)
            .finally(() => {
                if (!cancelled) {
                    setHasCheckedAuth(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, hasCheckedAuth, checkAuth]);

    useEffect(() => {
        if ((isAuthenticated || !CHATKIT_UI_ENABLED) && !hasCheckedAuth) {
            setHasCheckedAuth(true);
        }
    }, [isAuthenticated, hasCheckedAuth]);

    // Handle creating a new widget (Schema v2.0 - no license required)
    const handleCreateWidget = async () => {
        if (!widgetName.trim()) {
            return;
        }

        try {
            const widget = await createWidget({
                name: widgetName,
                widgetType: 'chatkit',
                embedType, // Pass the embed type from URL params
                config: {
                    ...currentConfig,
                    connection: {
                        ...currentConfig.connection,
                        provider: 'chatkit'
                    }
                }
            });

            toast.success('Agent created successfully');
            router.push(`/configurator/chatkit?widgetId=${widget.id}&embedType=${embedType}`);
        } catch (error) {
            console.error('Failed to create widget:', error);
            toast.error('Failed to create widget. Please try again.');
        }
    };

    // Handle saving configuration
    const handleSave = async () => {
        try {
            if (!currentWidget) {
                await handleCreateWidget();
            } else {
                // Update name if changed
                if (currentWidget.name !== widgetName) {
                    await useWidgetStore.getState().updateWidget(currentWidget.id, { name: widgetName });
                }
                await saveConfig();
                toast.success('Configuration saved successfully');
            }
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

    // Redirect to login if not authenticated (must be in useEffect for client-side navigation)
    useEffect(() => {
        if (hasCheckedAuth && !authLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [hasCheckedAuth, authLoading, isAuthenticated, router]);

    // Loading state
    if (authLoading || isLoading || !hasCheckedAuth) {
        return <ConfiguratorLoading />;
    }

    if (!CHATKIT_UI_ENABLED) {
        return <ConfiguratorLoading />;
    }

    // Not authenticated - show loading while redirect happens
    if (!isAuthenticated || !user) {
        return <ConfiguratorLoading />;
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
                        <Input
                            value={widgetName}
                            onChange={(e) => setWidgetName(e.target.value)}
                            className="h-8 w-[200px] font-semibold text-sm border-transparent hover:border-border focus:border-primary transition-colors bg-transparent"
                            placeholder="Agent Name"
                        />
                        {hasUnsavedChanges && (
                            <p className="text-xs text-muted-foreground px-3">Unsaved changes</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
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
                    lockedProvider="chatkit"
                />

                {/* Preview Canvas */}
                <PreviewCanvas config={currentConfig} />
            </div>

            {/* Code Modal */}
            <CodeModal
                config={currentConfig}
                isOpen={isCodeModalOpen}
                onClose={() => setIsCodeModalOpen(false)}
                widgetKey={currentWidget?.widgetKey}
                embedType={embedType}
            />
        </div>
    );
}

export default ConfiguratorPageWrapper;

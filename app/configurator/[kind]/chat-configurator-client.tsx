'use client';

/**
 * Unified chat-kind configurator client.
 *
 * Replaces the near-identical app/configurator/n8n and app/configurator/chatkit
 * pages. All orchestration lives in useConfiguratorPage; this component is the
 * layout shell + sidebar + preview. The only variant-driven bits are:
 *   - the locked provider passed to ConfigSidebar
 *   - default names/placeholders (handled in the hook)
 *   - the chatkit feature-flag gate (redirect to n8n when disabled)
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfigSidebar } from '@/components/configurator/config-sidebar';
import { PreviewCanvas } from '@/components/configurator/preview-canvas';
import { CodeModal } from '@/components/configurator/code-modal';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';
import { useAuthStore } from '@/stores/auth-store';
import { useWidgetStore, EmbedType } from '@/stores/widget-store';
import {
  useConfiguratorPage,
  type ConfiguratorVariant,
} from '@/hooks/use-configurator-page';

const EMBED_TYPE_OPTIONS: Array<{ value: EmbedType; label: string }> = [
  { value: 'popup', label: 'Popup' },
  { value: 'inline', label: 'Inline' },
  { value: 'fullpage', label: 'Fullpage' },
  { value: 'portal', label: 'Portal' },
];

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

function ChatConfigurator({ variant }: { variant: ConfiguratorVariant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const {
    widget,
    config,
    loading,
    saving,
    isDirty,
    ready,
    widgetName,
    setWidgetName,
    selectedEmbedType,
    setSelectedEmbedType,
    updateConfig,
    resetConfig,
    save,
    goToDashboard,
  } = useConfiguratorPage({ variant });

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  // ChatKit is feature-flag gated: redirect to n8n when disabled.
  const chatkitDisabled = variant === 'chatkit' && !CHATKIT_UI_ENABLED;
  const queryString = searchParams?.toString() || '';
  useEffect(() => {
    if (chatkitDisabled) {
      router.replace(`/configurator/n8n${queryString ? `?${queryString}` : ''}`);
    }
  }, [chatkitDisabled, router, queryString]);

  if (chatkitDisabled || loading || !ready || !user) {
    return <ConfiguratorLoading />;
  }

  const isAgent = variant === 'chatkit';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={goToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <Input
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              className="h-8 w-[200px] font-semibold text-sm border-transparent hover:border-border focus:border-primary transition-colors bg-transparent"
              placeholder={isAgent ? 'Agent Name' : 'Widget Name'}
            />
            {isDirty && (
              <p className="text-xs text-muted-foreground px-3">Unsaved changes</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Label htmlFor="embed-type" className="text-xs text-muted-foreground">
              Embed
            </Label>
            <select
              id="embed-type"
              value={selectedEmbedType}
              onChange={(e) => setSelectedEmbedType(e.target.value as EmbedType)}
              className="h-8 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium appearance-none cursor-pointer hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
            >
              {EMBED_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? (
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
        <ConfigSidebar
          config={config}
          onChange={updateConfig}
          onOpenCode={() => setIsCodeModalOpen(true)}
          onReset={resetConfig}
          widgetName={widget?.name}
          lockedProvider={variant}
          tier={user?.tier}
        />

        <PreviewCanvas
          config={config}
          tier={widget?.license?.tier}
          onDimensionsChange={(width, height) =>
            useWidgetStore.getState().updateConfig({ theme: { size: { inlineWidth: width, inlineHeight: height } } })
          }
        />
      </div>

      <CodeModal
        config={config}
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        widgetKey={widget?.widgetKey}
        embedType={selectedEmbedType}
      />
    </div>
  );
}

export function ChatConfiguratorClient({ variant }: { variant: ConfiguratorVariant }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ConfiguratorLoading />}>
        <ChatConfigurator variant={variant} />
      </Suspense>
    </ErrorBoundary>
  );
}

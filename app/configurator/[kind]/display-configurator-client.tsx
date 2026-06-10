'use client';

/**
 * Display-kind configurator client.
 *
 * Lifted verbatim from the old app/configurator/n8n-display page. Display does
 * not use the widget store (display configs never flow through it), uses local
 * state, posts directly to /api/widgets with a display-kind config, and renders
 * the dedicated display sections + DisplayPreview. Kept separate from the chat
 * client because the two share almost no orchestration.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DisplaySection, type DisplaySectionValue } from '@/components/configurator/sections/display-section';
import { DisplayThemeSection, type DisplayThemeValue } from '@/components/configurator/sections/display-theme-section';
import { DisplayBrandingSection, type DisplayBrandingValue } from '@/components/configurator/sections/display-branding-section';
import { DisplayPreview } from '@/components/configurator/display-preview';

export function DisplayConfiguratorClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('Untitled display widget');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('List required documents.');
  const [captureContext, setCaptureContext] = useState(true);

  const [branding, setBranding] = useState<DisplayBrandingValue>({
    companyName: 'Acme',
    logoUrl: null,
    brandingEnabled: true,
  });
  const [theme, setTheme] = useState<DisplayThemeValue>({
    colorScheme: 'light',
    radius: 'medium',
    density: 'normal',
    color: {
      accent: '#6366F1',
      surface: '#FFFFFF',
      text: '#111827',
      subText: '#6B7280',
      border: '#E5E7EB',
    },
  });
  const [display, setDisplay] = useState<DisplaySectionValue>({
    position: 'right',
    defaultOpen: true,
    header: { title: 'Required documents', showCount: true },
    emptyMessage: 'No documents available for this page.',
  });

  async function handleSave() {
    if (!webhookUrl.trim()) {
      toast.error('Webhook URL is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          kind: 'display',
          widgetType: 'n8n',
          embedType: 'inline',
          config: {
            kind: 'display',
            branding,
            theme,
            display,
            connection: {
              provider: 'n8n',
              webhookUrl,
              triggerMessage,
              captureContext,
              customContext: {},
            },
          },
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed (${res.status})`);
      }
      const data = await res.json();
      toast.success('Widget saved');
      router.push(`/dashboard?widget=${data.widget?.id ?? ''}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 p-6 h-screen">
      <div className="space-y-6 overflow-y-auto pr-4">
        <h1 className="text-xl font-semibold">Document Display Widget</h1>

        <section className="space-y-3">
          <Label htmlFor="display-name">Widget name</Label>
          <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Connection</h3>
          <div className="space-y-2">
            <Label htmlFor="display-webhook">n8n webhook URL</Label>
            <Input
              id="display-webhook"
              type="url"
              placeholder="https://..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="display-trigger">Default trigger message</Label>
            <Input id="display-trigger" value={triggerMessage} onChange={(e) => setTriggerMessage(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="display-capture">Capture page context</Label>
            <Switch id="display-capture" checked={captureContext} onCheckedChange={setCaptureContext} />
          </div>
        </section>

        <DisplaySection value={display} onChange={setDisplay} />
        <DisplayThemeSection value={theme} onChange={setTheme} />
        <DisplayBrandingSection value={branding} onChange={setBranding} />

        <Button onClick={handleSave} className="w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save widget'}
        </Button>
      </div>

      <div>
        <DisplayPreview display={display} theme={theme} branding={branding} triggerMessage={triggerMessage} />
      </div>
    </div>
  );
}

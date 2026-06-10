'use client';

/**
 * Schema-driven configurator sidebar.
 *
 * Replaces the former 1550-line hand-written sidebar. The entire form is now
 * GENERATED from CHAT_FIELD_REGISTRY (lib/widget-config/field-registry.ts):
 * each declared SECTION becomes a collapsible card, and ConfigSection renders
 * that section's registry fields via the generic FieldControl. To add a config
 * option, add it to the schema + one registry line — no edits here.
 *
 * Public props are preserved so app/configurator/{n8n,chatkit}/page.tsx keep
 * working. `tier` is additive (optional) and drives pro-field locking.
 */
import React, { useState } from 'react';
import { ChevronDown, Code, RotateCcw } from 'lucide-react';
import { WidgetConfig } from '@/stores/widget-store';
import { setAtPath } from '@/lib/widget-config/path';
import { SECTIONS, type SectionId } from '@/lib/widget-config/field-registry';
import { CHATKIT_UI_ENABLED } from '@/lib/feature-flags';
import { ConfigSection, tierRank, type Tier } from './config-form/section';

interface ConfigSidebarProps {
  config: WidgetConfig;
  onChange: (config: WidgetConfig) => void;
  onOpenCode: () => void;
  onReset?: () => void;
  widgetName?: string;
  /** Lock provider selection - used when navigating from /configurator/chatkit or /configurator/n8n */
  lockedProvider?: 'chatkit' | 'n8n';
  /** License tier - gates pro-only fields. */
  tier?: Tier;
}

const TIER_PRO = 1;

/** Sections hidden by default; the common ones start open. */
const DEFAULT_OPEN: SectionId[] = ['branding', 'theme', 'connection'];

export const ConfigSidebar: React.FC<ConfigSidebarProps> = ({
  config,
  onChange,
  onOpenCode,
  onReset,
  widgetName = 'Widget',
  lockedProvider,
  tier,
}) => {
  const [open, setOpen] = useState<Set<string>>(new Set(DEFAULT_OPEN));

  const toggleSection = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build a minimal nested partial for the changed path and let the store
  // deep-merge + validate. setAtPath builds { a: { b: value } } from 'a.b'.
  const handleChange = (path: string, value: unknown) => {
    // When the provider is locked by the entry page, ignore attempts to change it.
    if (lockedProvider && path === 'connection.provider') return;
    const patch = setAtPath({} as WidgetConfig, path, value);
    onChange(patch);
  };

  const provider = lockedProvider || config.connection?.provider || 'n8n';

  // Decide which sections to render at all.
  const visibleSections = SECTIONS.filter((s) => {
    // ChatKit theming section only when ChatKit is enabled AND selected.
    if (s.id === 'chatkit') return CHATKIT_UI_ENABLED && provider === 'chatkit';
    return true;
  });

  return (
    <aside className="w-[380px] flex-shrink-0 flex flex-col h-full border-r border-border bg-background text-sm z-20 shadow-xl">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-border shrink-0">
        <span className="font-semibold text-base truncate max-w-[220px]">{widgetName}</span>
        <div className="flex items-center gap-1">
          {onReset && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all changes to last saved state?')) {
                  onReset();
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors"
              title="Reset to last saved"
            >
              <RotateCcw size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCode}
            disabled={widgetName === 'Widget'}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted hover:bg-muted/70 text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={widgetName === 'Widget' ? 'Save widget first to get embed code' : 'View code'}
          >
            <Code size={18} />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {visibleSections.map((section) => {
          const isOpen = open.has(section.id);
          const sectionLocked =
            section.tierGate === 'pro' && tierRank(tier) < TIER_PRO;
          return (
            <div key={section.id} className="border-b border-border">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-foreground hover:bg-muted/50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-2">
                  {section.title}
                  {sectionLocked && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Pro
                    </span>
                  )}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <ConfigSection
                    sectionId={section.id}
                    config={config}
                    tier={tier}
                    onChange={handleChange}
                    hidePaths={
                      lockedProvider || !CHATKIT_UI_ENABLED
                        ? ['connection.provider']
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

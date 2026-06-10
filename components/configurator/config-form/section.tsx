'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import {
  CHAT_FIELD_REGISTRY,
  type SectionId,
  type FieldDef,
} from '@/lib/widget-config/field-registry';
import type { WidgetConfig } from '@/stores/widget-store';
import { FieldControl } from './field-control';

export type Tier = 'free' | 'basic' | 'pro' | 'agency' | string | undefined;

interface ConfigSectionProps {
  sectionId: SectionId;
  config: WidgetConfig;
  tier?: Tier;
  onChange: (path: string, value: unknown) => void;
  /** Registry paths to suppress (e.g. provider select when locked). */
  hidePaths?: string[];
}

const TIER_RANK: Record<string, number> = {
  free: 0,
  basic: 0,
  pro: 1,
  agency: 2,
};

/** free/basic -> below pro (locked); pro/agency -> unlocked. */
export function tierRank(tier: Tier): number {
  if (!tier) return 0;
  return TIER_RANK[tier] ?? 0;
}

/**
 * Renders every registry field for a section: filters by section, applies
 * showIf (skips hidden fields), and locks pro-gated fields below the pro tier.
 */
export function ConfigSection({ sectionId, config, tier, onChange, hidePaths }: ConfigSectionProps) {
  const hidden = new Set(hidePaths ?? []);
  const fields = CHAT_FIELD_REGISTRY.filter(
    (f) => f.section === sectionId && !hidden.has(f.path),
  );

  const visible = fields.filter((f: FieldDef) => {
    if (f.showIf) {
      try {
        return f.showIf(config);
      } catch {
        return false;
      }
    }
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      {visible.map((field) => {
        const locked = field.tierGate === 'pro' && tierRank(tier) < TIER_RANK.pro;
        return (
          <div key={field.path} className={locked ? 'opacity-70' : undefined}>
            {locked && (
              <div className="mb-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Lock className="h-3 w-3" />
                Pro
              </div>
            )}
            <FieldControl
              field={field}
              config={config}
              disabled={locked}
              onChange={onChange}
            />
          </div>
        );
      })}
    </div>
  );
}

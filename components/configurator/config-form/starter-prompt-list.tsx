'use client';

import React, { useRef, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconPicker } from '@/components/configurator/icon-picker';
import type { StarterPrompt } from '@/stores/widget-store';

interface StarterPromptListProps {
  value: StarterPrompt[];
  onChange: (next: StarterPrompt[]) => void;
  disabled?: boolean;
  /** Active connection provider; ChatKit limits the available icon set. */
  provider?: 'chatkit' | 'n8n' | string;
}

// Schema (lib/widget-config/schema.ts) allows up to 6 starter prompts; the UI
// must not be more restrictive than the schema.
const MAX_PROMPTS = 6;

/**
 * Starter-prompt editor extracted from the legacy config-sidebar
 * (the inline prompt list at lines ~931-966 of the pre-Task-22 sidebar).
 *
 * Each prompt has an icon (via IconPicker) and a label. Add/remove buttons
 * replace the old count-slider but produce the same StarterPrompt[] shape the
 * store expects: { label, icon }.
 */
export function StarterPromptList({ value, onChange, disabled, provider }: StarterPromptListProps) {
  const prompts = value || [];

  // Keep parity with the legacy behaviour: a ref tracking the last count so
  // external loads (e.g. opening a saved widget) don't fight local edits.
  const lastCountRef = useRef(prompts.length);
  useEffect(() => {
    lastCountRef.current = prompts.length;
  }, [prompts.length]);

  const updatePrompt = (index: number, field: 'label' | 'icon', fieldValue: string) => {
    const next = [...prompts];
    next[index] = { ...next[index], [field]: fieldValue };
    onChange(next);
  };

  const addPrompt = () => {
    if (prompts.length >= MAX_PROMPTS) return;
    onChange([...prompts, { label: 'New prompt', icon: 'message' }]);
  };

  const removePrompt = (index: number) => {
    onChange(prompts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {prompts.length > 0 && (
        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <div key={index} className="flex items-center gap-2">
              <IconPicker
                value={prompt.icon}
                onChange={(val) => updatePrompt(index, 'icon', val)}
                provider={provider}
              />
              <Input
                type="text"
                value={prompt.label}
                onChange={(e) => updatePrompt(index, 'label', e.target.value)}
                className="flex-1"
                placeholder="Prompt text…"
                disabled={disabled}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removePrompt(index)}
                disabled={disabled}
                aria-label="Remove prompt"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addPrompt}
        disabled={disabled || prompts.length >= MAX_PROMPTS}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add prompt
      </Button>
    </div>
  );
}

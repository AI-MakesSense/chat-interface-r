'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/configurator/icon-picker';
import { isCommittableWebhookUrl } from '@/components/configurator/webhook-url-commit';
import { getAtPath } from '@/lib/widget-config/path';
import type { FieldDef } from '@/lib/widget-config/field-registry';
import type { WidgetConfig, StarterPrompt } from '@/stores/widget-store';
import { StarterPromptList } from './starter-prompt-list';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

interface FieldControlProps {
  field: FieldDef;
  config: WidgetConfig;
  disabled?: boolean;
  onChange: (path: string, value: unknown) => void;
}

/**
 * Draft-buffered color input. The store rejects invalid config updates
 * wholesale, so committing every keystroke ("#ff" mid-typing) would silently
 * drop the patch. The native color input always emits valid hex and commits
 * directly; the text input keeps a local draft and commits only on valid hex.
 * (Ported from the legacy config-sidebar Task-4 ColorPicker.)
 */
function ColorControl({
  value,
  disabled,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <div
          className="h-7 w-7 rounded-md border border-border shadow-sm"
          style={{ backgroundColor: HEX_COLOR_RE.test(value) ? value : '#ffffff' }}
        />
        <input
          type="color"
          value={HEX_COLOR_RE.test(value) ? value : '#ffffff'}
          disabled={disabled}
          onChange={(e) => onCommit(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Color picker"
        />
      </div>
      <Input
        type="text"
        value={draft}
        disabled={disabled}
        onChange={(e) => {
          setDraft(e.target.value);
          if (HEX_COLOR_RE.test(e.target.value)) {
            onCommit(e.target.value);
          }
        }}
        onBlur={() => {
          if (!HEX_COLOR_RE.test(draft)) setDraft(value);
        }}
        className="w-28 font-mono uppercase"
      />
    </div>
  );
}

/**
 * Draft-buffered webhook URL input. The canonical webhookUrl validator rejects
 * every partial URL and the store rejects invalid updates wholesale, so a
 * fully-controlled input would be paste-only. The draft commits only on '' or
 * a valid URL and is kept (not reverted) on blur. (Ported from legacy sidebar.)
 */
function WebhookUrlControl({
  value,
  disabled,
  placeholder,
  onCommit,
}: {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  return (
    <Input
      type="url"
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => {
        setDraft(e.target.value);
        if (isCommittableWebhookUrl(e.target.value)) {
          onCommit(e.target.value);
        }
      }}
    />
  );
}

/**
 * Renders ONE config field from its FieldDef. Reads the current value via
 * getAtPath(config, field.path); writes via onChange(path, value).
 */
export function FieldControl({ field, config, disabled, onChange }: FieldControlProps) {
  const raw = getAtPath(config, field.path);
  const isWebhook = field.path === 'connection.webhookUrl';

  // Nullable URL fields ('' -> null); webhook URL commits via its own gate.
  const commitUrl = (v: string) => onChange(field.path, v === '' ? null : v);

  const labelEl = (
    <Label className="text-sm font-medium text-foreground">{field.label}</Label>
  );
  const helpEl = field.help ? (
    <p className="text-xs text-muted-foreground">{field.help}</p>
  ) : null;

  let control: React.ReactNode = null;

  switch (field.control) {
    case 'text':
      control = (
        <Input
          type={field.masked ? 'password' : 'text'}
          value={(raw as string) ?? ''}
          disabled={disabled}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.path, e.target.value)}
        />
      );
      break;

    case 'url':
      control = isWebhook ? (
        <WebhookUrlControl
          value={(raw as string) ?? ''}
          disabled={disabled}
          placeholder={field.placeholder}
          onCommit={(v) => onChange(field.path, v)}
        />
      ) : (
        <Input
          type="url"
          value={(raw as string) ?? ''}
          disabled={disabled}
          placeholder={field.placeholder}
          onChange={(e) => commitUrl(e.target.value)}
        />
      );
      break;

    case 'textarea':
      control = (
        <Textarea
          value={(raw as string) ?? ''}
          disabled={disabled}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.path, e.target.value)}
        />
      );
      break;

    case 'toggle':
      return (
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="space-y-0.5">
            {labelEl}
            {helpEl}
          </div>
          <Switch
            checked={Boolean(raw)}
            disabled={disabled}
            onCheckedChange={(v) => onChange(field.path, v)}
            aria-label={field.label}
          />
        </div>
      );

    case 'slider': {
      const min = field.min ?? 0;
      const max = field.max ?? 100;
      const step = field.step ?? 1;
      const numeric = typeof raw === 'number' ? raw : min;
      return (
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between">
            {labelEl}
            <span className="text-sm tabular-nums text-muted-foreground">{numeric}</span>
          </div>
          <Slider
            value={[numeric]}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onValueChange={(vals) => onChange(field.path, vals[0])}
          />
          {helpEl}
        </div>
      );
    }

    case 'color':
      return (
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="space-y-0.5">
            {labelEl}
            {helpEl}
          </div>
          <ColorControl
            value={(raw as string) ?? '#000000'}
            disabled={disabled}
            onCommit={(v) => onChange(field.path, v)}
          />
        </div>
      );

    case 'select':
      control = (
        <Select
          value={(raw as string) ?? ''}
          disabled={disabled}
          options={field.options ?? []}
          onValueChange={(v) => onChange(field.path, v)}
        />
      );
      break;

    case 'icon-picker':
      control = (
        <IconPicker
          value={(raw as string) ?? 'message'}
          onChange={(v) => onChange(field.path, v)}
        />
      );
      break;

    case 'prompt-list':
      return (
        <div className="space-y-1.5 py-1">
          {labelEl}
          {helpEl}
          <StarterPromptList
            value={(raw as StarterPrompt[]) ?? []}
            disabled={disabled}
            onChange={(next) => onChange(field.path, next)}
          />
        </div>
      );

    default:
      control = null;
  }

  return (
    <div className="space-y-1.5 py-1">
      {labelEl}
      {control}
      {helpEl}
    </div>
  );
}

'use client';

/**
 * Embed Type Selector Component
 *
 * Allows users to select how their widget will be deployed.
 * Shows visual representations and descriptions for each embed type.
 *
 * Schema v2.0: embedType is stored on the widget and determines the embed code format.
 */

import { MessageCircle, Layout, Maximize, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EmbedType = 'popup' | 'inline' | 'fullpage' | 'portal';

interface EmbedTypeOption {
  value: EmbedType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const EMBED_OPTIONS: EmbedTypeOption[] = [
  {
    value: 'popup',
    label: 'Popup',
    description: 'Floating chat bubble on your website',
    icon: MessageCircle,
  },
  {
    value: 'inline',
    label: 'Inline',
    description: 'Embedded in a specific section',
    icon: Layout,
  },
  {
    value: 'fullpage',
    label: 'Fullpage',
    description: 'Standalone chat page',
    icon: Maximize,
  },
  {
    value: 'portal',
    label: 'Link Only',
    description: 'Shareable URL for email/QR',
    icon: Link,
  },
];

interface EmbedTypeSelectorProps {
  value: EmbedType;
  onChange: (type: EmbedType) => void;
  disabled?: boolean;
  className?: string;
}

export function EmbedTypeSelector({
  value,
  onChange,
  disabled = false,
  className,
}: EmbedTypeSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-sm font-medium text-foreground">
        Embed Type
      </label>
      <div className="grid grid-cols-2 gap-3">
        {EMBED_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all text-left',
                'hover:border-primary/50 hover:bg-muted/50',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className={cn(
                'p-2 rounded-md',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}>
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact version for inline use
 */
interface EmbedTypeBadgeProps {
  type: EmbedType;
  className?: string;
}

export function EmbedTypeBadge({ type, className }: EmbedTypeBadgeProps) {
  const option = EMBED_OPTIONS.find(o => o.value === type);
  if (!option) return null;

  const Icon = option.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-sm',
      className
    )}>
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{option.label}</span>
    </div>
  );
}

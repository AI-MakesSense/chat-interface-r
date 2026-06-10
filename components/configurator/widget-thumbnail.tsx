'use client';

import React from 'react';
import type { ChatWidgetConfig } from '@/lib/widget-config/schema';

/**
 * Lightweight STATIC preview thumbnail (Phase 5, Task 20).
 *
 * Used for DECORATIVE, high-count surfaces — primarily dashboard widget cards, where
 * rendering one live <iframe> per card (the real-bundle WidgetPreviewFrame) would be far
 * too heavy. This is a pure CSS mock: header bar with the company name, a couple of fake
 * message bubbles, and a composer line, tinted by the config's accent/surface colors. It
 * is intentionally NOT pixel-accurate — its job is to give each card a recognizable,
 * branded silhouette, not to be the source of truth (the configurator's live preview is).
 *
 * Reads only canonical config paths so it stays in lockstep with the schema.
 */

interface WidgetThumbnailProps {
  config: ChatWidgetConfig;
}

export const WidgetThumbnail: React.FC<WidgetThumbnailProps> = ({ config }) => {
  const isDark = config.theme.mode === 'dark';
  const cs = config.colorSystem;

  const accent = cs.useAccent ? cs.accentColor : isDark ? '#ffffff' : '#111827';
  const surfaceBg = cs.useCustomSurfaceColors
    ? cs.surfaceBackgroundColor
    : isDark
      ? '#1a1a1a'
      : '#ffffff';
  const surfaceFg = cs.useCustomSurfaceColors
    ? cs.surfaceForegroundColor
    : isDark
      ? '#e5e5e5'
      : '#111827';
  const subtle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ background: surfaceBg, color: surfaceFg }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: `1px solid ${subtle}` }}
      >
        <div
          className="h-5 w-5 shrink-0 rounded-full"
          style={{ background: accent }}
        />
        <span className="truncate text-xs font-semibold">
          {config.branding.companyName || 'Chat'}
        </span>
      </div>

      {/* Message area */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Bot bubble */}
        <div
          className="max-w-[80%] self-start rounded-lg px-3 py-2 text-[10px] leading-snug"
          style={{ background: subtle }}
        >
          <span className="line-clamp-2 opacity-80">
            {config.branding.firstMessage || 'Hello! How can I help?'}
          </span>
        </div>
        {/* User bubble */}
        <div
          className="max-w-[70%] self-end rounded-lg px-3 py-2 text-[10px] leading-snug text-white"
          style={{ background: accent }}
        >
          <span className="opacity-90">Sure, let me check…</span>
        </div>
      </div>

      {/* Composer */}
      <div className="px-3 pb-3">
        <div
          className="flex items-center rounded-full px-3 py-2 text-[10px] opacity-60"
          style={{ border: `1px solid ${subtle}` }}
        >
          {config.composer.placeholder || 'Type your message…'}
        </div>
      </div>
    </div>
  );
};

---
title: "Chat Widget Links Invisible on Theme/Color Combinations"
date: 2026-05-06
category: ui-bugs
module: widget
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "Links rendered in same color as surrounding text, indistinguishable from plain content"
  - "No underline or visual distinction on anchor elements in message bubbles"
  - "Raw URLs (https://, http://, www.) not converted to clickable links"
  - "Link visibility varied unpredictably across light/dark themes and custom accent colors"
root_cause: config_error
resolution_type: code_fix
severity: high
tags:
  - css
  - accessibility
  - wcag
  - contrast
  - markdown
  - links
  - chat-widget
  - theming
---

# Chat Widget Links Invisible on Theme/Color Combinations

## Problem

Links in chat widget bot messages were invisible on many theme/color combinations. The markdown parser produced `<a>` tags but no CSS rule existed to style them — links inherited the bubble text color and were indistinguishable from surrounding text. Additionally, raw URLs pasted without markdown syntax were never converted to clickable links.

## Symptoms

- Links appeared as unstyled text inheriting the bubble's foreground color
- On dark themes or with custom accent colors, links could be black-on-black or white-on-white
- Raw URLs (e.g., `https://example.com`) rendered as literal text with no anchor tag
- Only PDF links had any styling (hardcoded `cursor: pointer; text-decoration: underline` in `message-list.ts`)

## What Didn't Work

- **Archived commits from `main-archived`**: Earlier work (commits `47f31b3` through `11d536d`) contained a link-color fix with `resolveLinkColor()`, but it was bundled with unrelated breaking changes — dropping the markdown cache, removing PDF lightbox imports, changing the `createChatWidget` return type. These commits could not be cleanly cherry-picked, so the solution had to be rebuilt from scratch in isolation.

## Solution

### 1. WCAG AA contrast-aware link color resolver (`widget/src/link-color.ts`)

New self-contained utility with no project dependencies:

```typescript
export function resolveLinkColor(accent: string, bg: string): string {
  const accentRgb = parseColorToRgb(accent);
  const bgRgb = parseColorToRgb(bg);
  if (!accentRgb || !bgRgb) return accent;
  if (contrastRatio(accentRgb, bgRgb) >= 4.5) return accent;

  // Progressive fallbacks keyed to background luminance
  const lum = relativeLuminance(bgRgb);
  const candidates = lum > 0.5
    ? ['#1d4ed8', '#1e3a8a', '#172554']  // dark blues for light bgs
    : ['#93c5fd', '#bfdbfe', '#dbeafe']; // light blues for dark bgs

  for (const c of candidates) {
    const rgb = parseColorToRgb(c)!;
    if (contrastRatio(rgb, bgRgb) >= 4.5) return c;
  }
  return lum > 0.5 ? '#000000' : '#ffffff';
}
```

### 2. Raw URL auto-linking (`widget/src/markdown.ts`)

Added after code block/inline code extraction to protect URLs inside backticks:

```typescript
// 3b. Auto-link raw URLs (https://, http://, www.)
html = html.replace(
  /(?<!\]\()(?<!=["'])(https?:\/\/[^\s<>)\]]+|www\.[^\s<>)\]]+)/g,
  (url: string) => {
    const cleaned = url.replace(/[.,;!?:]+$/, '');
    const trailing = url.slice(cleaned.length);
    const href = cleaned.startsWith('www.') ? `https://${cleaned}` : cleaned;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${cleaned}</a>${trailing}`;
  }
);
```

### 3. CSS injection in widget (`widget/src/widget.ts`)

```css
.n8n-message-content a {
  color: ${linkColor};
  text-decoration: underline;
  background-color: ${linkBgTint};    /* 12% opacity tint */
  padding: 0 2px;
  border-radius: 2px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.n8n-message-content a:hover {
  background-color: ${linkBgTintHover}; /* 22% opacity tint */
}
```

### 4. Configurator preview parity (`components/configurator/chat-preview.tsx`)

Replaced hardcoded `isDark ? '#60a5fa' : '#2563eb'` with the same `resolveLinkColor()` logic so the configurator preview matches the production widget exactly.

## Why This Works

The root cause was twofold: (1) the scoped CSS never targeted `<a>` elements, so browser defaults applied (invisible inside colored bubbles); (2) the markdown parser only handled explicit `[text](url)` syntax and never generated `<a>` tags for bare URLs. The fix addresses both independently — CSS is always injected with a contrast-checked color, and the regex auto-linker runs before other inline transforms but after code extraction.

## Prevention

- Scoped stylesheets for components that render arbitrary HTML should explicitly style all interactive elements (`a`, `button`, `input`) rather than relying on browser defaults.
- Contrast checking should be done programmatically at render time rather than relying on a designer's color choice being accessible.
- When adding new markdown features, protect code spans first by extracting them to placeholders — the parser already uses this pattern for code blocks.
- Tests added: `tests/unit/link-color.test.ts` (17 tests) and `tests/unit/markdown-links.test.ts` (12 tests).

## Related Issues

- Design spec: `docs/superpowers/specs/2026-05-05-link-visibility-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-05-link-visibility.md`
- Note: `docs/modules/PHASE_3_MODULE_1_DESIGN.md` defines `linkColor`/`linkHoverColor` schema fields that are now superseded by the runtime `resolveLinkColor()` approach
- Note: `widget/src/utils/markdown-renderer.ts` (class-based, uses markdown-it with `linkify: true`) is a separate code path from `widget/src/markdown.ts` (function-based) — two auto-linking implementations exist

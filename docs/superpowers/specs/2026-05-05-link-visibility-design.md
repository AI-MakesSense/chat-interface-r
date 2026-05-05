# Link Visibility Fix

**Date:** 2026-05-05
**Status:** Approved
**Scope:** Widget bundle + configurator preview

---

## Problem

Links in chat messages are invisible on many theme/color combinations. The markdown parser produces `<a>` tags but no dedicated CSS exists for them — links inherit the bubble text color and are indistinguishable from surrounding text. The only link styling in the codebase is a `cursor: pointer; text-decoration: underline` applied exclusively to PDF links in `message-list.ts:251`.

Additionally, raw URLs pasted without markdown syntax (`https://example.com`) are not converted to clickable links at all.

## Solution

A contrast-aware link styling system that guarantees links are always visually distinct, regardless of the user's theme configuration.

---

## Components

### 1. Contrast-Aware Link Color Resolution

A function that determines the best link color for the current theme:

- **Input:** widget accent color + message bubble background color
- **Logic:** compute WCAG contrast ratio between the two
- **If ratio >= 4.5:1 (WCAG AA):** use the accent color as the link color
- **If ratio < 4.5:1:** fall back to a luminance-appropriate safe blue
  - Light backgrounds: `#1d4ed8` (dark blue)
  - Dark backgrounds: `#93c5fd` (light blue)

Helper functions needed:
- `parseColorToRgb(color: string)` — parse hex, rgb/rgba, hsl/hsla to `[r, g, b]`
- `relativeLuminance(rgb)` — WCAG relative luminance formula
- `contrastRatio(a, b)` — WCAG contrast ratio from two RGB tuples
- `resolveLinkColor(accent, bg)` — orchestrates the above, returns a CSS color string

### 2. Link CSS Styling

Injected as part of the widget's scoped styles. Applied to all `<a>` tags within message content:

```css
a {
  color: var(--cw-link-color);
  text-decoration: underline;
  background-color: var(--cw-link-bg-tint);     /* 12% opacity of link color */
  padding: 0 2px;
  border-radius: 2px;
  cursor: pointer;
}

a:hover {
  background-color: var(--cw-link-bg-tint-hover); /* 22% opacity of link color */
}
```

CSS variables `--cw-link-color`, `--cw-link-bg-tint`, and `--cw-link-bg-tint-hover` are computed at widget initialization using `resolveLinkColor()` and injected alongside existing CSS variables.

### 3. Raw URL Auto-Linking

A pre-processing step in the markdown parser that converts bare URLs into markdown link syntax before the rest of the parser runs:

- **Pattern:** URLs starting with `https://`, `http://`, or `www.`
- **Guard:** skip URLs already inside markdown link syntax `[...](url)` or inside code blocks
- **Output:** `https://example.com` becomes `[https://example.com](https://example.com)`

This runs early in `renderMarkdown()`, after code block extraction but before any other transforms.

### 4. Configurator Preview Parity

The configurator preview (`components/configurator/chat-preview.tsx`) must mirror the same link styling so users see accurate link appearance while designing their widget. This means:

- Apply the same contrast-aware color logic using the preview's current theme settings
- Add matching CSS for `<a>` tags in the preview's scoped styles

---

## Files to Change

| File | Change |
|------|--------|
| `widget/src/widget.ts` | Add color utility functions, compute link CSS variables at init, inject link styles |
| `widget/src/markdown.ts` | Add raw URL auto-linking step in `renderMarkdown()` |
| `components/configurator/chat-preview.tsx` | Add link CSS styles using the same contrast logic |
| `public/widget/chat-widget.iife.js` | Rebuild after widget source changes |

## Files NOT Changed

- No changes to embed logic, iframe handling, or deployment
- No changes to `link-detector.ts` or `pdf-lightbox.ts`
- No changes to `message-list.ts` link behavior
- No imports or code from `main-archived`

---

## Testing

- Verify links are visible on light theme with light accent color
- Verify links are visible on dark theme with dark accent color
- Verify links are visible when accent color matches bubble background
- Verify raw URLs become clickable links
- Verify markdown `[text](url)` links render correctly
- Verify links inside code blocks are NOT auto-linked
- Verify configurator preview matches widget appearance
- Verify no regressions in existing markdown rendering (tables, lists, code blocks, etc.)

---

## Out of Scope

- Link `target` behavior (new tab vs same tab)
- Embed/iframe functionality
- PDF lightbox behavior
- Any other archived commit functionality

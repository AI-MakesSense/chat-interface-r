# Link Visibility Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all links (markdown and raw URLs) visually distinct and clickable across every widget theme combination.

**Architecture:** Add a contrast-aware color resolver that picks a link color guaranteed to be visible against the message bubble background. Add raw URL auto-linking in the markdown parser. Inject link CSS into the widget's scoped stylesheet. Mirror the same logic in the configurator preview.

**Tech Stack:** TypeScript, esbuild (widget bundle), Next.js/React (configurator preview), Jest (tests)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `widget/src/link-color.ts` | **NEW** — Color parsing, WCAG contrast math, `resolveLinkColor()` |
| `widget/src/markdown.ts` | **MODIFY** — Add raw URL auto-linking step |
| `widget/src/widget.ts` | **MODIFY** — Import link-color utils, compute CSS vars, inject link styles |
| `components/configurator/chat-preview.tsx` | **MODIFY** — Replace hardcoded link colors with contrast-aware logic |
| `tests/unit/link-color.test.ts` | **NEW** — Tests for color parsing and contrast resolution |
| `tests/unit/markdown-links.test.ts` | **NEW** — Tests for raw URL auto-linking |
| `public/widget/chat-widget.iife.js` | **REBUILD** — Rebuilt widget bundle |

---

### Task 1: Contrast-Aware Link Color Resolver

**Files:**
- Create: `widget/src/link-color.ts`
- Test: `tests/unit/link-color.test.ts`

- [ ] **Step 1: Write failing tests for color parsing and contrast resolution**

Create `tests/unit/link-color.test.ts`:

```typescript
import { parseColorToRgb, contrastRatio, resolveLinkColor } from '@/widget/src/link-color';

describe('parseColorToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(parseColorToRgb('#ff0000')).toEqual([255, 0, 0]);
  });

  it('parses 3-digit hex', () => {
    expect(parseColorToRgb('#f00')).toEqual([255, 0, 0]);
  });

  it('parses rgb()', () => {
    expect(parseColorToRgb('rgb(0, 128, 255)')).toEqual([0, 128, 255]);
  });

  it('parses rgba()', () => {
    expect(parseColorToRgb('rgba(0, 128, 255, 0.5)')).toEqual([0, 128, 255]);
  });

  it('parses hsl()', () => {
    const result = parseColorToRgb('hsl(0, 100%, 50%)');
    expect(result).toEqual([255, 0, 0]);
  });

  it('returns null for empty string', () => {
    expect(parseColorToRgb('')).toBeNull();
  });

  it('returns null for unsupported format', () => {
    expect(parseColorToRgb('rebeccapurple')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = contrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for same color', () => {
    const ratio = contrastRatio([128, 128, 128], [128, 128, 128]);
    expect(ratio).toBeCloseTo(1, 1);
  });
});

describe('resolveLinkColor', () => {
  it('returns accent when contrast is sufficient on white', () => {
    // Dark blue on white bg — high contrast
    expect(resolveLinkColor('#1d4ed8', '#ffffff')).toBe('#1d4ed8');
  });

  it('falls back to dark blue on light bg when accent has low contrast', () => {
    // Light yellow on white bg — poor contrast
    expect(resolveLinkColor('#fef08a', '#ffffff')).toBe('#1d4ed8');
  });

  it('falls back to light blue on dark bg when accent has low contrast', () => {
    // Dark gray on dark bg — poor contrast
    expect(resolveLinkColor('#1a1a1a', '#111111')).toBe('#93c5fd');
  });

  it('returns accent when contrast is sufficient on dark bg', () => {
    // Bright green on dark bg — high contrast
    expect(resolveLinkColor('#4ade80', '#1a1a1a')).toBe('#4ade80');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/link-color.test.ts --no-coverage`

Expected: FAIL — module `@/widget/src/link-color` not found.

- [ ] **Step 3: Implement link-color.ts**

Create `widget/src/link-color.ts`:

```typescript
/**
 * Link Color Resolver
 *
 * Picks a link color that meets WCAG AA contrast (4.5:1) against
 * the message bubble background. Falls back to a luminance-appropriate
 * safe blue when the widget's accent color doesn't pass.
 */

/** Parse hex, rgb/rgba, hsl/hsla into [r, g, b]. Returns null for unsupported formats. */
export function parseColorToRgb(color: string): [number, number, number] | null {
  if (!color) return null;
  const c = color.trim();

  // Hex: #RGB or #RRGGBB
  const hex = c.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  // rgb() / rgba()
  const rgb = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Math.round(+rgb[1]), Math.round(+rgb[2]), Math.round(+rgb[3])];

  // hsl() / hsla()
  const hsl = c.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%[\s,]+([\d.]+)%/i);
  if (hsl) return hslToRgb(+hsl[1], +hsl[2] / 100, +hsl[3] / 100);

  return null;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Returns a link color with at least 4.5:1 contrast against `bg`.
 * Uses the accent if it passes; otherwise picks a safe blue based on bg luminance.
 */
export function resolveLinkColor(accent: string, bg: string): string {
  const accentRgb = parseColorToRgb(accent);
  const bgRgb = parseColorToRgb(bg);
  if (!accentRgb || !bgRgb) return accent;
  if (contrastRatio(accentRgb, bgRgb) >= 4.5) return accent;
  return relativeLuminance(bgRgb) > 0.5 ? '#1d4ed8' : '#93c5fd';
}

/** Returns an rgba() tint string for the given color at the given alpha. */
export function rgbaTint(color: string, alpha: number): string {
  const rgb = parseColorToRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/link-color.test.ts --no-coverage`

Expected: all 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add widget/src/link-color.ts tests/unit/link-color.test.ts
git commit -m "feat: add contrast-aware link color resolver

WCAG AA (4.5:1) contrast check against bubble background,
with safe-blue fallback for low-contrast accent colors."
```

---

### Task 2: Raw URL Auto-Linking in Markdown Parser

**Files:**
- Modify: `widget/src/markdown.ts` (add auto-linking between steps 3 and 4, around line 37)
- Test: `tests/unit/markdown-links.test.ts`

- [ ] **Step 1: Write failing tests for raw URL auto-linking**

Create `tests/unit/markdown-links.test.ts`:

```typescript
import { renderMarkdown } from '@/widget/src/markdown';

describe('renderMarkdown — raw URL auto-linking', () => {
  it('converts a bare https URL to a clickable link', () => {
    const html = renderMarkdown('Visit https://example.com for more');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('>https://example.com</a>');
  });

  it('converts a bare http URL to a clickable link', () => {
    const html = renderMarkdown('See http://example.com/page');
    expect(html).toContain('<a href="http://example.com/page"');
  });

  it('converts www. URL to a clickable link with https prefix', () => {
    const html = renderMarkdown('Go to www.example.com');
    expect(html).toContain('<a href="https://www.example.com"');
    expect(html).toContain('>www.example.com</a>');
  });

  it('does not double-link markdown links', () => {
    const html = renderMarkdown('[click here](https://example.com)');
    // Should have exactly one <a> tag, not nested
    const matches = html.match(/<a /g);
    expect(matches).toHaveLength(1);
    expect(html).toContain('>click here</a>');
  });

  it('does not auto-link URLs inside code blocks', () => {
    const html = renderMarkdown('```\nhttps://example.com\n```');
    expect(html).not.toContain('<a href="https://example.com"');
  });

  it('does not auto-link URLs inside inline code', () => {
    const html = renderMarkdown('Use `https://example.com` in config');
    // The URL is inside <code>, should not be wrapped in <a>
    expect(html).toContain('<code>https://example.com</code>');
  });

  it('handles URL with path, query, and fragment', () => {
    const html = renderMarkdown('https://example.com/path?q=1&r=2#section');
    expect(html).toContain('href="https://example.com/path?q=1&amp;r=2#section"');
  });

  it('handles multiple URLs in one message', () => {
    const html = renderMarkdown('See https://a.com and https://b.com');
    const matches = html.match(/<a /g);
    expect(matches).toHaveLength(2);
  });
});

describe('renderMarkdown — existing markdown link behavior', () => {
  it('renders markdown links with target=_blank', () => {
    const html = renderMarkdown('[Example](https://example.com)');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/markdown-links.test.ts --no-coverage`

Expected: FAIL — raw URL tests fail (URLs not converted to links).

- [ ] **Step 3: Add raw URL auto-linking to renderMarkdown()**

Modify `widget/src/markdown.ts`. Add auto-linking after inline code extraction (step 3, line 37) and before tables (step 4). Insert this block after line 37 (`html = html.replace(/`([^`]+)`/g, '<code>$1</code>');`):

```typescript
    // 3b. Auto-link raw URLs (https://, http://, www.)
    // Skip URLs already inside markdown link syntax [text](url) — those are handled in step 12.
    // At this point, code blocks are extracted and inline code is replaced,
    // so URLs inside code won't be matched.
    html = html.replace(
      /(?<!\]\()(?<!=["'])(https?:\/\/[^\s<>)\]]+|www\.[^\s<>)\]]+)/g,
      (url: string) => {
        const href = url.startsWith('www.') ? `https://${url}` : url;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      }
    );
```

Also update the step 12 markdown link regex to avoid double-wrapping. Replace the existing step 12 (lines 123-127):

```typescript
    // 12. Links [text](url) — but skip if the text already contains an <a> tag (auto-linked)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, text: string, url: string) => {
        // If the URL was already auto-linked, use just the text
        if (text.includes('<a ')) return text;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }
    );
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/markdown-links.test.ts --no-coverage`

Expected: all 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add widget/src/markdown.ts tests/unit/markdown-links.test.ts
git commit -m "feat: auto-link raw URLs in markdown parser

Bare https://, http://, and www. URLs are now converted to
clickable links. Skips URLs inside code blocks and inline code.
Does not double-wrap markdown [text](url) links."
```

---

### Task 3: Inject Link CSS into Widget

**Files:**
- Modify: `widget/src/widget.ts` (around lines 335-340 for color computation, and around line 629 for CSS injection)

- [ ] **Step 1: Import link-color utilities**

At the top of `widget/src/widget.ts`, add after the existing imports (after line 22):

```typescript
import { resolveLinkColor, rgbaTint } from './link-color';
```

- [ ] **Step 2: Compute link color variables**

In `widget/src/widget.ts`, after the accent color lines (after line 336: `const hasAccent = !!config.theme?.color?.accent;`), add:

```typescript
  // Link colors: contrast-aware against the assistant bubble background (= chat bg)
  const linkColor = resolveLinkColor(accentColor, bg);
  const linkBgTint = rgbaTint(linkColor, 0.12);
  const linkBgTintHover = rgbaTint(linkColor, 0.22);
```

- [ ] **Step 3: Inject link CSS styles**

In `widget/src/widget.ts`, in the `styleEl.textContent` template string, after the table styles block (after line 628: `background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'};` and its closing `}`), add:

```css
    /* Links — contrast-aware styling */
    .n8n-message-content a {
      color: ${linkColor};
      text-decoration: underline;
      background-color: ${linkBgTint};
      padding: 0 2px;
      border-radius: 2px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    .n8n-message-content a:hover {
      background-color: ${linkBgTintHover};
    }
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors related to link-color imports.

- [ ] **Step 5: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add widget/src/widget.ts
git commit -m "feat: inject contrast-aware link styles into widget CSS

Links in messages now get underline + tinted background that
adapts to the widget's theme for guaranteed visibility."
```

---

### Task 4: Update Configurator Preview Link Styles

**Files:**
- Modify: `components/configurator/chat-preview.tsx` (around line 653)

- [ ] **Step 1: Import link-color utilities**

At the top of `components/configurator/chat-preview.tsx`, add with the other widget imports (near line 260, after `import { renderMarkdown } from '@/widget/src/markdown';`):

```typescript
import { resolveLinkColor, rgbaTint } from '@/widget/src/link-color';
```

- [ ] **Step 2: Find where `accentColor` and `bg` are computed in chat-preview.tsx**

These variables are already computed in the preview component for theme rendering. Find the equivalent values used for the assistant message bubble background and accent color. They will be used in the next step.

Run: `grep -n 'accentColor\|const bg\|const isDark\|primaryColor' /Users/polinger.ai/Desktop/Projects/chat_interfacer/components/configurator/chat-preview.tsx | head -10`

Use whatever variable names the preview uses for its background color and accent color.

- [ ] **Step 3: Compute link colors and replace hardcoded link style**

In `chat-preview.tsx`, after the accent/bg variables are set (found in step 2), add:

```typescript
const linkColor = resolveLinkColor(accentColor, bg);
const linkBgTint = rgbaTint(linkColor, 0.12);
const linkBgTintHover = rgbaTint(linkColor, 0.22);
```

Then replace line 653:
```
a { color: ${isDark ? '#60a5fa' : '#2563eb'}; text-decoration: underline; }
```

With:
```
a { color: ${linkColor}; text-decoration: underline; background-color: ${linkBgTint}; padding: 0 2px; border-radius: 2px; cursor: pointer; transition: background-color 0.15s ease; }
a:hover { background-color: ${linkBgTintHover}; }
```

- [ ] **Step 4: Verify no TypeScript errors**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add components/configurator/chat-preview.tsx
git commit -m "feat: use contrast-aware link colors in configurator preview

Preview now uses the same WCAG-checked link colors as the
production widget, replacing hardcoded blue values."
```

---

### Task 5: Rebuild Widget Bundle

**Files:**
- Rebuild: `public/widget/chat-widget.iife.js`

- [ ] **Step 1: Build the widget bundle**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npm run build:widget`

Expected: successful build, no errors.

- [ ] **Step 2: Verify the bundle includes link-color code**

Run: `grep -c "resolveLinkColor\|n8n-message-content a" /Users/polinger.ai/Desktop/Projects/chat_interfacer/public/widget/chat-widget.iife.js`

Expected: at least 1 match for each pattern (confirms the code was bundled).

- [ ] **Step 3: Verify the bundle includes auto-link regex**

Run: `grep -c "www\." /Users/polinger.ai/Desktop/Projects/chat_interfacer/public/widget/chat-widget.iife.js`

Expected: at least 1 match (confirms auto-linking code was bundled).

- [ ] **Step 4: Commit the rebuilt bundle**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add public/widget/chat-widget.iife.js
git commit -m "build: rebuild widget bundle with link visibility fix"
```

---

### Task 6: Run Full Test Suite

- [ ] **Step 1: Run all tests**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest --no-coverage 2>&1 | tail -20`

Expected: all tests pass, including the new `link-color` and `markdown-links` tests. No regressions.

- [ ] **Step 2: If any tests fail, fix them before proceeding**

Investigate failures — they should only be in pre-existing tests if our changes affected shared code. The markdown parser changes should not break existing behavior since auto-linking runs before markdown link parsing and code blocks are already extracted.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add -A
git commit -m "fix: resolve test regressions from link visibility changes"
```

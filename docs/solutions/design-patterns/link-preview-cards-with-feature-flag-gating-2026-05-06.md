---
title: "Link Preview Cards with Feature Flag Gating"
date: 2026-05-06
category: design-patterns
module: widget
problem_type: design_pattern
component: frontend_stimulus
severity: medium
applies_when:
  - "Rendering external links in bot messages within the embeddable chat widget"
  - "Deciding whether to use a heavyweight feature (lightbox) or a lightweight fallback (preview cards)"
  - "Adding rich link previews to markdown-rendered content"
  - "Gating optional UI features behind configuration flags with sensible defaults"
  - "Maintaining parity between configurator preview and production widget rendering"
tags:
  - link-preview
  - feature-flag
  - progressive-enhancement
  - embeddable-widget
  - markdown-rendering
  - lightbox
  - design-parity
---

# Link Preview Cards with Feature Flag Gating

## Context

The widget renders markdown bot responses containing links (both explicit `[text](url)` and auto-linked raw URLs). Previously, links were styled text with contrast-aware colors (see [chat-widget-link-visibility](../ui-bugs/chat-widget-link-visibility-2026-05-06.md)). Users clicking links navigated away from the widget. The PDF lightbox intercepted PDF clicks to show them inline via iframe, but this failed for SharePoint/OneDrive links due to `X-Frame-Options: DENY`. The lightbox was always enabled with no configuration option. There was no visual enrichment showing what a link pointed to before clicking it.

## Guidance

Enrich rendered HTML links with preview cards after markdown rendering, gated behind feature flags for progressive enhancement.

### Post-render injection

Parse rendered HTML for `<a>` elements after markdown-it has finished rendering. Skip non-navigable links (`#`, `mailto:`, `javascript:`) and links nested inside `<pre>` or `<code>` blocks. This keeps the markdown pipeline untouched and treats link enrichment as a decoration layer.

```typescript
function injectLinkPreviewCards(bubbleEl: HTMLElement) {
  if (lightboxEnabled) return; // mutual exclusivity guard
  const links = bubbleEl.querySelectorAll<HTMLAnchorElement>('a[href]');
  links.forEach((anchor) => {
    const href = anchor.href;
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
    if (anchor.closest('pre') || anchor.closest('code')) return;

    const card = createLinkPreviewCard(href, previewCardTheme);
    if (anchor.parentElement && anchor.parentElement !== bubbleEl) {
      anchor.parentElement.after(card);
    } else {
      anchor.after(card);
    }
  });
}
```

### Theme-aware cards

Derive card colors from the widget's existing theme variables rather than hardcoding. This ensures preview cards look native regardless of the widget's configured theme, including dark mode.

```typescript
const previewCardTheme: LinkPreviewTheme = {
  surface,      // from widget theme
  text,         // from widget theme
  subText,      // from widget theme
  border,       // from widget theme
  accentColor,  // from widget config
  elementRadius // from widget radius config
};
```

### Feature flag gating

Make heavier features (lightbox with inline PDF viewing) opt-in via `config.features.lightboxEnabled`, with lighter features (preview cards) as the default. The baseline experience is good; power features are toggled on deliberately.

```typescript
const lightboxEnabled = config.features?.lightboxEnabled === true;

if (lightboxEnabled) {
  // Heavy feature: intercept PDF clicks, render inline viewer
  const pdfLightbox = new PdfLightbox();
  messagesContainer.addEventListener('click', (e) => { /* ... */ });
}
// Otherwise: preview cards injected per-message (see injectLinkPreviewCards)
```

### Mutual exclusivity

When lightbox is enabled, skip preview card injection to avoid duplicate UX for the same links. The guard `if (lightboxEnabled) return;` at the top of `injectLinkPreviewCards` enforces this.

### Dual injection points

Inject cards both on initial message render AND on content updates (streaming SSE chunks). Streaming messages have their HTML replaced incrementally, so cards injected on the first render get destroyed when new content arrives.

```typescript
// On initial render
if (role === 'assistant' && !isLoading) {
  injectLinkPreviewCards(bubbleEl);
}

// On streaming content update
function onStreamChunk(bubble: HTMLElement, updatedHtml: string) {
  bubble.innerHTML = updatedHtml;  // already sanitized via DOMPurify in renderMarkdown
  injectLinkPreviewCards(bubble);  // re-inject after HTML replacement
}
```

### Preview parity

Replicate the same visual in the configurator preview using framework-appropriate code. The production widget uses vanilla DOM (`document.createElement`), while the configurator preview uses React JSX with CSS classes. Both share the `detectFileType` utility for consistent icon/filename/domain extraction.

## Why This Matters

Links in bot messages are the primary call-to-action for many workflows -- document delivery, resource sharing, appointment booking, knowledge base references. Without enrichment, users cannot tell what a link leads to without hovering or clicking, and clicking navigates them away from the widget entirely. Preview cards give immediate context (file type icon, filename, source domain) and explicit Open/Download actions that open in new tabs, keeping the user in the chat conversation. This is especially important for embeddable widgets where navigating away means losing the chat context.

## When to Apply

- When building embeddable widgets that render user-generated or AI-generated content containing links
- When adding new UI features that should be opt-in rather than forced on all users (the feature flag gating pattern)
- When maintaining design parity between a standalone widget (vanilla JS/DOM) and its configuration preview (React)
- When enriching rendered markdown output without modifying the markdown rendering pipeline itself
- When handling streaming content where DOM elements are replaced incrementally

## Examples

**Before (plain links):**
A bot message containing `Here is your report: [Q4 Report](https://example.com/report.pdf)` renders as a simple styled text link. The user has no indication it is a PDF, no filename context, and clicking it navigates away from the widget.

**After (enriched with preview card):**
The same link renders normally, but immediately below it appears a compact card showing: a red PDF icon badge, the filename "report.pdf", the domain "example.com", and two buttons -- "Open" and "Download" -- both opening in a new tab.

**Key files:**
- `widget/src/ui/link-preview-card.ts` -- Card component (vanilla DOM)
- `widget/src/utils/file-type-detector.ts` -- URL-to-file-type classifier
- `widget/src/widget.ts` -- Feature flag check + card injection
- `components/configurator/chat-preview.tsx` -- React equivalent for configurator
- `widget/src/ui/pdf-lightbox.ts` -- Gated lightbox (preserved, not removed)

## Related

- [Chat Widget Link Visibility Fix](../ui-bugs/chat-widget-link-visibility-2026-05-06.md) -- prerequisite work that made links visible and styled; preview cards build on top of those styled anchors
- Design spec: `docs/superpowers/specs/2026-05-06-link-preview-card-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-06-link-preview-card.md`

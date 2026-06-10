# Link Preview Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace broken lightbox iframe with inline preview cards for all external links in chat messages.

**Architecture:** Two new utility modules (file type detector + preview card builder), a feature flag to gate the existing lightbox, and card injection after markdown rendering in both the widget and configurator preview. No remote API calls — purely client-side URL parsing.

**Tech Stack:** TypeScript, esbuild (widget bundle), Next.js/React (configurator preview), Jest (tests)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `widget/src/utils/file-type-detector.ts` | **NEW** — Parse URL for extension, domain, filename; return icon/label/color |
| `widget/src/ui/link-preview-card.ts` | **NEW** — Create preview card DOM element from file type info + theme colors |
| `widget/src/widget.ts` | **MODIFY** — Add lightbox feature flag, inject preview cards after message rendering |
| `components/configurator/chat-preview.tsx` | **MODIFY** — Add preview card rendering in configurator preview |
| `tests/unit/file-type-detector.test.ts` | **NEW** — Tests for URL parsing and file type detection |
| `tests/unit/link-preview-card.test.ts` | **NEW** — Tests for preview card DOM generation |
| `public/widget/chat-widget.iife.js` | **REBUILD** — Rebuilt widget bundle |

---

### Task 1: File Type Detector

**Files:**
- Create: `widget/src/utils/file-type-detector.ts`
- Test: `tests/unit/file-type-detector.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/file-type-detector.test.ts`:

```typescript
import { detectFileType, FileTypeInfo } from '@/widget/src/utils/file-type-detector';

describe('detectFileType', () => {
  it('detects Word documents from .docx extension', () => {
    const result = detectFileType('https://sharepoint.com/sites/team/Shared/Report.docx');
    expect(result.icon).toBe('W');
    expect(result.iconColor).toBe('#2b579a');
    expect(result.label).toBe('Word Document');
    expect(result.filename).toBe('Report.docx');
    expect(result.domain).toBe('sharepoint.com');
  });

  it('detects Excel from .xlsx extension', () => {
    const result = detectFileType('https://onedrive.live.com/files/Budget.xlsx');
    expect(result.icon).toBe('X');
    expect(result.iconColor).toBe('#217346');
    expect(result.label).toBe('Excel Spreadsheet');
    expect(result.filename).toBe('Budget.xlsx');
  });

  it('detects PowerPoint from .pptx extension', () => {
    const result = detectFileType('https://example.com/slides/Deck.pptx');
    expect(result.icon).toBe('P');
    expect(result.iconColor).toBe('#d24726');
    expect(result.label).toBe('PowerPoint');
  });

  it('detects PDF from .pdf extension', () => {
    const result = detectFileType('https://example.com/doc.pdf');
    expect(result.icon).toBe('PDF');
    expect(result.iconColor).toBe('#e74c3c');
    expect(result.label).toBe('PDF Document');
  });

  it('detects images from .png extension', () => {
    const result = detectFileType('https://example.com/photo.png');
    expect(result.icon).toBe('IMG');
    expect(result.iconColor).toBe('#8e44ad');
    expect(result.label).toBe('Image');
  });

  it('detects archives from .zip extension', () => {
    const result = detectFileType('https://example.com/files.zip');
    expect(result.icon).toBe('ZIP');
    expect(result.iconColor).toBe('#7f8c8d');
    expect(result.label).toBe('Archive');
  });

  it('detects text files from .csv extension', () => {
    const result = detectFileType('https://example.com/data.csv');
    expect(result.icon).toBe('TXT');
    expect(result.iconColor).toBe('#95a5a6');
    expect(result.label).toBe('Text File');
  });

  it('falls back to domain for unknown extensions', () => {
    const result = detectFileType('https://sharepoint.com/sites/team/_layouts/view.aspx');
    expect(result.icon).toBe('🔗');
    expect(result.iconColor).toBe('#6b7280');
    expect(result.label).toBe('sharepoint.com');
  });

  it('falls back to domain for URLs with no extension', () => {
    const result = detectFileType('https://docs.google.com/document/d/abc123/edit');
    expect(result.label).toBe('docs.google.com');
    expect(result.domain).toBe('docs.google.com');
  });

  it('strips www. from domain', () => {
    const result = detectFileType('https://www.example.com/file.docx');
    expect(result.domain).toBe('example.com');
  });

  it('decodes URL-encoded filenames', () => {
    const result = detectFileType('https://example.com/Q3%20Sales%20Report.docx');
    expect(result.filename).toBe('Q3 Sales Report.docx');
  });

  it('handles .doc extension (legacy Word)', () => {
    const result = detectFileType('https://example.com/old.doc');
    expect(result.icon).toBe('W');
    expect(result.label).toBe('Word Document');
  });

  it('handles URLs with query parameters after extension', () => {
    const result = detectFileType('https://example.com/file.pdf?token=abc123');
    expect(result.icon).toBe('PDF');
    expect(result.filename).toBe('file.pdf');
  });

  it('handles invalid URLs gracefully', () => {
    const result = detectFileType('not-a-url');
    expect(result.icon).toBe('🔗');
    expect(result.label).toBe('Link');
    expect(result.filename).toBe('not-a-url');
    expect(result.domain).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/file-type-detector.test.ts --no-coverage`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement file-type-detector.ts**

Create `widget/src/utils/file-type-detector.ts`:

```typescript
/**
 * File Type Detector
 *
 * Parses a URL to extract filename, domain, and file type information.
 * Used by link preview cards to show appropriate icons and labels.
 * Purely client-side — no remote requests.
 */

export interface FileTypeInfo {
  icon: string;
  iconColor: string;
  label: string;
  filename: string;
  domain: string;
}

interface FileTypeEntry {
  icon: string;
  iconColor: string;
  label: string;
}

const FILE_TYPES: Record<string, FileTypeEntry> = {
  docx: { icon: 'W', iconColor: '#2b579a', label: 'Word Document' },
  doc:  { icon: 'W', iconColor: '#2b579a', label: 'Word Document' },
  xlsx: { icon: 'X', iconColor: '#217346', label: 'Excel Spreadsheet' },
  xls:  { icon: 'X', iconColor: '#217346', label: 'Excel Spreadsheet' },
  pptx: { icon: 'P', iconColor: '#d24726', label: 'PowerPoint' },
  ppt:  { icon: 'P', iconColor: '#d24726', label: 'PowerPoint' },
  pdf:  { icon: 'PDF', iconColor: '#e74c3c', label: 'PDF Document' },
  png:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  jpg:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  jpeg: { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  gif:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  svg:  { icon: 'IMG', iconColor: '#8e44ad', label: 'Image' },
  zip:  { icon: 'ZIP', iconColor: '#7f8c8d', label: 'Archive' },
  rar:  { icon: 'ZIP', iconColor: '#7f8c8d', label: 'Archive' },
  '7z': { icon: 'ZIP', iconColor: '#7f8c8d', label: 'Archive' },
  txt:  { icon: 'TXT', iconColor: '#95a5a6', label: 'Text File' },
  md:   { icon: 'TXT', iconColor: '#95a5a6', label: 'Text File' },
  csv:  { icon: 'TXT', iconColor: '#95a5a6', label: 'Text File' },
};

const FALLBACK: FileTypeEntry = { icon: '🔗', iconColor: '#6b7280', label: '' };

export function detectFileType(url: string): FileTypeInfo {
  let domain = '';
  let filename = url;

  try {
    const parsed = new URL(url);
    domain = parsed.hostname.toLowerCase().replace(/^www\./, '');

    const segments = parsed.pathname.split('/');
    const last = segments[segments.length - 1];
    if (last && last.length > 0) {
      filename = decodeURIComponent(last);
    } else {
      filename = domain;
    }
  } catch {
    // Invalid URL — use raw string as filename
    return { ...FALLBACK, label: FALLBACK.label || 'Link', filename, domain };
  }

  // Extract extension (ignore query params)
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (extMatch) {
    const ext = extMatch[1].toLowerCase();
    const entry = FILE_TYPES[ext];
    if (entry) {
      return { ...entry, filename, domain };
    }
  }

  // Fallback: use domain as label
  return { ...FALLBACK, label: domain || 'Link', filename, domain };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/file-type-detector.test.ts --no-coverage`

Expected: all 14 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add widget/src/utils/file-type-detector.ts tests/unit/file-type-detector.test.ts
git commit -m "feat: add file type detector for link preview cards

Parses URLs for extension, filename, and domain. Returns icon,
color, and label for known file types (Office, PDF, images, etc.)
with domain-name fallback for unknown types.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Link Preview Card Component

**Files:**
- Create: `widget/src/ui/link-preview-card.ts`
- Test: `tests/unit/link-preview-card.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/link-preview-card.test.ts`:

```typescript
import { createLinkPreviewCard } from '@/widget/src/ui/link-preview-card';

// Mock minimal DOM environment (jsdom provides this)
describe('createLinkPreviewCard', () => {
  const defaultTheme = {
    surface: '#f3f4f6',
    text: '#111827',
    subText: '#6b7280',
    border: 'rgba(0,0,0,0.08)',
    accentColor: '#0ea5e9',
    elementRadius: '8px',
  };

  it('creates a card element for a Word document URL', () => {
    const card = createLinkPreviewCard('https://sharepoint.com/Report.docx', defaultTheme);
    expect(card).toBeInstanceOf(HTMLElement);
    expect(card.textContent).toContain('Report.docx');
    expect(card.textContent).toContain('sharepoint.com');
  });

  it('includes an Open link that opens in new tab', () => {
    const card = createLinkPreviewCard('https://example.com/file.pdf', defaultTheme);
    const openLink = card.querySelector('a[target="_blank"]') as HTMLAnchorElement;
    expect(openLink).not.toBeNull();
    expect(openLink.href).toContain('example.com/file.pdf');
    expect(openLink.textContent).toBe('Open');
  });

  it('includes a Download link', () => {
    const card = createLinkPreviewCard('https://example.com/file.xlsx', defaultTheme);
    const links = card.querySelectorAll('a');
    const downloadLink = Array.from(links).find(a => a.textContent === 'Download');
    expect(downloadLink).not.toBeUndefined();
    expect(downloadLink!.hasAttribute('download')).toBe(true);
  });

  it('shows file type icon with correct color for known types', () => {
    const card = createLinkPreviewCard('https://example.com/slides.pptx', defaultTheme);
    // The icon element should contain "P"
    expect(card.textContent).toContain('P');
  });

  it('shows domain fallback for unknown file types', () => {
    const card = createLinkPreviewCard('https://sharepoint.com/sites/view', defaultTheme);
    expect(card.textContent).toContain('sharepoint.com');
  });

  it('applies theme colors to the card', () => {
    const darkTheme = {
      ...defaultTheme,
      surface: '#262626',
      text: '#e5e5e5',
      subText: '#a1a1aa',
      border: 'rgba(255,255,255,0.1)',
    };
    const card = createLinkPreviewCard('https://example.com/file.docx', darkTheme);
    expect(card.style.backgroundColor).toBe(darkTheme.surface);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/link-preview-card.test.ts --no-coverage`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement link-preview-card.ts**

Create `widget/src/ui/link-preview-card.ts`:

```typescript
/**
 * Link Preview Card
 *
 * Creates a compact inline preview card for external links.
 * Shows file type icon, filename, domain, and Open/Download buttons.
 */

import { detectFileType } from '../utils/file-type-detector';

export interface LinkPreviewTheme {
  surface: string;
  text: string;
  subText: string;
  border: string;
  accentColor: string;
  elementRadius: string;
}

export function createLinkPreviewCard(url: string, theme: LinkPreviewTheme): HTMLElement {
  const info = detectFileType(url);

  const card = document.createElement('div');
  card.className = 'n8n-link-preview-card';
  card.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    margin-top: 6px;
    background-color: ${theme.surface};
    border: 1px solid ${theme.border};
    border-radius: ${theme.elementRadius};
    font-family: inherit;
  `;

  // Icon
  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 36px;
    height: 36px;
    background: ${info.iconColor};
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: ${info.icon.length > 2 ? '10px' : '14px'};
    flex-shrink: 0;
    line-height: 1;
  `;
  icon.textContent = info.icon;
  card.appendChild(icon);

  // Text area (filename + domain)
  const textArea = document.createElement('div');
  textArea.style.cssText = `
    flex: 1;
    min-width: 0;
    overflow: hidden;
  `;

  const filenameEl = document.createElement('div');
  filenameEl.style.cssText = `
    font-weight: 600;
    font-size: 13px;
    color: ${theme.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  filenameEl.textContent = info.filename;
  textArea.appendChild(filenameEl);

  const domainEl = document.createElement('div');
  domainEl.style.cssText = `
    font-size: 11px;
    color: ${theme.subText};
    margin-top: 1px;
  `;
  domainEl.textContent = info.domain;
  textArea.appendChild(domainEl);

  card.appendChild(textArea);

  // Action buttons
  const actions = document.createElement('div');
  actions.style.cssText = `
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  `;

  // Open button
  const openBtn = document.createElement('a');
  openBtn.href = url;
  openBtn.target = '_blank';
  openBtn.rel = 'noopener noreferrer';
  openBtn.textContent = 'Open';
  openBtn.style.cssText = `
    font-size: 12px;
    color: ${theme.accentColor};
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    cursor: pointer;
    white-space: nowrap;
  `;
  actions.appendChild(openBtn);

  // Download button
  const dlBtn = document.createElement('a');
  dlBtn.href = url;
  dlBtn.download = info.filename;
  dlBtn.textContent = 'Download';
  dlBtn.style.cssText = `
    font-size: 12px;
    color: ${theme.subText};
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 4px;
    background: ${theme.surface};
    border: 1px solid ${theme.border};
    cursor: pointer;
    white-space: nowrap;
  `;
  actions.appendChild(dlBtn);

  card.appendChild(actions);

  return card;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest tests/unit/link-preview-card.test.ts --no-coverage`

Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add widget/src/ui/link-preview-card.ts tests/unit/link-preview-card.test.ts
git commit -m "feat: add link preview card component

Compact inline card with file type icon, filename, domain,
and Open/Download buttons. Theme-aware styling.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Feature Flag and Card Injection in Widget

**Files:**
- Modify: `widget/src/widget.ts`

- [ ] **Step 1: Add lightbox feature flag and preview card import**

At the top of `widget/src/widget.ts`, the existing imports include:

```typescript
import { isPdfUrl } from './utils/link-detector';
import { PdfLightbox } from './ui/pdf-lightbox';
```

Add below them:

```typescript
import { createLinkPreviewCard, LinkPreviewTheme } from './ui/link-preview-card';
```

- [ ] **Step 2: Gate the lightbox behind a feature flag**

Find the lightbox click handler block at lines 1002-1012:

```typescript
  // PDF Lightbox: intercept clicks on PDF links in assistant messages
  const pdfLightbox = new PdfLightbox();
  messagesContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (link && isPdfUrl(link.href)) {
      e.preventDefault();
      e.stopPropagation();
      pdfLightbox.open(link.href);
    }
  });
```

Replace with:

```typescript
  // Lightbox: gated behind feature flag (disabled by default)
  const lightboxEnabled = config.features?.lightboxEnabled === true;
  if (lightboxEnabled) {
    const pdfLightbox = new PdfLightbox();
    messagesContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a') as HTMLAnchorElement | null;
      if (link && isPdfUrl(link.href)) {
        e.preventDefault();
        e.stopPropagation();
        pdfLightbox.open(link.href);
      }
    });
  }
```

- [ ] **Step 3: Create a helper function to inject preview cards**

Add this function inside `createChatWidget`, after the lightbox block and before the composer area (before line 1014):

```typescript
  // Link preview card theme — derived from existing widget theme colors
  const previewCardTheme: LinkPreviewTheme = {
    surface,
    text,
    subText,
    border,
    accentColor,
    elementRadius,
  };

  // Inject preview cards for all external links in a message bubble
  function injectLinkPreviewCards(bubbleEl: HTMLElement) {
    if (lightboxEnabled) return; // Lightbox handles link clicks when enabled
    const links = bubbleEl.querySelectorAll('a[href]');
    links.forEach((linkEl) => {
      const anchor = linkEl as HTMLAnchorElement;
      const href = anchor.href;
      // Skip internal links, anchors, mailto, javascript
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
      // Skip links inside code blocks
      if (anchor.closest('pre') || anchor.closest('code')) return;
      // Create and insert card after the link
      const card = createLinkPreviewCard(href, previewCardTheme);
      // Insert after the anchor's parent block, or after the anchor itself
      if (anchor.parentElement && anchor.parentElement !== bubbleEl) {
        anchor.parentElement.after(card);
      } else {
        anchor.after(card);
      }
    });
  }
```

- [ ] **Step 4: Call injectLinkPreviewCards in addMessage**

Find the `addMessage` function. After line 1282 where assistant message content is set:

```typescript
      } else {
        bubbleEl.innerHTML = cachedRenderMarkdown(content);
      }
```

Add after the closing brace of the `if (role === 'assistant')` block (after line 1286):

```typescript
    // Inject preview cards for external links in assistant messages
    if (role === 'assistant' && !isLoading) {
      injectLinkPreviewCards(bubbleEl);
    }
```

- [ ] **Step 5: Call injectLinkPreviewCards in updateMessage**

Find the `updateMessage` function. After line 1304 where content is updated:

```typescript
    if (bubbleEl) {
      bubbleEl.innerHTML = cachedRenderMarkdown(content);
    }
```

Add after that block:

```typescript
    // Re-inject preview cards after content update
    if (bubbleEl) {
      injectLinkPreviewCards(bubbleEl as HTMLElement);
    }
```

- [ ] **Step 6: Verify no TypeScript errors**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors related to link preview imports.

- [ ] **Step 7: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add widget/src/widget.ts
git commit -m "feat: gate lightbox behind flag, inject link preview cards

Lightbox disabled by default. All external links in assistant
messages get inline preview cards with Open/Download buttons.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Configurator Preview Parity

**Files:**
- Modify: `components/configurator/chat-preview.tsx`

- [ ] **Step 1: Add import for file type detector**

Near the top of `components/configurator/chat-preview.tsx`, after the existing `renderMarkdown` import (line 260), add:

```typescript
import { detectFileType } from '@/widget/src/utils/file-type-detector';
```

- [ ] **Step 2: Disable lightbox click handler**

Find the `handleMessageClick` callback (lines 289-297):

```typescript
  const handleMessageClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a') as HTMLAnchorElement | null;
    if (link && isPdfUrl(link.href)) {
      e.preventDefault();
      e.stopPropagation();
      pdfLightboxRef.current?.open(link.href);
    }
  }, []);
```

Replace with a no-op or remove the lightbox interception:

```typescript
  const handleMessageClick = useCallback((e: React.MouseEvent) => {
    // Lightbox disabled — links open naturally via target="_blank"
  }, []);
```

- [ ] **Step 3: Add preview card CSS to the style block**

In the `<style dangerouslySetInnerHTML>` block (around line 619), after the link styles (`a:hover` rule), add:

```css
/* Link preview cards */
.link-preview-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-top: 6px;
  background: ${surface};
  border: 1px solid ${border};
  border-radius: ${elementRadius};
}
.link-preview-card .lpc-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.link-preview-card .lpc-filename {
  font-weight: 600;
  font-size: 13px;
  color: ${text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.link-preview-card .lpc-domain {
  font-size: 11px;
  color: ${subText};
  margin-top: 1px;
}
.link-preview-card .lpc-btn {
  font-size: 12px;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid ${border};
  background: ${surface};
  cursor: pointer;
  white-space: nowrap;
}
```

- [ ] **Step 4: Create a React component for preview cards in messages**

Add this component inside the `ChatPreview` component (or before the return statement), using the `detectFileType` import:

```typescript
  // Render preview cards for links in a message
  const renderMessageWithCards = (htmlContent: string) => {
    // Parse links from rendered HTML to show preview cards below
    const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>[^<]*<\/a>/g;
    const links: string[] = [];
    let match;
    while ((match = linkRegex.exec(htmlContent)) !== null) {
      const href = match[1];
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('javascript:')) {
        links.push(href);
      }
    }

    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        {links.map((href, i) => {
          const info = detectFileType(href);
          return (
            <div key={i} className="link-preview-card">
              <div
                className="lpc-icon"
                style={{
                  backgroundColor: info.iconColor,
                  fontSize: info.icon.length > 2 ? '10px' : '14px',
                }}
              >
                {info.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div className="lpc-filename">{info.filename}</div>
                <div className="lpc-domain">{info.domain}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lpc-btn"
                  style={{ color: accentColor }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Open
                </a>
                <a
                  href={href}
                  download={info.filename}
                  className="lpc-btn"
                  style={{ color: subText }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Download
                </a>
              </div>
            </div>
          );
        })}
      </>
    );
  };
```

- [ ] **Step 5: Use renderMessageWithCards in message rendering**

Find the message rendering section (around line 780):

```tsx
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
```

Replace with:

```tsx
                    {renderMessageWithCards(renderMarkdown(msg.text))}
```

- [ ] **Step 6: Verify no TypeScript errors**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx tsc --noEmit --pretty 2>&1 | head -30`

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add components/configurator/chat-preview.tsx
git commit -m "feat: add link preview cards to configurator preview

Preview now shows inline cards for external links, matching
the production widget. Lightbox click handler disabled.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Rebuild Widget Bundle

**Files:**
- Rebuild: `public/widget/chat-widget.iife.js`

- [ ] **Step 1: Build the widget bundle**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npm run build:widget`

Expected: successful build, no errors.

- [ ] **Step 2: Verify the bundle includes preview card code**

Run: `npx esbuild widget/src/index.ts --bundle --format=iife --global-name=ChatWidget --platform=browser --target=es2018 2>/dev/null | grep -c "link-preview-card\|n8n-link-preview\|detectFileType\|lightboxEnabled"`

Expected: at least 1 match (confirms code bundled before obfuscation).

- [ ] **Step 3: Commit the rebuilt bundle**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add public/widget/chat-widget.iife.js
git commit -m "build: rebuild widget bundle with link preview cards

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Run Full Test Suite

- [ ] **Step 1: Run all tests**

Run: `cd /Users/polinger.ai/Desktop/Projects/chat_interfacer && npx jest --no-coverage 2>&1 | tail -20`

Expected: all new tests pass (file-type-detector, link-preview-card). No regressions in existing tests (link-color, markdown-links).

- [ ] **Step 2: Fix any regressions if needed**

If any existing tests break, investigate. The most likely issue would be if an existing test expects the lightbox to intercept clicks — those tests should now reflect the lightbox being disabled by default.

- [ ] **Step 3: Commit fixes if any**

```bash
cd /Users/polinger.ai/Desktop/Projects/chat_interfacer
git add -A
git commit -m "fix: resolve test regressions from link preview card changes

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

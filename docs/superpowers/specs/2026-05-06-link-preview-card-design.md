# Inline Link Preview Card

**Date:** 2026-05-06
**Status:** Approved
**Scope:** Widget bundle + configurator preview

---

## Problem

External links in chat messages (primarily SharePoint and OneDrive) open in a lightbox iframe that fails because these services set `X-Frame-Options: DENY`. Users see "[domain] refused to connect" instead of the document. The "Open in new tab" and "Download" actions work fine — only the inline iframe preview is broken.

## Solution

Replace the lightbox approach with compact inline preview cards that appear below each link in the message. Disable the lightbox by default via a feature flag, preserving the code for future use.

---

## Components

### 1. Feature Flag — Lightbox Gating

A boolean flag that controls whether the existing `PdfLightbox` behavior is active:

- **Flag location:** In the widget initialization logic (`widget.ts`), check a config property (e.g., `features.lightboxEnabled`) before wiring up lightbox click interception.
- **Default:** `false` (lightbox disabled)
- **When `true`:** Existing lightbox behavior is restored (click interception, iframe preview for PDFs, etc.)
- **When `false`:** Links are not intercepted. Preview cards are rendered inline instead.

The lightbox code (`widget/src/ui/pdf-lightbox.ts`) stays in the codebase untouched.

### 2. File Type Detector (`widget/src/utils/file-type-detector.ts`)

A utility that parses a URL and returns file type information:

- **Input:** URL string
- **Output:** `{ icon: string, iconColor: string, label: string, filename: string, domain: string }`

Detection logic:
- Extract filename from URL path (last segment, URL-decoded)
- Match file extension against known types:
  - `.docx`, `.doc` → icon: "W", color: `#2b579a`, label: "Word Document"
  - `.xlsx`, `.xls` → icon: "X", color: `#217346`, label: "Excel Spreadsheet"
  - `.pptx`, `.ppt` → icon: "P", color: `#d24726`, label: "PowerPoint"
  - `.pdf` → icon: "PDF", color: `#e74c3c`, label: "PDF Document"
  - `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg` → icon: "IMG", color: `#8e44ad`, label: "Image"
  - `.zip`, `.rar`, `.7z` → icon: "ZIP", color: `#7f8c8d`, label: "Archive"
  - `.txt`, `.md`, `.csv` → icon: "TXT", color: `#95a5a6`, label: "Text File"
- **Fallback:** If no extension or unknown extension → icon: "🔗", color: `#6b7280`, label: domain name
- Extract domain from URL (strip `www.` prefix)

### 3. Link Preview Card (`widget/src/ui/link-preview-card.ts`)

A function that creates a preview card DOM element for a given URL:

- **Input:** URL string, widget theme colors (for card styling)
- **Output:** `HTMLElement` — a styled card div

Card structure:
```
┌─────────────────────────────────────────────────┐
│  [icon]  filename.ext                [Open] [↓] │
│          domain.com                              │
└─────────────────────────────────────────────────┘
```

Styling:
- Card background: subtle surface color (theme-aware, like message bubbles)
- Border: 1px solid with low opacity border color
- Border radius: matches widget's configured radius
- Padding: 10px 12px
- Margin-top: 6px (space between link text and card)
- Icon: 36px square with rounded corners, colored background, white letter centered
- Filename: 13px, font-weight 600, text-overflow ellipsis
- Domain: 11px, subdued text color
- Open button: accent-colored background, opens URL in new tab
- Download button: neutral background, triggers download via `<a download>` attribute

The card must be theme-aware — use the widget's existing color variables (`bg`, `text`, `subText`, `surface`, `border`, `accentColor`) for consistent styling across light/dark themes.

### 4. Card Injection in Message Rendering

After the markdown renderer produces HTML and it's set as `innerHTML` on the message bubble, scan the bubble for `<a>` tags and append a preview card below each one:

- Query all `<a href="...">` elements in the rendered message
- Skip links that point to anchors (`#`), `mailto:`, or `javascript:` URLs
- Skip links inside code blocks (`<pre>`, `<code>`)
- For each qualifying link, create a preview card and insert it after the `<a>` element
- This runs in both `addMessage()` and `updateMessage()` paths in `widget.ts`

### 5. Configurator Preview Parity

The configurator preview (`chat-preview.tsx`) must also render preview cards so users see accurate previews while designing their widget. Import and use the same file type detection logic. The card can be a React component that mirrors the DOM-based card's appearance.

---

## Files to Change

| File | Change |
|------|--------|
| `widget/src/utils/file-type-detector.ts` | **NEW** — URL parsing, extension matching, file type info |
| `widget/src/ui/link-preview-card.ts` | **NEW** — creates preview card DOM element |
| `widget/src/widget.ts` | Add feature flag check to disable lightbox, inject preview cards after message rendering |
| `widget/src/markdown.ts` | No changes (auto-linking already handled) |
| `components/configurator/chat-preview.tsx` | Add preview card rendering for links in preview messages |
| `public/widget/chat-widget.iife.js` | Rebuild after widget source changes |

## Files NOT Changed

- `widget/src/ui/pdf-lightbox.ts` — stays in codebase, gated by flag
- `widget/src/utils/link-detector.ts` — stays in codebase, used by lightbox when enabled
- No changes to embed logic, deployment, or caching

---

## Testing

- Verify preview cards appear below links in chat messages
- Verify file type detection for .docx, .xlsx, .pptx, .pdf, and unknown extensions
- Verify domain extraction and display
- Verify Open button opens link in new tab
- Verify Download button triggers file download
- Verify cards are theme-aware (light and dark modes)
- Verify lightbox is disabled by default (no iframe on link click)
- Verify lightbox works when flag is enabled
- Verify links inside code blocks do NOT get preview cards
- Verify mailto: and anchor links do NOT get preview cards
- Verify configurator preview matches widget appearance

---

## Out of Scope

- Remote metadata fetching (no HEAD requests, no API calls)
- Microsoft Graph API integration
- Thumbnail/image previews of documents
- Lightbox removal (code stays, just gated)

# Document Display Widget — Design Spec

**Status:** Draft, awaiting review
**Date:** 2026-05-15
**Owner:** Etan Polinger

## Summary

Add a new widget kind alongside the existing chat widget: a **document display widget** that auto-fires on page load, sends the same payload shape as the chat widget to an n8n webhook, and renders the JSON response as a clickable list of documents in a floating right-edge sidebar.

The new widget shares all infrastructure (relay client, page-context capture, theming, license/domain validation, rate limiting) with the chat widget. The only new code is a renderer, a sidebar UI, a narrow configurator, and a `kind` column on the widgets table.

## Goals

- A second widget kind that displays a list of documents instead of a chat surface.
- Auto-fires once on mount, no user interaction required.
- Sends the same payload as the chat widget so existing n8n workflows can be re-used or branched cleanly.
- Reuses the existing theming, relay, license, and domain-validation infrastructure — no parallel pipelines.
- A configurator at `/configurator/n8n-display` with ~5 sections (versus ~9 for the chat widget).

## Non-goals (v1)

- No re-fire on URL change (SPAs require a manual reload to refresh).
- No manual refresh button in the sidebar.
- No grouping by category, no descriptions, no dates, no thumbnails on cards.
- No lightbox or inline document preview; clicking a card opens the URL in a new tab.
- No analytics on document clicks.
- No prompt templating in the widget; host pages compose any dynamic message themselves.

## Locked decisions (from brainstorming)

| Decision | Value |
|---|---|
| Primary use case | Contextual recommendations (e.g., "required documents for this transaction") |
| Trigger | On initial mount only — no SPA navigation handling |
| Display surface | Floating right-edge sidebar (mobile collapses to a bottom sheet) |
| Document fields supported | `title`, `url` (required); type is auto-detected from URL extension |
| Widget-kind separation | Separate widget kinds at creation. One widget record = one kind. |
| `chatInput` source | `window.ChatWidgetConfig.message` ?? `config.connection.triggerMessage` ?? `''` |
| Custom context | Same mechanism as chat (host-page-injected `customContext`) |
| Code structure | Approach B — shared core, separate renderer |
| Refactor strategy | Include chat-renderer extraction as commit 1 (clean layout, mechanical move) |

## Architecture

### File layout after refactor

```
widget/src/
  index.ts                    ← bootstrap; selects renderer based on config.kind
  core/
    config.ts                 ← unchanged
    config-validator.ts       ← unchanged
    renderer.ts               ← NEW: Renderer interface
  services/                   ← unchanged (messaging, session, retry)
  theming/                    ← unchanged (css-variables, theme-manager, css-injector)
  utils/                      ← unchanged (file-type-detector, link-detector, etc.)
  renderers/
    chat/
      chat-renderer.ts        ← implements Renderer; wraps today's logic
      normal-renderer.ts      ← MOVED from core/
      portal-renderer.ts      ← MOVED from core/
      ui/                     ← MOVED from widget/src/ui/
    display/
      display-renderer.ts     ← NEW: implements Renderer
      sidebar.ts              ← NEW: sidebar shell + state machine
      doc-list.ts             ← NEW: list of DocCards with empty/error states
      doc-card.ts             ← NEW: single clickable card
      styles.ts               ← NEW: CSS string injected by the renderer
```

### Renderer interface

```ts
// widget/src/core/renderer.ts
export interface Renderer {
  mount(runtimeConfig: WidgetRuntimeConfig, container: HTMLElement): Promise<void>;
  dispose(): void;
}
```

`index.ts` reads `config.kind` from the fetched config (`'chat'` default, `'display'` new) and instantiates either `new ChatRenderer()` or `new DisplayRenderer()`. The renderer owns its own DOM, lifecycle, and event listeners. `dispose()` removes all DOM nodes and cancels any pending fetch.

### Bundle and serving

One bundle, one URL pattern. `/w/[widgetKey].js` continues to serve the same IIFE regardless of widget kind. The kind discriminator lives in the config payload returned from `/w/[widgetKey]/config`. No new build target, no new endpoint.

## Data model

### Schema change

One column added to `widgets`:

```ts
kind: varchar('kind', { length: 20 }).notNull().default('chat'),
```

`widgetType` (`'n8n' | 'chatkit'`) remains as the provider discriminator. `embedType` (`'popup' | 'inline' | 'fullpage' | 'portal'`) remains as the embed shape for chat widgets. `kind` is a new orthogonal axis.

Existing rows backfill to `'chat'` via the default. No data migration script needed.

### Config shape for `kind: 'display'`

```ts
{
  kind: 'display',
  branding: {
    companyName: string,
    logoUrl: string | null,
    brandingEnabled: boolean      // tier-gated, same logic as chat
  },
  theme: {
    colorScheme: 'light' | 'dark' | 'auto',
    radius: 'none' | 'small' | 'medium' | 'large' | 'pill',
    density: 'compact' | 'normal' | 'spacious',
    color: {
      accent: string,             // hex
      surface: string,            // hex
      text: string,               // hex
      subText: string,            // hex
      border: string              // hex
    }
  },
  display: {
    position: 'right' | 'left',
    defaultOpen: boolean,
    header: {
      title: string,              // e.g. "Required documents"
      showCount: boolean
    },
    emptyMessage: string          // shown when n8n returns []
  },
  connection: {
    provider: 'n8n',
    webhookUrl: string,
    triggerMessage: string,       // default chatInput
    captureContext: boolean,      // default true
    customContext: Record<string, unknown>
  }
}
```

**Dropped from chat config (irrelevant for display):** `features.fileAttachmentsEnabled`, `composer.*`, `startScreen.*`, `agentKit.*`, `branding.firstMessage`, `branding.welcomeText`, `branding.launcherIcon`, `branding.inputPlaceholder`, `branding.customLauncherIconUrl`.

### Validation

New file `lib/validation/display-widget-schema.ts` exports `displayWidgetConfigSchema`. The existing `lib/validation/widget-schema.ts` is kept as-is — its current export is renamed internally to `chatWidgetConfigSchema` and a new aggregator export is added in the same file:

```ts
// lib/validation/widget-schema.ts
export const chatWidgetConfigSchema = /* current exported schema */;

import { displayWidgetConfigSchema } from './display-widget-schema';

export const widgetConfigSchema = z.discriminatedUnion('kind', [
  chatWidgetConfigSchema.extend({ kind: z.literal('chat') }),
  displayWidgetConfigSchema.extend({ kind: z.literal('display') }),
]);
```

Chat schema content is unchanged. API routes that accept widget config (`POST /api/widgets`, `PATCH /api/widgets/[id]`) validate against `widgetConfigSchema`.

### Config endpoint

`app/api/w/[widgetKey]/config/route.ts` currently calls `translateConfig` (chat). Add a sibling `translateDisplayConfig` and dispatch:

```ts
const translated = widget.kind === 'display'
  ? translateDisplayConfig(widget.config, request.url)
  : translateConfig(widget.config, request.url);
```

Existing chat callers are untouched.

## Runtime flow

### Auto-fire sequence

1. **Bootstrap** — host page loads `<script src="/w/abc123.js">`. `index.ts` reads `widgetKey`, fetches `/w/abc123/config`.
2. **Renderer selection** — config returns `{ kind: 'display', ... }`. `index.ts` instantiates `new DisplayRenderer()`.
3. **Container resolution** — if `<script data-container="docs-here">`, mount inside `#docs-here`. Otherwise mount to `document.body` (default for floating placement).
4. **Mount** — `DisplayRenderer.mount()`:
   - Injects CSS via existing `theming/css-injector.ts`.
   - Builds sidebar DOM in the loading state (3 skeleton rows).
   - Initiates the relay fetch.
5. **Relay call** — uses `services/messaging/message-sender.ts` unchanged. Payload:
   ```ts
   {
     widgetId,
     licenseKey,
     message: window.ChatWidgetConfig?.message
              ?? config.connection.triggerMessage
              ?? '',
     chatInput: <same as message>,
     sessionId: <generated/persisted same as chat>,
     context: capturePageContext(),
     customContext: window.ChatWidgetConfig?.customContext
                    ?? config.connection.customContext,
     metadata: { tier: <from injected flags> }
   }
   ```
   Identical shape to the chat widget. Relay endpoint, license validation, domain whitelisting, and rate limiting are unchanged.
6. **Response handling** — relay returns the n8n JSON. Expected shape:
   ```ts
   { documents: Array<{ title: string; url: string }> }
   ```
   - Valid non-empty array → render a `DocCard` for each item.
   - Valid empty array → render `display.emptyMessage`.
   - Malformed or missing `documents` → render error state with a retry button.
7. **DocCard click** — each card is an `<a href={url} target="_blank" rel="noopener noreferrer">`. New tab; no lightbox.

### Session

`sessionId` persists in `localStorage` using the existing key. If a host page embeds both a chat widget and a display widget tied to the same user, they share a session — n8n sees the same `sessionId` for both. This is intentional; "session" represents the user, not the surface.

### Lifecycle

- `dispose()` removes the sidebar DOM, clears CSS, and cancels any in-flight fetch via the `AbortController` already used in `message-sender.ts`.
- The renderer does not re-fire on URL change in v1. Host pages that need that behavior can manually call a future exposed `widget.refresh()` method (out of scope).

## Sidebar component

### DOM structure

```
.cw-display-sidebar              ← fixed right edge, 320px, full height
  .cw-display-header
    .cw-display-title            ← e.g. "Required documents"
    .cw-display-count            ← badge, e.g. "3"
    .cw-display-collapse-btn     ← chevron, aria-expanded
  .cw-display-body               ← scrollable
    .cw-display-list             ← ul of DocCards or empty/error
  .cw-display-footer             ← "Powered by ..." (gated)
```

### States

| State | Content |
|---|---|
| Loading | 3 skeleton rows (animated shimmer), `aria-busy="true"` |
| Success (≥1 doc) | Header with count + DocCard list |
| Success (empty) | Header with count=0 + `emptyMessage` |
| Error | Header + inline error text + retry button |
| Collapsed | 32px vertical strip with count badge; click expands |

### Defaults

- Position: `right` (configurable)
- Width: 320px (hardcoded for v1)
- Default open state on first load: per `defaultOpen` config (default `true`)
- User collapse choice persists in `localStorage` per `widgetKey`
- Header height: 48px
- Card height: 56px (36×36 icon + 2 lines of title)

### Mobile (<768px)

Sidebar becomes a bottom sheet — fixed to bottom edge, ~40vh tall, drag handle to expand/collapse. Same component, different CSS via media query. No separate mobile code path.

### Accessibility

- Sidebar: `role="complementary"`, `aria-label="Related documents"`.
- DocCard: `<a href>` element so keyboard nav, right-click → open in new tab, and screen readers work for free.
- Collapse button: `<button>` with `aria-expanded` toggled.
- Loading skeleton: `aria-busy="true"` on the body.
- All interactive elements meet WCAG AA contrast against the surface (validated through the existing theme system).

### Theming

Uses the existing CSS-variables system. `--cw-color-surface`, `--cw-color-text`, `--cw-color-accent`, `--cw-radius-card`, etc., are generated by `theming/css-variables.ts` from the same theme config. The sidebar inherits brand colors automatically; no parallel theming code.

## Configurator

### Entry point

`app/configurator/page.tsx` becomes a 3-card picker:

- **n8n Chat Widget** → `/configurator/n8n` (existing)
- **n8n Document Display** → `/configurator/n8n-display` (new)
- **ChatKit Chat Widget** → `/configurator/chatkit` (existing)

### Sections on `/configurator/n8n-display`

| Section | Fields |
|---|---|
| Identity | Widget name |
| Connection | Webhook URL, default `triggerMessage`, capture-context toggle |
| Display | Title text, position (right/left), `defaultOpen`, `emptyMessage` |
| Theme | Color scheme, accent color, surface color, text color, radius, density |
| Branding | Company name, logo URL, "Powered by" toggle (tier-gated) |

~5 sections, ~15 fields. The Theme and Branding sections are extracted into reusable components in `components/configurator/sections/` and imported by both configurators. The chat configurator keeps its chat-specific sections (composer, start screen, prompts, features) unchanged.

### Live preview pane

The right pane mounts an actual `DisplayRenderer` against the in-progress config inside a constrained preview container (an iframe or sandboxed div, mirroring how the chat configurator previews chat widgets today). The preview is driven by `stores/preview-store.ts` so config changes in the left pane update the preview in real time.

### State management

`stores/widget-store.ts` holds widget config as a discriminated shape on `kind`. The display path uses the same store. `stores/preview-store.ts` renders the appropriate renderer in the preview pane based on `kind`.

### Embed code modal

`components/configurator/code-modal.tsx` produces the same `<script>` snippet for display widgets as for chat widgets — the embed script is shape-identical because the bundle reads `kind` from the fetched config, not script attributes. Optional support for `data-container="..."` to constrain placement.

## Testing

| Layer | Coverage | Location |
|---|---|---|
| Unit | `DisplayRenderer.mount()` happy path | `tests/widget/renderers/display-renderer.test.ts` |
| Unit | Response parsing: valid array, empty array, malformed, non-array | same file |
| Unit | Sidebar state transitions: loading → success, loading → error, collapse persistence | `tests/widget/ui/sidebar.test.ts` |
| Unit | `chatInput` resolution order: window → config → empty | `tests/widget/services/auto-trigger.test.ts` |
| Unit | Zod validation: display schema accepts valid configs, rejects chat-only fields | `tests/unit/validation/display-widget-schema.test.ts` |
| Integration | `POST /api/widgets` with `kind: 'display'` persists correctly | `tests/integration/api/widgets-display.test.ts` |
| Integration | `GET /w/[key]/config` returns translated display config | same file |
| Integration | Chat-relay payload from display widget is shape-identical to chat widget | `tests/integration/api/chat-relay-display.test.ts` |

Explicitly **not** in v1: visual regression on the sidebar (no snapshot or Playwright), full configurator E2E.

## Rollout

Three commits, mergeable in order, each shippable independently.

### Commit 1: Refactor (no behavior change)

Extract `widget/src/core/widget.ts` and `widget/src/ui/` into `widget/src/renderers/chat/`. Define the `Renderer` interface. `index.ts` updates to instantiate `ChatRenderer` (the only renderer at this point). All existing chat widget tests pass unchanged. The bundle output is byte-different but behavior-identical.

### Commit 2: Display kind + bundle support (no configurator UI)

- Drizzle migration adding `kind` column.
- `displayWidgetConfigSchema` + discriminated union at API boundary.
- `translateDisplayConfig` in the config endpoint.
- `DisplayRenderer`, `sidebar.ts`, `doc-list.ts`, `doc-card.ts`, `styles.ts`.
- `index.ts` updates to dispatch on `config.kind`.
- Display widgets can be created via direct API call but not yet through the UI.

### Commit 3: Configurator UI

- `/configurator/page.tsx` becomes a 3-card picker.
- `/configurator/n8n-display/page.tsx`.
- Extracted `theme-section.tsx` and `branding-section.tsx` shared components.
- New `display-section.tsx`.
- New `display-preview.tsx` (live preview pane).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Refactor regresses chat widget | Commit 1 is a mechanical move with no logic changes. Existing chat tests run unchanged. PR reviewer can verify by diffing for moved files only. |
| Floating sidebar overlaps host page UI | Document the `data-container="..."` escape hatch; default placement (`body`) is fine for most sites. |
| Session-sharing across kinds | Documented as intentional. Same user across chat and display widgets on the same domain shares a `sessionId`. |
| Tier gating | "Powered by" branding follows the same rule as chat — no new tier work. |
| CORS / domain validation | Reuses existing relay validation. No new exposure. |

## Open questions

None at spec time. All blocking decisions are locked above.

## Out of scope (deferred)

- Re-fire on URL change (SPAs)
- Manual refresh button in the sidebar
- Document categories / collapsible groups
- Descriptions, dates, or thumbnails on cards
- Inline preview / lightbox for clicked documents
- Analytics events for document clicks
- Templating language for `triggerMessage`
- Multiple display widgets per page (one per page in v1; not enforced, but untested)

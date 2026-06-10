# Document Display Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second widget kind — a floating-sidebar document display widget that auto-fires on page load, calls n8n via the existing chat-relay, and renders `{documents: [{title, url}]}` as a clickable list.

**Architecture:** Shared core, separate renderer. Define a `Renderer` interface; wrap today's `createChatWidget()` in a `ChatRenderer` class; add a sibling `DisplayRenderer` that mounts a sidebar. Add a `kind` column to `widgets`. Bundle dispatches on `config.kind` returned by the config endpoint. Configurator gets a new sibling page at `/configurator/n8n-display`.

**Tech Stack:** Next.js 16 App Router, TypeScript 5 (strict), Drizzle ORM, PostgreSQL, Zod 4, Zustand, Jest 29 + jsdom, esbuild (via `scripts/build-widget-secure.mjs`).

---

## Plan vs. spec note

The spec (Section "Rollout > Commit 1") called for moving `widget/src/widget.ts` and `widget/src/ui/` into `widget/src/renderers/chat/`. This plan **defers physical file relocation** to a future cleanup. Commit 1 here introduces only the `Renderer` interface and a `ChatRenderer` wrapper that calls the existing `createChatWidget()` function from its current location. Net effect: same architectural seam without touching chat-widget files. If file relocation is desired later it can ship as its own no-behavior-change commit. All other aspects of the spec remain in force.

---

## File map

### New files (commit 1)
- `widget/src/core/renderer.ts` — `Renderer` interface
- `widget/src/renderers/chat/chat-renderer.ts` — thin wrapper over `createChatWidget`
- `tests/unit/widget/renderer-interface.test.ts` — Renderer interface contract test
- `tests/unit/widget/chat-renderer.test.ts` — ChatRenderer wrapper test

### New files (commit 2)
- `drizzle/migrations/<timestamp>_add_widget_kind.sql` — adds `kind` column
- `lib/validation/display-widget-schema.ts` — Zod schema for display config
- `lib/widget/translate-display-config.ts` — server-side config translator for display widgets
- `widget/src/renderers/display/display-renderer.ts` — `Renderer` impl
- `widget/src/renderers/display/sidebar.ts` — sidebar shell + state machine
- `widget/src/renderers/display/doc-list.ts` — list rendering with empty/error states
- `widget/src/renderers/display/doc-card.ts` — single clickable card
- `widget/src/renderers/display/styles.ts` — CSS string injected at mount
- `widget/src/renderers/display/types.ts` — display-specific types (config, response, state)
- `widget/src/services/messaging/display-payload.ts` — payload builder for the auto-fire
- `tests/unit/widget/display/display-renderer.test.ts`
- `tests/unit/widget/display/sidebar.test.ts`
- `tests/unit/widget/display/doc-list.test.ts`
- `tests/unit/widget/display/auto-trigger.test.ts`
- `tests/unit/validation/display-widget-schema.test.ts`
- `tests/integration/api/widgets-display.test.ts`
- `tests/integration/api/chat-relay-display.test.ts`

### Modified files (commit 2)
- `lib/db/schema.ts` — add `kind` column
- `lib/validation/widget-schema.ts` — export discriminated union
- `app/api/w/[widgetKey]/config/route.ts` — dispatch on `widget.kind`
- `app/api/widget/[license]/config/route.ts` — same dispatch (legacy endpoint)
- `widget/src/index.ts` — instantiate `DisplayRenderer` when `config.kind === 'display'`
- `widget/src/types.ts` — add `kind` to `WidgetConfig`

### New files (commit 3)
- `components/configurator/sections/theme-section.tsx` — extracted shared component
- `components/configurator/sections/branding-section.tsx` — extracted shared component
- `components/configurator/sections/display-section.tsx` — display-only sidebar/header fields
- `components/configurator/display-preview.tsx` — live preview pane for display widgets
- `app/configurator/n8n-display/page.tsx` — display configurator page
- `tests/unit/components/configurator/display-section.test.tsx`

### Modified files (commit 3)
- `app/configurator/page.tsx` — 3-card picker (Chat / Display / ChatKit)
- `stores/widget-store.ts` — discriminate on `kind`
- `stores/preview-store.ts` — render appropriate renderer based on `kind`

---

## Phase 1 — Renderer abstraction (commit 1)

### Task 1: Define the `Renderer` interface

**Files:**
- Create: `widget/src/core/renderer.ts`
- Test: `tests/unit/widget/renderer-interface.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/renderer-interface.test.ts
import type { Renderer } from '@/../widget/src/core/renderer';

describe('Renderer interface', () => {
  it('requires mount and dispose methods', () => {
    const stub: Renderer = {
      mount: async () => {},
      dispose: () => {},
    };
    expect(typeof stub.mount).toBe('function');
    expect(typeof stub.dispose).toBe('function');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/renderer-interface.test.ts`
Expected: FAIL with module-not-found on `widget/src/core/renderer`.

- [ ] **Step 3: Create the interface**

```ts
// widget/src/core/renderer.ts
import type { WidgetRuntimeConfig } from '../types';

/**
 * A Renderer owns a widget's DOM, lifecycle, and event listeners.
 * One instance is created per widget mount; dispose() must remove everything.
 */
export interface Renderer {
  mount(runtimeConfig: WidgetRuntimeConfig, container: HTMLElement): Promise<void>;
  dispose(): void;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/renderer-interface.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add widget/src/core/renderer.ts tests/unit/widget/renderer-interface.test.ts
git commit -m "feat(widget): add Renderer interface for multi-kind widget support"
```

---

### Task 2: ChatRenderer wrapper

**Files:**
- Create: `widget/src/renderers/chat/chat-renderer.ts`
- Test: `tests/unit/widget/chat-renderer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/chat-renderer.test.ts
/**
 * @jest-environment jsdom
 */
import { ChatRenderer } from '@/../widget/src/renderers/chat/chat-renderer';

jest.mock('@/../widget/src/widget', () => ({
  createChatWidget: jest.fn(),
}));

import { createChatWidget } from '@/../widget/src/widget';

describe('ChatRenderer', () => {
  beforeEach(() => {
    (createChatWidget as jest.Mock).mockClear();
  });

  it('forwards mount() to createChatWidget with the runtime config', async () => {
    const renderer = new ChatRenderer();
    const config = {
      uiConfig: { branding: { companyName: 'X' } },
      relay: { relayUrl: 'http://r', widgetId: 'w', licenseKey: 'k' },
      display: { mode: 'popup' as const },
    } as any;
    const container = document.createElement('div');

    await renderer.mount(config, container);

    expect(createChatWidget).toHaveBeenCalledTimes(1);
    expect(createChatWidget).toHaveBeenCalledWith(config);
  });

  it('dispose() is a no-op for v1 (chat lifecycle is owned by createChatWidget)', () => {
    const renderer = new ChatRenderer();
    expect(() => renderer.dispose()).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/chat-renderer.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the wrapper**

```ts
// widget/src/renderers/chat/chat-renderer.ts
import type { Renderer } from '../../core/renderer';
import type { WidgetRuntimeConfig } from '../../types';
import { createChatWidget } from '../../widget';

/**
 * Wraps the existing createChatWidget() entry point as a Renderer.
 * Behavior is identical to calling createChatWidget directly; this class
 * exists so the bootstrap can dispatch on widget kind through a uniform interface.
 */
export class ChatRenderer implements Renderer {
  async mount(runtimeConfig: WidgetRuntimeConfig, _container: HTMLElement): Promise<void> {
    createChatWidget(runtimeConfig);
  }

  dispose(): void {
    // The chat widget owns its own lifecycle internally; no-op for v1.
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/chat-renderer.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add widget/src/renderers/chat/chat-renderer.ts tests/unit/widget/chat-renderer.test.ts
git commit -m "feat(widget): wrap createChatWidget in ChatRenderer"
```

---

### Task 3: Wire `index.ts` through ChatRenderer (behavior-preserving)

**Files:**
- Modify: `widget/src/index.ts`
- (no test file — covered by the existing chat E2E)

- [ ] **Step 1: Run the existing chat E2E tests to capture green baseline**

Run: `pnpm test tests/e2e/widget-embed-flow.test.ts tests/e2e/embed-critical-path.test.ts`
Expected: PASS (record any flakes before changing code).

- [ ] **Step 2: Replace the direct `createChatWidget()` call in `index.ts`**

In `widget/src/index.ts`, find the **two** call sites of `createChatWidget(...)` (legacy fast-path around line 67 and post-fetch path around line 153) and replace them. Add the import at the top of the file:

```ts
// widget/src/index.ts (top of file)
import { ChatRenderer } from './renderers/chat/chat-renderer';
```

Replace the legacy fast-path call (currently around line 67):

```ts
// Before:
createChatWidget({
  ...(injectedConfig as WidgetRuntimeConfig),
  display: displayConfig,
});

// After:
await new ChatRenderer().mount(
  { ...(injectedConfig as WidgetRuntimeConfig), display: displayConfig },
  document.body
);
```

Replace the post-fetch call (currently around line 153):

```ts
// Before:
createChatWidget(runtimeConfig);

// After:
await new ChatRenderer().mount(runtimeConfig, document.body);
```

Remove the now-unused top-level import of `createChatWidget` from `./widget`:

```ts
// Delete this line near the top of index.ts:
import { createChatWidget } from './widget';
```

- [ ] **Step 3: Build the widget bundle**

Run: `pnpm build:widget`
Expected: bundle builds successfully; output line `[build:widget] Wrote hardened bundle to .../chat-widget.iife.js`.

- [ ] **Step 4: Re-run chat tests, type-check, and lint**

Run: `pnpm test && pnpm type-check && pnpm lint`
Expected: PASS across the board. If any chat test fails, investigate before continuing — the wrapper should be behaviorally transparent.

- [ ] **Step 5: Manual smoke test of chat widget**

Run dev server in one terminal: `pnpm dev`
In a browser, open `http://localhost:3000/demo` and confirm:
1. Chat bubble appears.
2. Clicking it opens the chat window.
3. Sending a message hits the relay (network tab shows POST to `/api/chat-relay`).
4. Response renders in the message list.

- [ ] **Step 6: Commit**

```bash
git add widget/src/index.ts public/widget/chat-widget.iife.js
git commit -m "refactor(widget): route bootstrap through ChatRenderer wrapper"
```

---

## Phase 2 — Display kind backend + runtime (commit 2)

### Task 4: Drizzle migration adding `kind` column

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/migrations/<timestamp>_add_widget_kind.sql` (generated)

- [ ] **Step 1: Add the column to the schema**

Open `lib/db/schema.ts` and locate the `widgets` table definition. Add the `kind` column alongside the other columns:

```ts
// in lib/db/schema.ts, inside pgTable('widgets', {...})
kind: varchar('kind', { length: 20 }).notNull().default('chat'),
```

Place it near `widgetType` for readability.

- [ ] **Step 2: Generate the migration**

Run: `pnpm db:generate`
Expected: a new SQL file appears under `drizzle/migrations/` adding `kind` with default `'chat'`.

- [ ] **Step 3: Inspect the generated SQL**

Read the new migration file and verify it contains exactly:
```sql
ALTER TABLE "widgets" ADD COLUMN "kind" varchar(20) DEFAULT 'chat' NOT NULL;
```
If Drizzle generated anything else (e.g., dropped columns), STOP and investigate.

- [ ] **Step 4: Push the migration to your dev database**

Run: `pnpm db:push`
Expected: schema applied without error. Confirm with `pnpm db:studio` or a quick query: `SELECT id, kind FROM widgets LIMIT 5;` — every row should show `kind='chat'`.

- [ ] **Step 5: Commit**

```bash
git add lib/db/schema.ts drizzle/migrations/
git commit -m "feat(db): add kind column to widgets for display widget support"
```

---

### Task 5: Display widget Zod schema

**Files:**
- Create: `lib/validation/display-widget-schema.ts`
- Test: `tests/unit/validation/display-widget-schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/validation/display-widget-schema.test.ts
import { displayWidgetConfigSchema } from '@/lib/validation/display-widget-schema';

describe('displayWidgetConfigSchema', () => {
  const valid = {
    branding: { companyName: 'Acme', logoUrl: null, brandingEnabled: true },
    theme: {
      colorScheme: 'light',
      radius: 'medium',
      density: 'normal',
      color: {
        accent: '#0066FF',
        surface: '#FFFFFF',
        text: '#111111',
        subText: '#666666',
        border: '#E5E7EB',
      },
    },
    display: {
      position: 'right',
      defaultOpen: true,
      header: { title: 'Required documents', showCount: true },
      emptyMessage: 'No documents available.',
    },
    connection: {
      provider: 'n8n',
      webhookUrl: 'https://example.com/webhook',
      triggerMessage: 'List required documents.',
      captureContext: true,
      customContext: {},
    },
  };

  it('accepts a valid display config', () => {
    expect(displayWidgetConfigSchema.parse(valid)).toEqual(valid);
  });

  it('rejects an invalid color', () => {
    const bad = { ...valid, theme: { ...valid.theme, color: { ...valid.theme.color, accent: 'not-a-hex' } } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects a non-https webhook URL', () => {
    const bad = { ...valid, connection: { ...valid.connection, webhookUrl: 'http://insecure' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects an unknown position value', () => {
    const bad = { ...valid, display: { ...valid.display, position: 'top' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });

  it('rejects an unknown provider', () => {
    const bad = { ...valid, connection: { ...valid.connection, provider: 'chatkit' } };
    expect(() => displayWidgetConfigSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/validation/display-widget-schema.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the schema**

```ts
// lib/validation/display-widget-schema.ts
import { z } from 'zod';

const hexColor = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'must be a hex color');
const httpsUrl = z.string().url().refine((u) => u.startsWith('https://'), 'must be https://');
const optionalHttpsUrl = z.union([httpsUrl, z.null()]);

const brandingSchema = z.object({
  companyName: z.string().min(1).max(100),
  logoUrl: optionalHttpsUrl,
  brandingEnabled: z.boolean(),
});

const themeSchema = z.object({
  colorScheme: z.enum(['light', 'dark', 'auto']),
  radius: z.enum(['none', 'small', 'medium', 'large', 'pill']),
  density: z.enum(['compact', 'normal', 'spacious']),
  color: z.object({
    accent: hexColor,
    surface: hexColor,
    text: hexColor,
    subText: hexColor,
    border: hexColor,
  }),
});

const displaySchema = z.object({
  position: z.enum(['right', 'left']),
  defaultOpen: z.boolean(),
  header: z.object({
    title: z.string().min(1).max(80),
    showCount: z.boolean(),
  }),
  emptyMessage: z.string().min(1).max(200),
});

const connectionSchema = z.object({
  provider: z.literal('n8n'),
  webhookUrl: httpsUrl,
  triggerMessage: z.string().max(500),
  captureContext: z.boolean(),
  customContext: z.record(z.string(), z.unknown()),
});

export const displayWidgetConfigSchema = z.object({
  branding: brandingSchema,
  theme: themeSchema,
  display: displaySchema,
  connection: connectionSchema,
});

export type DisplayWidgetConfig = z.infer<typeof displayWidgetConfigSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/validation/display-widget-schema.test.ts`
Expected: all 5 assertions PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/validation/display-widget-schema.ts tests/unit/validation/display-widget-schema.test.ts
git commit -m "feat(validation): add display widget config schema"
```

---

### Task 6: Discriminated union at the API boundary

**Files:**
- Modify: `lib/validation/widget-schema.ts`

- [ ] **Step 1: Read the current widget schema and confirm the exported name**

Open `lib/validation/widget-schema.ts`. Note the exported schema name (likely `widgetConfigSchema` or `widgetSchema`). Below we call the existing schema `chatWidgetConfigSchema` and add a new exported discriminated union also named `widgetConfigSchema`. Adjust the rename if the existing name is different.

- [ ] **Step 2: Update the schema file**

At the top of `lib/validation/widget-schema.ts`, add:

```ts
import { displayWidgetConfigSchema } from './display-widget-schema';
```

Rename the existing exported schema (the one that validates chat widgets) so its identifier becomes `chatWidgetConfigSchema`. If it was previously exported as `widgetConfigSchema`, leave a back-compat re-export so existing imports still resolve. At the bottom of the file, add:

```ts
import { z } from 'zod';

export const widgetConfigSchema = z.discriminatedUnion('kind', [
  chatWidgetConfigSchema.extend({ kind: z.literal('chat').default('chat') }),
  displayWidgetConfigSchema.extend({ kind: z.literal('display') }),
]);

export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: PASS. If any consumer broke (because they imported the old name), fix the import.

- [ ] **Step 4: Run all unit tests**

Run: `pnpm test tests/unit/validation/`
Expected: PASS — the chat schema is unchanged in semantics.

- [ ] **Step 5: Commit**

```bash
git add lib/validation/widget-schema.ts
git commit -m "feat(validation): add discriminated union for chat | display widgets"
```

---

### Task 7: Server-side translator for display configs

**Files:**
- Create: `lib/widget/translate-display-config.ts`
- Test: `tests/unit/widget/translate-display-config.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/translate-display-config.test.ts
import { translateDisplayConfig } from '@/lib/widget/translate-display-config';

describe('translateDisplayConfig', () => {
  const dbConfig = {
    kind: 'display',
    branding: { companyName: 'Acme', logoUrl: null, brandingEnabled: true },
    theme: {
      colorScheme: 'light',
      radius: 'medium',
      density: 'normal',
      color: { accent: '#0066FF', surface: '#FFFFFF', text: '#111', subText: '#666', border: '#E5E7EB' },
    },
    display: {
      position: 'right',
      defaultOpen: true,
      header: { title: 'Related docs', showCount: true },
      emptyMessage: 'Nothing here yet.',
    },
    connection: {
      provider: 'n8n',
      webhookUrl: 'https://n8n.example.com/webhook/abc',
      triggerMessage: 'Find docs',
      captureContext: true,
      customContext: { region: 'us' },
    },
  };

  it('returns the config with kind=display preserved', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.kind).toBe('display');
  });

  it('strips the webhookUrl from the client-facing config', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect((out as any).connection?.webhookUrl).toBeUndefined();
  });

  it('exposes the relay endpoint derived from the request URL', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.connection.relayEndpoint).toBe('https://app.example.com/api/chat-relay');
  });

  it('preserves triggerMessage and customContext', () => {
    const out = translateDisplayConfig(dbConfig, 'https://app.example.com/w/abc/config');
    expect(out.connection.triggerMessage).toBe('Find docs');
    expect(out.connection.customContext).toEqual({ region: 'us' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/translate-display-config.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the translator**

```ts
// lib/widget/translate-display-config.ts

/**
 * Translates a stored display-widget config (DB row) into the shape the client bundle expects.
 * Strips secrets (webhookUrl stays server-side) and injects the relay endpoint derived from
 * the request URL.
 */
export function translateDisplayConfig(dbConfig: any, requestUrl: string) {
  const origin = new URL(requestUrl).origin;
  return {
    kind: 'display' as const,
    branding: dbConfig.branding,
    theme: dbConfig.theme,
    display: dbConfig.display,
    connection: {
      provider: 'n8n' as const,
      relayEndpoint: `${origin}/api/chat-relay`,
      triggerMessage: dbConfig.connection?.triggerMessage ?? '',
      captureContext: dbConfig.connection?.captureContext ?? true,
      customContext: dbConfig.connection?.customContext ?? {},
    },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/translate-display-config.test.ts`
Expected: all 4 assertions PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/widget/translate-display-config.ts tests/unit/widget/translate-display-config.test.ts
git commit -m "feat(widget): add server-side translator for display widget configs"
```

---

### Task 8: Config endpoint dispatch on `widget.kind`

**Files:**
- Modify: `app/api/w/[widgetKey]/config/route.ts`
- Modify: `app/api/widget/[license]/config/route.ts`

- [ ] **Step 1: Run the existing config-endpoint tests to capture baseline**

Run: `pnpm test tests/unit/widget/`
Expected: PASS. Record any pre-existing failures.

- [ ] **Step 2: Update the v2 config endpoint**

Open `app/api/w/[widgetKey]/config/route.ts`. Locate the line that calls the existing `translateConfig(widget.config, request.url)`. Replace with a kind-based dispatch:

```ts
// Add this import near the top:
import { translateDisplayConfig } from '@/lib/widget/translate-display-config';
```

```ts
// Replace the translateConfig(...) call:
const translated =
  widget.kind === 'display'
    ? translateDisplayConfig(widget.config, request.url)
    : translateConfig(widget.config, request.url);
```

- [ ] **Step 3: Update the legacy config endpoint identically**

Apply the same change in `app/api/widget/[license]/config/route.ts`. Note: legacy widgets are loaded by license key, not widget key — the property on the loaded row may be on a joined widget record. Confirm by reading the surrounding code, then dispatch on `widget.kind` the same way.

- [ ] **Step 4: Re-run config-endpoint tests**

Run: `pnpm test tests/unit/widget/`
Expected: PASS — all existing chat-config-endpoint tests pass because `kind` defaults to `'chat'` and the original `translateConfig` path is unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/api/w/[widgetKey]/config/route.ts app/api/widget/[license]/config/route.ts
git commit -m "feat(api): dispatch config endpoint on widget kind"
```

---

### Task 9: Auto-fire payload builder

**Files:**
- Create: `widget/src/services/messaging/display-payload.ts`
- Test: `tests/unit/widget/display/auto-trigger.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/display/auto-trigger.test.ts
/**
 * @jest-environment jsdom
 */
import { resolveTriggerMessage, buildDisplayPayload } from '@/../widget/src/services/messaging/display-payload';

describe('resolveTriggerMessage', () => {
  afterEach(() => {
    (window as any).ChatWidgetConfig = undefined;
  });

  it('prefers window.ChatWidgetConfig.message when set', () => {
    (window as any).ChatWidgetConfig = { message: 'from window' };
    expect(resolveTriggerMessage('from config')).toBe('from window');
  });

  it('falls back to configDefault when window value is missing', () => {
    expect(resolveTriggerMessage('from config')).toBe('from config');
  });

  it('returns empty string when neither is set', () => {
    expect(resolveTriggerMessage(undefined)).toBe('');
  });

  it('ignores window.ChatWidgetConfig.message that is not a string', () => {
    (window as any).ChatWidgetConfig = { message: 42 };
    expect(resolveTriggerMessage('from config')).toBe('from config');
  });
});

describe('buildDisplayPayload', () => {
  it('builds the same shape as chat: widgetId, licenseKey, message, chatInput, sessionId, context, customContext, metadata', () => {
    const payload = buildDisplayPayload({
      widgetId: 'w1',
      licenseKey: 'k1',
      message: 'List docs',
      sessionId: 's1',
      context: { pageUrl: 'https://x', pagePath: '/', pageTitle: 't', queryParams: {}, domain: 'x' },
      customContext: { region: 'us' },
      tier: 'basic',
    });
    expect(payload).toEqual({
      widgetId: 'w1',
      licenseKey: 'k1',
      message: 'List docs',
      chatInput: 'List docs',
      sessionId: 's1',
      context: { pageUrl: 'https://x', pagePath: '/', pageTitle: 't', queryParams: {}, domain: 'x' },
      customContext: { region: 'us' },
      metadata: { tier: 'basic' },
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/display/auto-trigger.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the builder**

```ts
// widget/src/services/messaging/display-payload.ts

export function resolveTriggerMessage(configDefault: string | undefined): string {
  const winValue = (typeof window !== 'undefined' ? (window as any).ChatWidgetConfig?.message : undefined);
  if (typeof winValue === 'string' && winValue.length > 0) return winValue;
  return configDefault ?? '';
}

export interface DisplayPayloadInput {
  widgetId: string;
  licenseKey: string;
  message: string;
  sessionId: string;
  context: Record<string, unknown>;
  customContext: Record<string, unknown>;
  tier: string;
}

export function buildDisplayPayload(input: DisplayPayloadInput) {
  return {
    widgetId: input.widgetId,
    licenseKey: input.licenseKey,
    message: input.message,
    chatInput: input.message,
    sessionId: input.sessionId,
    context: input.context,
    customContext: input.customContext,
    metadata: { tier: input.tier },
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/display/auto-trigger.test.ts`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add widget/src/services/messaging/display-payload.ts tests/unit/widget/display/auto-trigger.test.ts
git commit -m "feat(widget): add display widget auto-trigger payload builder"
```

---

### Task 10: DocCard component

**Files:**
- Create: `widget/src/renderers/display/doc-card.ts`
- Create: `widget/src/renderers/display/types.ts`
- Test: `tests/unit/widget/display/doc-card.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/display/doc-card.test.ts
/**
 * @jest-environment jsdom
 */
import { createDocCard } from '@/../widget/src/renderers/display/doc-card';

describe('createDocCard', () => {
  it('renders an anchor with target=_blank and rel=noopener noreferrer', () => {
    const el = createDocCard({ title: 'Onboarding Guide', url: 'https://example.com/onboarding.pdf' });
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('https://example.com/onboarding.pdf');
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders the title text', () => {
    const el = createDocCard({ title: 'Onboarding Guide', url: 'https://example.com/o.pdf' });
    expect(el.textContent).toContain('Onboarding Guide');
  });

  it('sanitizes the title (no script injection)', () => {
    const el = createDocCard({ title: '<script>alert(1)</script>Onboarding', url: 'https://example.com/x.pdf' });
    expect(el.querySelector('script')).toBeNull();
    expect(el.textContent).toContain('Onboarding');
  });

  it('uses the file-type detector to set a data-filetype attribute', () => {
    const el = createDocCard({ title: 'X', url: 'https://example.com/file.pdf' });
    expect(el.getAttribute('data-filetype')?.toLowerCase()).toContain('pdf');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/display/doc-card.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Add the types module**

```ts
// widget/src/renderers/display/types.ts
export interface DisplayDocument {
  title: string;
  url: string;
}

export interface DisplayResponse {
  documents: DisplayDocument[];
}

export type DisplayRendererState =
  | { kind: 'loading' }
  | { kind: 'success'; documents: DisplayDocument[] }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };
```

- [ ] **Step 4: Implement the doc card**

```ts
// widget/src/renderers/display/doc-card.ts
import { detectFileType } from '../../utils/file-type-detector';
import type { DisplayDocument } from './types';

export function createDocCard(doc: DisplayDocument): HTMLAnchorElement {
  const info = detectFileType(doc.url);

  const a = document.createElement('a');
  a.className = 'cw-display-card';
  a.href = doc.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('data-filetype', info.icon ?? 'DOC');

  const icon = document.createElement('span');
  icon.className = 'cw-display-card-icon';
  icon.style.backgroundColor = info.iconColor ?? '#6b7280';
  icon.textContent = (info.icon ?? 'DOC').slice(0, 3);

  const title = document.createElement('span');
  title.className = 'cw-display-card-title';
  title.textContent = doc.title; // textContent sanitizes — no innerHTML

  a.appendChild(icon);
  a.appendChild(title);
  return a;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/display/doc-card.test.ts`
Expected: PASS (4 assertions).

- [ ] **Step 6: Commit**

```bash
git add widget/src/renderers/display/doc-card.ts widget/src/renderers/display/types.ts tests/unit/widget/display/doc-card.test.ts
git commit -m "feat(widget): add DocCard component for display widget"
```

---

### Task 11: DocList with empty/error states

**Files:**
- Create: `widget/src/renderers/display/doc-list.ts`
- Test: `tests/unit/widget/display/doc-list.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/display/doc-list.test.ts
/**
 * @jest-environment jsdom
 */
import { renderDocList } from '@/../widget/src/renderers/display/doc-list';

describe('renderDocList', () => {
  const container = () => document.createElement('div');

  it('renders one card per document', () => {
    const el = container();
    renderDocList(el, {
      kind: 'success',
      documents: [
        { title: 'A', url: 'https://x/a.pdf' },
        { title: 'B', url: 'https://x/b.docx' },
      ],
    }, { emptyMessage: 'No docs', onRetry: () => {} });
    expect(el.querySelectorAll('.cw-display-card').length).toBe(2);
  });

  it('renders the empty message for empty state', () => {
    const el = container();
    renderDocList(el, { kind: 'empty' }, { emptyMessage: 'Nothing here yet.', onRetry: () => {} });
    expect(el.textContent).toContain('Nothing here yet.');
    expect(el.querySelector('.cw-display-card')).toBeNull();
  });

  it('renders skeleton rows for loading state', () => {
    const el = container();
    renderDocList(el, { kind: 'loading' }, { emptyMessage: 'N/A', onRetry: () => {} });
    expect(el.querySelectorAll('.cw-display-skeleton').length).toBeGreaterThan(0);
    expect(el.getAttribute('aria-busy')).toBe('true');
  });

  it('renders an error message with a retry button that calls onRetry', () => {
    const el = container();
    const onRetry = jest.fn();
    renderDocList(el, { kind: 'error', message: 'oops' }, { emptyMessage: 'N/A', onRetry });
    expect(el.textContent).toContain('oops');
    const btn = el.querySelector('button.cw-display-retry') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/display/doc-list.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the list**

```ts
// widget/src/renderers/display/doc-list.ts
import { createDocCard } from './doc-card';
import type { DisplayRendererState } from './types';

interface RenderOptions {
  emptyMessage: string;
  onRetry: () => void;
}

export function renderDocList(container: HTMLElement, state: DisplayRendererState, opts: RenderOptions): void {
  container.innerHTML = '';
  container.removeAttribute('aria-busy');

  switch (state.kind) {
    case 'loading': {
      container.setAttribute('aria-busy', 'true');
      for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'cw-display-skeleton';
        container.appendChild(row);
      }
      return;
    }
    case 'success': {
      for (const doc of state.documents) {
        container.appendChild(createDocCard(doc));
      }
      return;
    }
    case 'empty': {
      const msg = document.createElement('div');
      msg.className = 'cw-display-empty';
      msg.textContent = opts.emptyMessage;
      container.appendChild(msg);
      return;
    }
    case 'error': {
      const wrap = document.createElement('div');
      wrap.className = 'cw-display-error';
      const text = document.createElement('p');
      text.textContent = state.message;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'cw-display-retry';
      retry.textContent = 'Retry';
      retry.addEventListener('click', opts.onRetry);
      wrap.appendChild(text);
      wrap.appendChild(retry);
      container.appendChild(wrap);
      return;
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/display/doc-list.test.ts`
Expected: PASS (4 assertions).

- [ ] **Step 5: Commit**

```bash
git add widget/src/renderers/display/doc-list.ts tests/unit/widget/display/doc-list.test.ts
git commit -m "feat(widget): add DocList with loading/success/empty/error states"
```

---

### Task 12: Sidebar shell with collapse + persistence

**Files:**
- Create: `widget/src/renderers/display/sidebar.ts`
- Test: `tests/unit/widget/display/sidebar.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/display/sidebar.test.ts
/**
 * @jest-environment jsdom
 */
import { Sidebar } from '@/../widget/src/renderers/display/sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  it('mounts a sidebar element into the container with the configured title', () => {
    const c = document.createElement('div');
    document.body.appendChild(c);
    const s = new Sidebar({ widgetKey: 'w1', title: 'Required documents', position: 'right', defaultOpen: true });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')).not.toBeNull();
    expect(c.textContent).toContain('Required documents');
  });

  it('starts open when defaultOpen is true and no persisted state exists', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')?.classList.contains('cw-display-collapsed')).toBe(false);
  });

  it('starts collapsed when defaultOpen is false', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: false });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')?.classList.contains('cw-display-collapsed')).toBe(true);
  });

  it('persists user collapse choice in localStorage keyed by widgetKey', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    const btn = c.querySelector('.cw-display-collapse-btn') as HTMLButtonElement;
    btn.click();
    expect(localStorage.getItem('cw-display-collapsed-w1')).toBe('true');
  });

  it('honors persisted state over defaultOpen on subsequent mounts', () => {
    localStorage.setItem('cw-display-collapsed-w1', 'true');
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    expect(c.querySelector('.cw-display-sidebar')?.classList.contains('cw-display-collapsed')).toBe(true);
  });

  it('updates the count badge via updateCount()', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true, showCount: true });
    s.mount(c);
    s.updateCount(7);
    expect(c.querySelector('.cw-display-count')?.textContent).toBe('7');
  });

  it('returns the body element so the renderer can mount the doc list into it', () => {
    const c = document.createElement('div');
    const s = new Sidebar({ widgetKey: 'w1', title: 't', position: 'right', defaultOpen: true });
    s.mount(c);
    const body = s.getBodyElement();
    expect(body.classList.contains('cw-display-body')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/display/sidebar.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the sidebar**

```ts
// widget/src/renderers/display/sidebar.ts

interface SidebarOptions {
  widgetKey: string;
  title: string;
  position: 'left' | 'right';
  defaultOpen: boolean;
  showCount?: boolean;
}

export class Sidebar {
  private root: HTMLElement | null = null;
  private bodyEl: HTMLElement | null = null;
  private countEl: HTMLElement | null = null;
  private collapsed = false;
  private opts: SidebarOptions;

  constructor(opts: SidebarOptions) {
    this.opts = opts;
  }

  mount(container: HTMLElement): void {
    const persisted = this.readPersisted();
    this.collapsed = persisted !== null ? persisted : !this.opts.defaultOpen;

    const root = document.createElement('aside');
    root.className = 'cw-display-sidebar';
    root.setAttribute('role', 'complementary');
    root.setAttribute('aria-label', this.opts.title);
    root.dataset.position = this.opts.position;
    if (this.collapsed) root.classList.add('cw-display-collapsed');

    const header = document.createElement('div');
    header.className = 'cw-display-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'cw-display-title';
    titleEl.textContent = this.opts.title;

    const countEl = document.createElement('span');
    countEl.className = 'cw-display-count';
    if (this.opts.showCount === false) countEl.style.display = 'none';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cw-display-collapse-btn';
    btn.setAttribute('aria-expanded', String(!this.collapsed));
    btn.textContent = this.collapsed ? '›' : '‹';
    btn.addEventListener('click', () => this.toggleCollapsed(btn, root));

    header.appendChild(titleEl);
    header.appendChild(countEl);
    header.appendChild(btn);

    const body = document.createElement('div');
    body.className = 'cw-display-body';

    root.appendChild(header);
    root.appendChild(body);
    container.appendChild(root);

    this.root = root;
    this.bodyEl = body;
    this.countEl = countEl;
  }

  getBodyElement(): HTMLElement {
    if (!this.bodyEl) throw new Error('Sidebar not mounted');
    return this.bodyEl;
  }

  updateCount(n: number): void {
    if (this.countEl) this.countEl.textContent = String(n);
  }

  dispose(): void {
    this.root?.remove();
    this.root = null;
    this.bodyEl = null;
    this.countEl = null;
  }

  private toggleCollapsed(btn: HTMLButtonElement, root: HTMLElement): void {
    this.collapsed = !this.collapsed;
    root.classList.toggle('cw-display-collapsed', this.collapsed);
    btn.setAttribute('aria-expanded', String(!this.collapsed));
    btn.textContent = this.collapsed ? '›' : '‹';
    this.writePersisted();
  }

  private storageKey(): string {
    return `cw-display-collapsed-${this.opts.widgetKey}`;
  }

  private readPersisted(): boolean | null {
    try {
      const v = localStorage.getItem(this.storageKey());
      if (v === 'true') return true;
      if (v === 'false') return false;
      return null;
    } catch {
      return null;
    }
  }

  private writePersisted(): void {
    try {
      localStorage.setItem(this.storageKey(), String(this.collapsed));
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/display/sidebar.test.ts`
Expected: PASS (7 assertions).

- [ ] **Step 5: Commit**

```bash
git add widget/src/renderers/display/sidebar.ts tests/unit/widget/display/sidebar.test.ts
git commit -m "feat(widget): add Sidebar shell with collapse + persistence"
```

---

### Task 13: Sidebar CSS

**Files:**
- Create: `widget/src/renderers/display/styles.ts`

- [ ] **Step 1: Implement the CSS string module**

```ts
// widget/src/renderers/display/styles.ts

/**
 * CSS for the display widget. Uses the existing --cw-* CSS variables generated
 * by theming/css-variables.ts so the sidebar inherits the user's theme.
 */
export const DISPLAY_WIDGET_CSS = `
.cw-display-sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 320px;
  background: var(--cw-color-surface, #ffffff);
  color: var(--cw-color-text, #111111);
  border-left: 1px solid var(--cw-color-border, #e5e7eb);
  font-family: var(--cw-font-family, system-ui, sans-serif);
  z-index: 2147483640;
  display: flex;
  flex-direction: column;
  transition: transform 200ms ease, width 200ms ease;
}
.cw-display-sidebar[data-position="right"] { right: 0; }
.cw-display-sidebar[data-position="left"] { left: 0; border-left: none; border-right: 1px solid var(--cw-color-border, #e5e7eb); }
.cw-display-sidebar.cw-display-collapsed { width: 32px; }
.cw-display-sidebar.cw-display-collapsed .cw-display-title,
.cw-display-sidebar.cw-display-collapsed .cw-display-body { display: none; }

.cw-display-header {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border-bottom: 1px solid var(--cw-color-border, #e5e7eb);
}
.cw-display-title { flex: 1; font-weight: 600; font-size: 14px; }
.cw-display-count {
  background: var(--cw-color-accent, #6366f1);
  color: #fff;
  border-radius: 999px;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
}
.cw-display-collapse-btn {
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  color: var(--cw-color-text, #111);
  padding: 4px 6px;
  border-radius: 4px;
}
.cw-display-collapse-btn:hover { background: var(--cw-color-border, #e5e7eb); }

.cw-display-body { flex: 1; overflow-y: auto; padding: 8px 0; }

.cw-display-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  text-decoration: none;
  color: inherit;
  border-top: 1px solid var(--cw-color-border, #f3f4f6);
}
.cw-display-card:first-child { border-top: 0; }
.cw-display-card:hover { background: rgba(0,0,0,0.03); }
.cw-display-card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--cw-radius-card, 6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}
.cw-display-card-title {
  font-size: 13px;
  line-height: 1.3;
  font-weight: 500;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.cw-display-skeleton {
  height: 56px;
  margin: 4px 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.05) 75%);
  background-size: 200% 100%;
  animation: cw-display-shimmer 1.2s linear infinite;
}
@keyframes cw-display-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.cw-display-empty,
.cw-display-error {
  padding: 16px 12px;
  font-size: 13px;
  color: var(--cw-color-subText, #6b7280);
  text-align: center;
}
.cw-display-error p { margin: 0 0 10px; }
.cw-display-retry {
  background: var(--cw-color-accent, #6366f1);
  color: #fff;
  border: 0;
  border-radius: var(--cw-radius-button, 6px);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  .cw-display-sidebar {
    top: auto;
    right: 0 !important;
    left: 0 !important;
    bottom: 0;
    width: 100%;
    height: 40vh;
    border-left: 0;
    border-top: 1px solid var(--cw-color-border, #e5e7eb);
  }
  .cw-display-sidebar.cw-display-collapsed { height: 48px; width: 100%; }
}
`;
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add widget/src/renderers/display/styles.ts
git commit -m "feat(widget): add display widget CSS"
```

---

### Task 14: DisplayRenderer (the integration piece)

**Files:**
- Create: `widget/src/renderers/display/display-renderer.ts`
- Test: `tests/unit/widget/display/display-renderer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/widget/display/display-renderer.test.ts
/**
 * @jest-environment jsdom
 */
import { DisplayRenderer } from '@/../widget/src/renderers/display/display-renderer';

const baseConfig: any = {
  uiConfig: {
    kind: 'display',
    branding: { companyName: 'Acme', brandingEnabled: true },
    theme: { colorScheme: 'light', radius: 'medium', density: 'normal',
             color: { accent: '#06f', surface: '#fff', text: '#111', subText: '#666', border: '#eee' } },
    display: { position: 'right', defaultOpen: true,
               header: { title: 'Required documents', showCount: true },
               emptyMessage: 'Nothing here yet.' },
    connection: { provider: 'n8n', relayEndpoint: 'http://relay', triggerMessage: 'find docs',
                  captureContext: true, customContext: {} },
  },
  relay: { relayUrl: 'http://relay', widgetId: 'wid1', licenseKey: 'k1' },
};

describe('DisplayRenderer', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    fetchSpy = jest.spyOn(global, 'fetch' as any).mockImplementation((async () =>
      new Response(JSON.stringify({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] }), { status: 200 })
    ) as any);
  });

  afterEach(() => { fetchSpy.mockRestore(); });

  it('mounts a sidebar into the container', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    expect(document.body.querySelector('.cw-display-sidebar')).not.toBeNull();
  });

  it('POSTs to the relay endpoint with the auto-fire payload shape', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    // allow the async fetch to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(fetchSpy).toHaveBeenCalledWith('http://relay', expect.objectContaining({ method: 'POST' }));
    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call[1] as any).body as string);
    expect(body).toMatchObject({
      widgetId: 'wid1',
      licenseKey: 'k1',
      message: 'find docs',
      chatInput: 'find docs',
    });
    expect(body.context.pageUrl).toBeDefined();
    expect(body.metadata.tier).toBeDefined();
  });

  it('renders a doc card per document in the response', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.body.querySelectorAll('.cw-display-card').length).toBe(1);
  });

  it('renders the empty state when documents array is empty', async () => {
    fetchSpy.mockImplementation((async () => new Response(JSON.stringify({ documents: [] }), { status: 200 })) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.body.textContent).toContain('Nothing here yet.');
  });

  it('renders the error state when relay returns non-2xx', async () => {
    fetchSpy.mockImplementation((async () => new Response('boom', { status: 500 })) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.body.querySelector('.cw-display-error')).not.toBeNull();
  });

  it('renders the error state when documents is missing/malformed', async () => {
    fetchSpy.mockImplementation((async () => new Response(JSON.stringify({ other: 'shape' }), { status: 200 })) as any);
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.body.querySelector('.cw-display-error')).not.toBeNull();
  });

  it('dispose() removes the sidebar from the DOM', async () => {
    const r = new DisplayRenderer();
    await r.mount(baseConfig, document.body);
    r.dispose();
    expect(document.body.querySelector('.cw-display-sidebar')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/widget/display/display-renderer.test.ts`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the renderer**

```ts
// widget/src/renderers/display/display-renderer.ts
import type { Renderer } from '../../core/renderer';
import type { WidgetRuntimeConfig } from '../../types';
import { Sidebar } from './sidebar';
import { renderDocList } from './doc-list';
import { DISPLAY_WIDGET_CSS } from './styles';
import { resolveTriggerMessage, buildDisplayPayload } from '../../services/messaging/display-payload';
import { generateSessionId } from '../../utils/session-id-generator';
import type { DisplayDocument, DisplayRendererState } from './types';

const STYLE_ID = 'cw-display-styles';

export class DisplayRenderer implements Renderer {
  private sidebar: Sidebar | null = null;
  private abort: AbortController | null = null;
  private runtimeConfig: WidgetRuntimeConfig | null = null;
  private container: HTMLElement | null = null;

  async mount(runtimeConfig: WidgetRuntimeConfig, container: HTMLElement): Promise<void> {
    this.runtimeConfig = runtimeConfig;
    this.container = container;

    this.injectStyles();

    const ui = (runtimeConfig as any).uiConfig;
    this.sidebar = new Sidebar({
      widgetKey: runtimeConfig.relay.licenseKey,
      title: ui.display?.header?.title ?? 'Documents',
      position: ui.display?.position ?? 'right',
      defaultOpen: ui.display?.defaultOpen ?? true,
      showCount: ui.display?.header?.showCount ?? true,
    });
    this.sidebar.mount(container);

    this.setState({ kind: 'loading' });

    await this.fire();
  }

  dispose(): void {
    this.abort?.abort();
    this.abort = null;
    this.sidebar?.dispose();
    this.sidebar = null;
    this.container = null;
  }

  private async fire(): Promise<void> {
    if (!this.runtimeConfig || !this.sidebar) return;
    const ui = (this.runtimeConfig as any).uiConfig;

    this.abort?.abort();
    this.abort = new AbortController();

    const winCustom = (typeof window !== 'undefined' ? (window as any).ChatWidgetConfig?.customContext : undefined);
    const customContext = winCustom && typeof winCustom === 'object' ? winCustom : (ui.connection?.customContext ?? {});

    const tier = (typeof window !== 'undefined' ? (window as any).N8N_LICENSE_FLAGS?.tier : undefined) ?? 'unknown';

    const payload = buildDisplayPayload({
      widgetId: this.runtimeConfig.relay.widgetId,
      licenseKey: this.runtimeConfig.relay.licenseKey,
      message: resolveTriggerMessage(ui.connection?.triggerMessage),
      sessionId: generateSessionId(),
      context: this.capturePageContext(),
      customContext,
      tier,
    });

    try {
      const res = await fetch(this.runtimeConfig.relay.relayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: this.abort.signal,
      });
      if (!res.ok) {
        this.setState({ kind: 'error', message: `Request failed (${res.status}).` });
        return;
      }
      const data = await res.json();
      const docs = this.parseDocuments(data);
      if (!docs) {
        this.setState({ kind: 'error', message: 'Unexpected response shape.' });
        return;
      }
      if (docs.length === 0) {
        this.setState({ kind: 'empty' });
        this.sidebar.updateCount(0);
        return;
      }
      this.setState({ kind: 'success', documents: docs });
      this.sidebar.updateCount(docs.length);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      this.setState({ kind: 'error', message: 'Network error. Please try again.' });
    }
  }

  private setState(state: DisplayRendererState): void {
    if (!this.sidebar) return;
    const ui = (this.runtimeConfig as any).uiConfig;
    renderDocList(this.sidebar.getBodyElement(), state, {
      emptyMessage: ui.display?.emptyMessage ?? 'No documents available.',
      onRetry: () => {
        this.setState({ kind: 'loading' });
        void this.fire();
      },
    });
  }

  private parseDocuments(data: unknown): DisplayDocument[] | null {
    if (!data || typeof data !== 'object') return null;
    const docs = (data as any).documents;
    if (!Array.isArray(docs)) return null;
    const out: DisplayDocument[] = [];
    for (const d of docs) {
      if (d && typeof d.title === 'string' && typeof d.url === 'string') {
        out.push({ title: d.title, url: d.url });
      }
    }
    return out;
  }

  private capturePageContext(): Record<string, unknown> {
    try {
      const u = new URL(window.location.href);
      return {
        pageUrl: window.location.href,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        queryParams: Object.fromEntries(u.searchParams),
        domain: window.location.hostname,
      };
    } catch {
      return {};
    }
  }

  private injectStyles(): void {
    if (document.getElementById(STYLE_ID)) return;
    const tag = document.createElement('style');
    tag.id = STYLE_ID;
    tag.textContent = DISPLAY_WIDGET_CSS;
    document.head.appendChild(tag);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/widget/display/display-renderer.test.ts`
Expected: PASS (7 assertions).

- [ ] **Step 5: Commit**

```bash
git add widget/src/renderers/display/display-renderer.ts tests/unit/widget/display/display-renderer.test.ts
git commit -m "feat(widget): add DisplayRenderer with auto-fire and state machine"
```

---

### Task 15: Wire `index.ts` to dispatch on `config.kind`

**Files:**
- Modify: `widget/src/index.ts`
- Modify: `widget/src/types.ts`

- [ ] **Step 1: Extend `WidgetConfig` with optional `kind`**

In `widget/src/types.ts`, locate the `WidgetConfig` interface and add:

```ts
// add to WidgetConfig
kind?: 'chat' | 'display';
```

- [ ] **Step 2: Update `index.ts` to dispatch**

Near the top of `widget/src/index.ts` add the import:

```ts
import { DisplayRenderer } from './renderers/display/display-renderer';
```

In the post-fetch path (right before the existing `await new ChatRenderer().mount(runtimeConfig, document.body);` line from Task 3), replace the single ChatRenderer call with a dispatch:

```ts
const isDisplay = (remoteConfig as any).kind === 'display';
const renderer = isDisplay ? new DisplayRenderer() : new ChatRenderer();
await renderer.mount(runtimeConfig, document.body);
```

Leave the legacy fast-path (the early `injectedConfig.branding` branch) using `ChatRenderer` — that path is for fully-injected configs which are always chat in v1.

- [ ] **Step 3: Build the widget bundle**

Run: `pnpm build:widget`
Expected: bundle builds successfully.

- [ ] **Step 4: Run all widget tests + type-check**

Run: `pnpm test tests/unit/widget/ && pnpm type-check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add widget/src/index.ts widget/src/types.ts public/widget/chat-widget.iife.js
git commit -m "feat(widget): dispatch bootstrap on config.kind for display widgets"
```

---

### Task 16: Integration test — display widget create + fetch config

**Files:**
- Test: `tests/integration/api/widgets-display.test.ts`

- [ ] **Step 1: Write the integration test**

```ts
// tests/integration/api/widgets-display.test.ts
import { POST as createWidget } from '@/app/api/widgets/route';
import { GET as fetchConfig } from '@/app/api/w/[widgetKey]/config/route';
// Adapt the auth/test-helper imports below to whatever this codebase uses.
import { createTestUser, signInRequest } from '@/tests/helpers/auth-test-helper';

describe('Display widget create + config flow', () => {
  it('creates a display widget and serves its config back through the v2 endpoint', async () => {
    const user = await createTestUser({ tier: 'pro' });
    const createReq = await signInRequest(user, {
      method: 'POST',
      url: 'http://localhost/api/widgets',
      body: {
        name: 'Display test',
        kind: 'display',
        widgetType: 'n8n',
        embedType: 'inline',
        config: {
          kind: 'display',
          branding: { companyName: 'Acme', logoUrl: null, brandingEnabled: true },
          theme: {
            colorScheme: 'light', radius: 'medium', density: 'normal',
            color: { accent: '#0066FF', surface: '#FFFFFF', text: '#111111', subText: '#666666', border: '#E5E7EB' },
          },
          display: {
            position: 'right', defaultOpen: true,
            header: { title: 'Required documents', showCount: true },
            emptyMessage: 'No documents available.',
          },
          connection: {
            provider: 'n8n',
            webhookUrl: 'https://example.com/webhook/x',
            triggerMessage: 'List required documents.',
            captureContext: true,
            customContext: {},
          },
        },
      },
    });

    const createRes = await createWidget(createReq as any);
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    expect(created.widget.kind).toBe('display');
    expect(created.widget.widgetKey).toMatch(/^[A-Za-z0-9]{16}$/);

    // Fetch the config back through the public v2 endpoint
    const fetchReq = new Request(`http://localhost/w/${created.widget.widgetKey}/config`, {
      headers: { Origin: 'https://allowed.example.com' },
    });
    const cfgRes = await fetchConfig(fetchReq as any, { params: Promise.resolve({ widgetKey: created.widget.widgetKey }) } as any);
    const cfg = await cfgRes.json();

    expect(cfg.kind).toBe('display');
    expect(cfg.connection?.webhookUrl).toBeUndefined(); // stripped server-side
    expect(cfg.connection.relayEndpoint).toContain('/api/chat-relay');
    expect(cfg.connection.triggerMessage).toBe('List required documents.');
  });
});
```

> Note for the implementer: this codebase's exact test helpers for auth + DB-isolated test users may differ. Inspect `tests/integration/` for existing patterns and adapt `createTestUser` / `signInRequest` accordingly. The assertions on response shape are what matters.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/integration/api/widgets-display.test.ts`
Expected: FAIL — likely because the widget-create handler doesn't yet pass `kind` through to the DB. If your handler already accepts arbitrary input via Zod schema and the `kind` column has a default, this may pass once the discriminated union from Task 6 is in place.

- [ ] **Step 3: Make it pass**

In `app/api/widgets/route.ts`, ensure the POST handler:
1. Parses the body against `widgetConfigSchema` (the union from Task 6).
2. Includes `kind` in the values inserted into the `widgets` table.

If the existing handler already spreads validated input into the insert, just adding the column to the schema (Task 4) and the union (Task 6) is sufficient. Otherwise, add a `kind` field to the insert payload explicitly.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/integration/api/widgets-display.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/widgets/route.ts tests/integration/api/widgets-display.test.ts
git commit -m "feat(api): support kind=display in widget create + config endpoints"
```

---

### Task 17: Integration test — chat-relay payload shape is identical for display widgets

**Files:**
- Test: `tests/integration/api/chat-relay-display.test.ts`

- [ ] **Step 1: Write the test**

```ts
// tests/integration/api/chat-relay-display.test.ts
import { POST as relay } from '@/app/api/chat-relay/route';
import { createTestWidget } from '@/tests/helpers/widget-test-helper';

describe('Chat-relay accepts display-widget payloads identically to chat-widget payloads', () => {
  it('returns the n8n JSON unchanged for a display widget', async () => {
    const widget = await createTestWidget({ kind: 'display', webhookUrl: 'https://example.com/wh/x' });

    const fetchMock = jest.spyOn(global, 'fetch' as any).mockImplementation(((url: string, init: any) => {
      if (url === 'https://example.com/wh/x') {
        return Promise.resolve(new Response(JSON.stringify({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] }), { status: 200 }));
      }
      return Promise.reject(new Error(`unexpected url ${url}`));
    }) as any);

    const req = new Request('http://localhost/api/chat-relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://allowed.example.com' },
      body: JSON.stringify({
        widgetId: widget.id,
        licenseKey: widget.widgetKey,
        message: 'List required documents.',
        chatInput: 'List required documents.',
        sessionId: 'session-123',
        context: { pageUrl: 'https://allowed.example.com/', pagePath: '/', pageTitle: 'x', queryParams: {}, domain: 'allowed.example.com' },
        customContext: { region: 'us' },
        metadata: { tier: 'pro' },
      }),
    });

    const res = await relay(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ documents: [{ title: 'A', url: 'https://x/a.pdf' }] });

    fetchMock.mockRestore();
  });
});
```

> Adapt `createTestWidget` to whatever helper this codebase uses for inserting a test widget with an authorized domain.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/integration/api/chat-relay-display.test.ts`
Expected: FAIL only if a missing helper. If the chat-relay endpoint already routes by webhook URL and validates the widget exists, no code change is needed.

- [ ] **Step 3: Investigate any failure and fix**

If the relay handler hard-codes `widgetType === 'n8n'` checks that conflict with the `kind` column, adjust. If the handler validates `kind === 'chat'` anywhere, remove that constraint.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/integration/api/chat-relay-display.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat-relay/route.ts tests/integration/api/chat-relay-display.test.ts
git commit -m "test(api): verify chat-relay accepts display widget payloads"
```

---

### Task 18: Manual end-to-end smoke test

- [ ] **Step 1: Insert a display widget directly into the DB**

Open `pnpm db:studio` (or run a SQL query) and insert a row into `widgets` with `kind='display'`, a valid display config (see Task 5 example), and `allowed_domains=['localhost']`.

- [ ] **Step 2: Build the widget bundle**

Run: `pnpm build:widget`

- [ ] **Step 3: Create a local test HTML page**

Create `test-display.html` at the project root (gitignored or temporary):

```html
<!doctype html>
<html>
  <head><title>Display Widget Smoke Test</title></head>
  <body>
    <h1>Display Widget Smoke Test</h1>
    <p>Lorem ipsum content.</p>
    <script>
      window.ChatWidgetConfig = {
        customContext: { state: 'CO', transactionType: 'refinance' }
      };
    </script>
    <script src="http://localhost:3000/w/<INSERT_WIDGET_KEY>.js" async></script>
  </body>
</html>
```

Replace `<INSERT_WIDGET_KEY>` with the `widgetKey` of the row you inserted.

- [ ] **Step 4: Run dev server and load the page**

Run: `pnpm dev`
In a browser open `file:///<path>/test-display.html` (or serve via a static server if browsers block file:// XHR).

Verify:
1. Sidebar appears on the right edge.
2. Network tab shows POST to `/api/chat-relay` with the `customContext` you set.
3. If n8n returns `{documents:[...]}`, cards appear. If it returns an error, the sidebar shows the error state with a Retry button that re-fires.

- [ ] **Step 5: Delete the temp test HTML**

```bash
rm test-display.html
```

No commit needed for this task — it's verification.

---

## Phase 3 — Configurator UI (commit 3)

### Task 19: Extract shared `ThemeSection` component

**Files:**
- Create: `components/configurator/sections/theme-section.tsx`
- Modify: `components/configurator/config-sidebar.tsx` (replace inlined theme markup with `<ThemeSection ... />`)

- [ ] **Step 1: Identify the existing theme block in `config-sidebar.tsx`**

Read `components/configurator/config-sidebar.tsx`. Locate the `Theme` section markup — likely a collapsible section containing radios/inputs for `colorScheme`, `radius`, `density`, and color pickers for accent/surface/text/etc.

- [ ] **Step 2: Move it into a new component**

Create `components/configurator/sections/theme-section.tsx`. Move the JSX verbatim, parameterizing it with props:

```tsx
// components/configurator/sections/theme-section.tsx
"use client";
import type { Dispatch, SetStateAction } from "react";

export interface ThemeSectionValue {
  colorScheme: 'light' | 'dark' | 'auto';
  radius: 'none' | 'small' | 'medium' | 'large' | 'pill';
  density: 'compact' | 'normal' | 'spacious';
  color: {
    accent: string; surface: string; text: string; subText: string; border: string;
  };
}

interface Props {
  value: ThemeSectionValue;
  onChange: (next: ThemeSectionValue) => void;
}

export function ThemeSection({ value, onChange }: Props) {
  // Paste the JSX previously in config-sidebar.tsx here.
  // Replace any direct setState calls with onChange({ ...value, [key]: next }).
  return (
    /* ... */
  );
}
```

- [ ] **Step 3: Update `config-sidebar.tsx` to use the extracted component**

Replace the inlined theme block with `<ThemeSection value={config.theme} onChange={(t) => setConfig({ ...config, theme: t })} />`.

- [ ] **Step 4: Run the existing configurator tests + smoke-test the page**

Run: `pnpm test tests/unit/components/ && pnpm type-check`
Then `pnpm dev` and visit `/configurator/n8n` to confirm the theme section still works.

- [ ] **Step 5: Commit**

```bash
git add components/configurator/sections/theme-section.tsx components/configurator/config-sidebar.tsx
git commit -m "refactor(configurator): extract ThemeSection for reuse"
```

---

### Task 20: Extract shared `BrandingSection` component

**Files:**
- Create: `components/configurator/sections/branding-section.tsx`
- Modify: `components/configurator/config-sidebar.tsx`

- [ ] **Step 1: Find the branding-fields-relevant-to-both-widget-kinds**

In `config-sidebar.tsx`, locate the branding fields shared by both kinds: `companyName`, `logoUrl`, `brandingEnabled`. Chat-only fields (`firstMessage`, `welcomeText`, `launcherIcon`, etc.) should NOT move into the shared component.

- [ ] **Step 2: Move shared fields into a new component**

```tsx
// components/configurator/sections/branding-section.tsx
"use client";

export interface BrandingSectionValue {
  companyName: string;
  logoUrl: string | null;
  brandingEnabled: boolean;
}

interface Props {
  value: BrandingSectionValue;
  onChange: (next: BrandingSectionValue) => void;
  brandingToggleDisabled?: boolean;
  brandingToggleDisabledReason?: string;
}

export function BrandingSection({ value, onChange, brandingToggleDisabled, brandingToggleDisabledReason }: Props) {
  return (
    /* paste shared JSX here */
  );
}
```

The tier-gating of `brandingEnabled` is passed in via `brandingToggleDisabled` so the parent decides when to lock it.

- [ ] **Step 3: Update `config-sidebar.tsx`**

Replace the shared branding fields with `<BrandingSection value={...} onChange={...} brandingToggleDisabled={...} />`. Keep chat-only branding fields inlined where they were.

- [ ] **Step 4: Type-check + run dev server + smoke test**

Run: `pnpm type-check`
Then `pnpm dev` and visit `/configurator/n8n`. Confirm branding fields work.

- [ ] **Step 5: Commit**

```bash
git add components/configurator/sections/branding-section.tsx components/configurator/config-sidebar.tsx
git commit -m "refactor(configurator): extract BrandingSection for reuse"
```

---

### Task 21: `DisplaySection` component (display-only fields)

**Files:**
- Create: `components/configurator/sections/display-section.tsx`
- Test: `tests/unit/components/configurator/display-section.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/unit/components/configurator/display-section.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { DisplaySection } from '@/components/configurator/sections/display-section';

const initial = {
  position: 'right' as const,
  defaultOpen: true,
  header: { title: 'Required documents', showCount: true },
  emptyMessage: 'No documents available.',
};

describe('DisplaySection', () => {
  it('renders all four fields with initial values', () => {
    render(<DisplaySection value={initial} onChange={() => {}} />);
    expect(screen.getByLabelText(/title/i)).toHaveValue('Required documents');
    expect(screen.getByLabelText(/empty message/i)).toHaveValue('No documents available.');
    expect(screen.getByLabelText(/right/i)).toBeChecked();
    expect(screen.getByLabelText(/default open/i)).toBeChecked();
  });

  it('calls onChange when title changes', () => {
    const onChange = jest.fn();
    render(<DisplaySection value={initial} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New title' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      header: expect.objectContaining({ title: 'New title' }),
    }));
  });

  it('toggles position to left when the left radio is clicked', () => {
    const onChange = jest.fn();
    render(<DisplaySection value={initial} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/left/i));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ position: 'left' }));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test tests/unit/components/configurator/display-section.test.tsx`
Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the component**

```tsx
// components/configurator/sections/display-section.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface DisplaySectionValue {
  position: 'right' | 'left';
  defaultOpen: boolean;
  header: { title: string; showCount: boolean };
  emptyMessage: string;
}

interface Props {
  value: DisplaySectionValue;
  onChange: (next: DisplaySectionValue) => void;
}

export function DisplaySection({ value, onChange }: Props) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold">Display</h3>

      <div>
        <Label htmlFor="display-title">Title</Label>
        <Input
          id="display-title"
          value={value.header.title}
          onChange={(e) => onChange({ ...value, header: { ...value.header, title: e.target.value } })}
        />
      </div>

      <div>
        <Label>Position</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="display-position"
              checked={value.position === 'right'}
              onChange={() => onChange({ ...value, position: 'right' })}
              aria-label="right"
            />
            <span>Right</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="display-position"
              checked={value.position === 'left'}
              onChange={() => onChange({ ...value, position: 'left' })}
              aria-label="left"
            />
            <span>Left</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="display-default-open">Default open</Label>
        <Switch
          id="display-default-open"
          checked={value.defaultOpen}
          onCheckedChange={(v) => onChange({ ...value, defaultOpen: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="display-show-count">Show count badge</Label>
        <Switch
          id="display-show-count"
          checked={value.header.showCount}
          onCheckedChange={(v) => onChange({ ...value, header: { ...value.header, showCount: v } })}
        />
      </div>

      <div>
        <Label htmlFor="display-empty">Empty message</Label>
        <Input
          id="display-empty"
          value={value.emptyMessage}
          onChange={(e) => onChange({ ...value, emptyMessage: e.target.value })}
        />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test tests/unit/components/configurator/display-section.test.tsx`
Expected: PASS (3 assertions).

- [ ] **Step 5: Commit**

```bash
git add components/configurator/sections/display-section.tsx tests/unit/components/configurator/display-section.test.tsx
git commit -m "feat(configurator): add DisplaySection component"
```

---

### Task 22: `DisplayPreview` component

**Files:**
- Create: `components/configurator/display-preview.tsx`

- [ ] **Step 1: Implement the preview pane**

```tsx
// components/configurator/display-preview.tsx
"use client";
import { useEffect, useRef } from "react";
import { DisplayRenderer } from "@/../widget/src/renderers/display/display-renderer";
import type { DisplaySectionValue } from "./sections/display-section";
import type { ThemeSectionValue } from "./sections/theme-section";
import type { BrandingSectionValue } from "./sections/branding-section";

interface Props {
  display: DisplaySectionValue;
  theme: ThemeSectionValue;
  branding: BrandingSectionValue;
  triggerMessage: string;
}

export function DisplayPreview({ display, theme, branding, triggerMessage }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<DisplayRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    rendererRef.current?.dispose();

    const renderer = new DisplayRenderer();
    // Stub the network call so the preview doesn't actually POST to n8n.
    const stubResponse = { documents: [
      { title: 'Sample document 1.pdf', url: 'https://example.com/1.pdf' },
      { title: 'Sample document 2.docx', url: 'https://example.com/2.docx' },
    ]};
    const originalFetch = window.fetch;
    window.fetch = async () => new Response(JSON.stringify(stubResponse), { status: 200 });

    renderer.mount(
      {
        uiConfig: { kind: 'display', branding, theme, display, connection: {
          provider: 'n8n', triggerMessage, captureContext: false, customContext: {},
          relayEndpoint: 'about:blank',
        } },
        relay: { relayUrl: 'about:blank', widgetId: 'preview', licenseKey: 'preview' },
      } as any,
      containerRef.current,
    );
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      window.fetch = originalFetch;
    };
  }, [JSON.stringify({ display, theme, branding, triggerMessage })]);

  return (
    <div className="relative h-full min-h-[500px] rounded-md border bg-muted/30 overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add components/configurator/display-preview.tsx
git commit -m "feat(configurator): add live DisplayPreview pane"
```

---

### Task 23: `/configurator/n8n-display` page

**Files:**
- Create: `app/configurator/n8n-display/page.tsx`

- [ ] **Step 1: Inspect the existing n8n configurator page for structure**

Open `app/configurator/n8n/page.tsx` and note its overall shape: layout (two-pane split), state hook (likely `useWidgetStore`), save handler (likely POSTs to `/api/widgets`), code-modal trigger.

- [ ] **Step 2: Create the display configurator page**

```tsx
// app/configurator/n8n-display/page.tsx
"use client";
import { useState } from "react";
import { ThemeSection, type ThemeSectionValue } from "@/components/configurator/sections/theme-section";
import { BrandingSection, type BrandingSectionValue } from "@/components/configurator/sections/branding-section";
import { DisplaySection, type DisplaySectionValue } from "@/components/configurator/sections/display-section";
import { DisplayPreview } from "@/components/configurator/display-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function DisplayConfiguratorPage() {
  const [name, setName] = useState('Untitled display widget');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [triggerMessage, setTriggerMessage] = useState('List required documents.');
  const [captureContext, setCaptureContext] = useState(true);

  const [branding, setBranding] = useState<BrandingSectionValue>({
    companyName: 'Acme', logoUrl: null, brandingEnabled: true,
  });
  const [theme, setTheme] = useState<ThemeSectionValue>({
    colorScheme: 'light', radius: 'medium', density: 'normal',
    color: { accent: '#6366F1', surface: '#FFFFFF', text: '#111827', subText: '#6B7280', border: '#E5E7EB' },
  });
  const [display, setDisplay] = useState<DisplaySectionValue>({
    position: 'right', defaultOpen: true,
    header: { title: 'Required documents', showCount: true },
    emptyMessage: 'No documents available for this page.',
  });

  async function handleSave() {
    const res = await fetch('/api/widgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        kind: 'display',
        widgetType: 'n8n',
        embedType: 'inline',
        config: {
          kind: 'display',
          branding,
          theme,
          display,
          connection: { provider: 'n8n', webhookUrl, triggerMessage, captureContext, customContext: {} },
        },
      }),
    });
    if (!res.ok) {
      alert('Save failed: ' + (await res.text()));
      return;
    }
    const data = await res.json();
    window.location.href = `/dashboard?widget=${data.widget.id}`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 p-6 h-screen">
      <div className="space-y-6 overflow-y-auto pr-4">
        <h1 className="text-xl font-semibold">Document Display Widget</h1>

        <section className="space-y-3">
          <Label htmlFor="name">Widget name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Connection</h3>
          <Label htmlFor="webhook">n8n webhook URL</Label>
          <Input id="webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://..." />
          <Label htmlFor="trigger">Default trigger message</Label>
          <Input id="trigger" value={triggerMessage} onChange={(e) => setTriggerMessage(e.target.value)} />
          <div className="flex items-center justify-between">
            <Label htmlFor="capture">Capture page context</Label>
            <Switch id="capture" checked={captureContext} onCheckedChange={setCaptureContext} />
          </div>
        </section>

        <DisplaySection value={display} onChange={setDisplay} />
        <ThemeSection value={theme} onChange={setTheme} />
        <BrandingSection value={branding} onChange={setBranding} />

        <Button onClick={handleSave} className="w-full">Save widget</Button>
      </div>

      <div>
        <DisplayPreview display={display} theme={theme} branding={branding} triggerMessage={triggerMessage} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build + dev server**

Run: `pnpm build:widget && pnpm dev`
Open `http://localhost:3000/configurator/n8n-display` and confirm:
1. Page renders, no console errors.
2. Live preview shows a sidebar with two sample doc cards.
3. Editing the title in the Display section updates the preview header.
4. Editing the accent color in the Theme section updates the count-badge color.
5. "Save widget" creates a record in the DB (verify via studio or dashboard).

- [ ] **Step 3: Commit**

```bash
git add app/configurator/n8n-display/page.tsx
git commit -m "feat(configurator): add /configurator/n8n-display page"
```

---

### Task 24: Update `/configurator/page.tsx` to a 3-card picker

**Files:**
- Modify: `app/configurator/page.tsx`

- [ ] **Step 1: Read the current picker**

Read `app/configurator/page.tsx`. Note how the existing two cards (ChatKit / n8n) are rendered and what the click handler does.

- [ ] **Step 2: Add a third card**

Add a card for "n8n Document Display" that navigates to `/configurator/n8n-display`. Maintain the existing layout pattern; if the file uses a grid, expand it to three columns at the appropriate breakpoint.

Example diff structure (adapt to the actual JSX):

```tsx
<Card onClick={() => router.push('/configurator/n8n-display')}>
  <CardHeader>
    <CardTitle>n8n Document Display</CardTitle>
    <CardDescription>Auto-load a document list from your n8n workflow into a sidebar.</CardDescription>
  </CardHeader>
</Card>
```

If the existing page has a `CHATKIT_UI_ENABLED` feature flag pattern, keep parity — the display card should not be flag-gated unless you want it to be.

- [ ] **Step 3: Type-check + smoke test**

Run: `pnpm type-check && pnpm dev`
Open `http://localhost:3000/configurator` and confirm the third card appears and navigates to the new page.

- [ ] **Step 4: Commit**

```bash
git add app/configurator/page.tsx
git commit -m "feat(configurator): add Document Display card to picker"
```

---

### Task 25: Final integration smoke test + push

- [ ] **Step 1: Run the complete test suite**

Run: `pnpm test && pnpm type-check && pnpm lint`
Expected: ALL PASS.

- [ ] **Step 2: Build the production bundle**

Run: `pnpm build`
Expected: Next.js build completes; widget bundle is included.

- [ ] **Step 3: Full end-to-end flow against dev**

1. `pnpm dev`
2. Log in as a test user
3. Go to `/configurator`, click "n8n Document Display"
4. Fill in webhook URL, trigger message, title — save
5. Get the embed snippet from the dashboard
6. Paste it into a test HTML page on localhost (with `customContext` injected)
7. Open the page, confirm the sidebar mounts and fetches

- [ ] **Step 4: Push the branch**

```bash
git push origin <branch-name>
```

---

## Self-review against spec

**Spec coverage:**

| Spec section | Plan task(s) |
|---|---|
| Architecture > Renderer interface | Task 1 |
| Architecture > ChatRenderer wrapper | Tasks 2-3 |
| Data model > `kind` column | Task 4 |
| Data model > Validation (display schema + union) | Tasks 5-6 |
| Data model > Config endpoint dispatch | Tasks 7-8 |
| Runtime flow > Auto-fire payload | Task 9 |
| Runtime flow > DocCard, DocList, Sidebar | Tasks 10-12 |
| Sidebar component > Styling | Task 13 |
| Runtime flow > DisplayRenderer end-to-end | Task 14 |
| Runtime flow > Bootstrap dispatch on kind | Task 15 |
| Testing > Integration tests | Tasks 16-17 |
| Sidebar component > Mobile bottom sheet | Covered in Task 13 (CSS media query) |
| Configurator > Shared sections | Tasks 19-20 |
| Configurator > DisplaySection | Task 21 |
| Configurator > Live preview pane | Task 22 |
| Configurator > New entry point | Task 23 |
| Configurator > 3-card picker | Task 24 |
| Testing > Manual smoke test | Tasks 18 + 25 |

No spec section is unaddressed. The spec called for moving chat files into `renderers/chat/`; the plan deferred that to a future cleanup commit (explained in "Plan vs. spec note" at the top).

**Placeholder check:** No TBDs, no "implement later", no "similar to Task N" without code. Every step that adds code includes the code. Every step that runs a command includes the exact command.

**Type/name consistency:** `Renderer.mount(runtimeConfig, container)`, `Sidebar.getBodyElement()`, `renderDocList(container, state, opts)`, `createDocCard(doc)`, `DisplayRendererState` discriminated union — all consistent across tasks.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-16-document-display-widget.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?

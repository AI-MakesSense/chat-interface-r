---
title: "fix: Resolve document display widget code review findings"
type: fix
status: active
date: 2026-05-18
origin: code review run /tmp/compound-engineering/ce-code-review/20260518-38c9e0c0/ on branch feat/document-display-widget
---

# fix: Resolve document display widget code review findings

## Summary

Resolve the 30 findings the multi-agent code review surfaced on `feat/document-display-widget` so the branch can move from "Not ready" to ready-to-merge. Most P0s share a single root cause — chat-shaped config helpers leaking into the display path — and fix together; the remaining work is a security pass, a renderer correctness pass, and a small cleanup pass.

---

## Problem Frame

The branch landed 28 commits implementing the new Document Display Widget kind alongside the existing chat widget. The multi-agent review (13 reviewers, 50+ raw findings deduped to 30 in the primary set) verdict was "Not ready" because:

- A pre-existing helper (`stripLegacyConfigProperties`) unconditionally deletes `config.theme`, silently destroying display-widget themes on every POST/PATCH (5 reviewers converged on this; cascades through 3 findings).
- An XSS surface exists in `DocCard`: n8n's `documents[i].url` flows directly to `<a href>` with no scheme validation, so a compromised n8n workflow can execute `javascript:` in the embedding origin.
- The configurator's live preview monkey-patches `window.fetch` globally, racing with concurrent fetches and React 18 StrictMode remounts.
- The kind-dispatch wiring (Task 8 of the original plan) missed a third config endpoint at `app/w/[widgetKey]/config/route.ts` — display widgets loaded through that URL render against the chat translation shape.
- The display response shape is structurally incompatible with `WidgetConfig` (missing `features`, different `branding` sub-schema), exposing future consumers to runtime TypeError if they access fields the type declares as required.

Beyond these blockers, 11 P1 issues (substring-localhost validation bypass, tier-`'free'` schema bypass, no fetch timeout, retry race, `captureContext` toggle ignored, theme never applied at runtime, etc.) and 14 P2/P3 items round out the cleanup.

---

## Requirements

- **R1.** All 5 P0 findings (#1–#5) resolved so the verdict can move from "Not ready" to at least "Ready with fixes".
- **R2.** All 11 P1 findings (#6–#16) resolved so no merge-blocking issues remain.
- **R3.** All 14 P2/P3 findings (#17–#30) resolved as a final cleanup pass.
- **R4.** Existing chat widget behavior unchanged — the 56 new unit tests already passing keep passing, and chat-specific tests (`tests/unit/widget/serve.test.ts`, `tests/unit/chat-relay.test.ts`, etc.) keep their pre-fix pass/fail counts.
- **R5.** New tests added for the previously-untested paths the review surfaced:
  - `stripLegacyConfigProperties` against a display config
  - POST `/api/widgets` end-to-end with `kind: 'display'`
  - V2 deploy fallback (widget with `licenseId = NULL`)
  - `app/w/[widgetKey]/config/route.ts` serving a display widget
  - `DisplayRenderer` AbortError silent-return branch
  - `http://localhost:3000/webhook` accepted by display widget schema
  - `DisplayRenderer` theme variables applied to sidebar root

---

## Scope Boundaries

- No SPA URL-change re-fire — carried from spec's "Out of scope"
- No manual refresh button — spec out of scope
- No document categories, descriptions, dates, or thumbnails on cards — spec out of scope
- No inline preview / lightbox for clicked documents — spec out of scope
- No document-click analytics — spec out of scope

### Deferred to Follow-Up Work

- **Project standards documentation updates (PS-001, PS-003, PS-004)**: updating `docs/development/DEVELOPMENT_LOG.md`, `docs/development/decisions.md` (ADR for Renderer pattern), and `CLAUDE.md` project structure map. Separate doc-update commit on the same branch or a follow-up branch. Out of scope for the functional fixes themselves.
- **File relocation of `widget/src/widget.ts` and `widget/src/ui/` into `widget/src/renderers/chat/`**: spec explicitly deferred to a future cleanup commit. Not in scope here.
- **Integration tests that require DATABASE_URL**: the two integration test files added on the original branch (`tests/integration/api/widgets-display.test.ts`, `tests/integration/api/chat-relay-display.test.ts`) remain DB-dependent. New tests added in this plan are unit-test-focused; integration tests that require a live DB stay deferred until env is configured.

---

## Context & Research

### Relevant Code and Patterns

- `lib/utils/config-helpers.ts` — `stripLegacyConfigProperties` and `createDefaultConfig` are chat-only by construction; must be guarded by `kind`.
- `lib/validation/display-widget-schema.ts` — Zod schema for display widget configs; the `httpsUrl` refine uses substring `'localhost'` check.
- `lib/validation/widget-schema.ts` — `createWidgetConfigSchema(tier, brandingRequired)` factory; `getWidgetConfigSchemaForKind` dispatcher added in original Task 6.
- `lib/widget/translate-display-config.ts` — server-side translator that strips `webhookUrl`; needs a `relay` block and a `features` stub.
- `widget/src/core/renderer.ts` — `Renderer` interface; needs an optional `fetcher` parameter on `mount`.
- `widget/src/renderers/chat/chat-renderer.ts` — must accept (and ignore) the new fetcher parameter.
- `widget/src/renderers/display/display-renderer.ts` — owns most renderer-correctness findings (#9–#15).
- `widget/src/renderers/display/doc-card.ts` — `createDocCard` needs URL scheme validation before assigning to `<a href>`.
- `widget/src/renderers/display/sidebar.ts` — `updateCount` is called without null guards in `display-renderer.ts:97,101`.
- `widget/src/index.ts` — last-wins script selection; `document.currentScript` is the safer source.
- `components/configurator/display-preview.tsx` — monkey-patches `window.fetch`; switch to fetcher-injection.
- `app/api/widgets/route.ts`, `app/api/widgets/[id]/route.ts`, `app/api/widgets/[id]/deploy/route.ts` — three routes call `stripLegacyConfigProperties` and the chat-shaped `createDefaultConfig`; all need kind-aware paths.
- `app/w/[widgetKey]/config/route.ts` — the third config endpoint missed by original Task 8.

### Institutional Learnings (from `docs/solutions/`)

- `docs/solutions/build-errors/obfuscator-mid-string-split-crashes-widget-2026-05-06.md` — every widget source change re-triggers obfuscation; run `node --check` on the assembled bundle across multiple seeds before merging.
- `docs/solutions/design-patterns/link-preview-cards-with-feature-flag-gating-2026-05-06.md` — DocCard mirrors the link-preview-card pattern; reuse `file-type-detector`, gate at bootstrap.
- `docs/solutions/workflow-issues/vercel-deploy-alias-cache-branch-reconciliation-2026-05-06.md` — bundle cache headers must be ETag + no-cache on every widget-serving route.
- `docs/solutions/ui-bugs/chat-widget-link-visibility-2026-05-06.md` — DocCard anchors/buttons should call `resolveLinkColor()` from `widget/src/link-color.ts` for WCAG AA contrast against bubble background. Relevant to U8's theme-injection work.

### External References

- N/A — internal correctness and validation work; no new external dependencies.

---

## Key Technical Decisions

- **Make `stripLegacyConfigProperties` and `createDefaultConfig` kind-aware via guard, not split helpers.** Smaller diff, preserves the existing "one helper applies to all kinds" architectural shape. The guard pattern is: helpers accept (or sniff) the widget `kind` and skip kind-incompatible operations. Trade-off: helpers grow conditional branches over time; if more kinds are added the case for splitting strengthens, but at 2 kinds the guard pattern is the lighter touch.
- **Extend `Renderer.mount()` to accept an optional `fetcher` parameter.** Default to `globalThis.fetch`. `DisplayPreview` passes its stub; the renderer never reads `window.fetch` directly. `ChatRenderer` accepts the parameter for interface conformance and ignores it (chat already routes through `createChatWidget`'s internal fetch). Trade-off: small ripple to `Renderer` interface contract; the cleaner shape vs. `try/finally`+per-instance guard is worth it.
- **Normalize `'free' → 'basic'` at API call sites, not by extending `LicenseTier`.** Three concrete call sites (`POST /api/widgets`, `PATCH /api/widgets/[id]`, `POST /api/widgets/[id]/deploy`) get a one-line `normalizeTier(rawTier)` call before passing to `getWidgetConfigSchemaForKind`. Trade-off: future call sites must remember to normalize; mitigated by exporting `normalizeTier` from `lib/validation/widget-schema.ts` and documenting in the function JSDoc that it must be the entry point for any user-derived tier.
- **Add a `features` stub to `translateDisplayConfig` output to satisfy `WidgetConfig`'s required fields.** The stub is `{ fileAttachmentsEnabled: false, allowedExtensions: [], maxFileSizeKB: 0 }`. Keeps the response valid against the type contract without introducing a new `DisplayClientConfig` type. Also add `kind: 'display'` to the response so consumers can discriminate explicitly. Trade-off: chat response stays without `kind` (asymmetric); the alternative (add `kind: 'chat'` to chat response) is a wider change and outside this plan's scope.
- **DisplayRenderer theme injection** (#10): set CSS variables on the sidebar root from `runtimeConfig.uiConfig.theme.color` at mount time (`root.style.setProperty('--cw-color-accent', color.accent)`, etc.). Reuses the existing `--cw-*` variable convention from `widget/src/theming/css-variables.ts`. Does not introduce a new theme module.

---

## Open Questions

### Resolved During Planning

- **Should fixes be one big commit or per-finding commits?** Per implementation unit, mirroring the original branch's commit-per-task pattern. Each unit is one logical change.
- **Should we stack on `feat/document-display-widget` or open a new branch?** Stack — the existing branch has no PR yet, and the fixes are tightly coupled to that branch's work.
- **Should we run the failing integration tests against a configured DB before merging?** Not in scope for this plan — integration tests stay DB-dependent and run when env is configured.

### Deferred to Implementation

- Exact `normalizeTier` helper location: top of `lib/validation/widget-schema.ts` or its own `lib/validation/tier-normalize.ts`. Decide at implementation time based on whether other consumers (outside the three API routes) emerge.
- Whether the `fetcher` parameter on `Renderer.mount` should be `fetch` typed (`typeof fetch`) or a narrower signature `(input: RequestInfo, init?: RequestInit) => Promise<Response>`. Decide at implementation time based on TypeScript strictness with the existing `createChatWidget` typings.
- Whether the obfuscator multi-seed `node --check` validation (from the build-errors learning) should run in CI or just locally before merge. Decide based on existing CI configuration.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**Config helper guard pattern (U1):**

```
stripLegacyConfigProperties(config, kind)
  if kind === 'display': skip 'theme' deletion
  else: existing behavior (delete legacy chat fields including 'theme')

createDefaultConfig(tier, kind)
  if kind === 'display': return display-shaped default { kind, branding, theme, display, connection }
  else: existing behavior (return chat-shaped default)
```

**Renderer fetcher injection (U5):**

```
Renderer.mount(runtimeConfig, container, options?: { fetcher?: typeof fetch })
  → DisplayRenderer reads options.fetcher ?? globalThis.fetch
  → DisplayPreview passes its stub instead of mutating window.fetch
```

**Tier normalization (U7):**

```
normalizeTier(rawTier: string | undefined): LicenseTier
  if rawTier in ('basic', 'pro', 'agency'): return rawTier
  else: return 'basic'  // 'free', null, undefined, unknown all collapse to 'basic'
```

---

## Implementation Units

### U1. Make config helpers kind-aware

**Goal:** Fix the root-cause cluster (#1, #16, #21) so display widgets stop losing their theme on POST and PATCH.

**Requirements:** R1 (#1, #5 partial, #16), R3 (#21), R4

**Dependencies:** None — independent foundation.

**Files:**
- Modify: `lib/utils/config-helpers.ts`
- Modify: `app/api/widgets/route.ts` (call sites)
- Modify: `app/api/widgets/[id]/route.ts` (call sites)
- Test: `tests/unit/utils/config-helpers.test.ts` (new file)

**Approach:**
- Add `kind: 'chat' | 'display'` parameter to `stripLegacyConfigProperties` and `createDefaultConfig`.
- In `stripLegacyConfigProperties`: when `kind === 'display'`, skip the `delete config.theme` line and any other legacy-chat-only deletions. Chat path behavior unchanged.
- In `createDefaultConfig`: when `kind === 'display'`, return a minimal display-shaped default `{ kind: 'display', branding: {...}, theme: {...}, display: {...}, connection: {...} }`. Chat default unchanged.
- Update the three call sites (POST `/api/widgets`, PATCH `/api/widgets/[id]`, anywhere else they're called) to thread `kind` from the parsed body (POST) or the existing widget row (PATCH).
- After the change, the order is: validate body → look up `kind` (from body for POST, from widget row for PATCH) → call `createDefaultConfig(tier, kind)` → deep-merge user config → call `stripLegacyConfigProperties(merged, kind)` → assign back the validated parse result → insert/update.

**Execution note:** Test-first — write the failing test for `stripLegacyConfigProperties(displayConfig, 'display')` preserving theme, then add the guard.

**Patterns to follow:**
- Existing `getWidgetConfigSchemaForKind(kind, tier, brandingRequired)` shape from `lib/validation/widget-schema.ts`.

**Test scenarios:**
- Happy path: `stripLegacyConfigProperties({theme: {...}, branding: {...}}, 'display')` returns object with `theme` intact.
- Happy path: `stripLegacyConfigProperties({theme: {...}, oldField: 'x'}, 'chat')` deletes `theme` and `oldField` (existing behavior preserved).
- Happy path: `createDefaultConfig('pro', 'display')` returns a display-shaped object with the right top-level keys.
- Happy path: `createDefaultConfig('pro', 'chat')` returns the same shape as before this change (regression check).
- Integration: POST `/api/widgets` with `kind: 'display'` and a custom theme, then read back the inserted row's `config` JSONB. Theme equals the input theme. (DB-dependent — mark as `it.skip` if DATABASE_URL is unset.)

**Verification:**
- A display widget POST round-trip preserves the user-submitted theme in the persisted config.
- Chat widget tests continue to pass — `stripLegacyConfigProperties({theme: 'oldval', ...}, 'chat')` still deletes the legacy field.

---

### U2. Display response shape — add features stub and kind discriminator

**Goal:** Make `translateDisplayConfig` output structurally compatible with `WidgetConfig` so consumers reading required fields don't throw (#5). Also unblocks future strict-typed access.

**Requirements:** R1 (#5)

**Dependencies:** None.

**Files:**
- Modify: `lib/widget/translate-display-config.ts`
- Modify: `tests/unit/widget/translate-display-config.test.ts`

**Approach:**
- Add `features: { fileAttachmentsEnabled: false, allowedExtensions: [], maxFileSizeKB: 0 }` to the returned object. Display widgets don't accept attachments by definition, so the stub values are accurate.
- The `kind: 'display' as const` is already there. Leave as is.
- Confirm the existing tests for the translator still pass; add one new assertion that `result.features` exists.

**Patterns to follow:**
- Existing `translateConfig` in `app/api/w/[widgetKey]/config/route.ts` for the canonical `WidgetConfig` response shape.

**Test scenarios:**
- Happy path: `translateDisplayConfig(displayConfig, requestUrl)` output includes `features: {fileAttachmentsEnabled: false, ...}`.
- Happy path: `kind === 'display'` preserved.
- Regression: existing 6 tests still pass.

**Verification:**
- `translateDisplayConfig` output type-checks against a partial `WidgetConfig` (the implementer may write a one-time TS assertion in the test file or just rely on runtime field presence).

---

### U3. Third config endpoint kind dispatch

**Goal:** Add the kind-based dispatch to `app/w/[widgetKey]/config/route.ts` that original Task 8 missed (#4).

**Requirements:** R1 (#4)

**Dependencies:** None.

**Files:**
- Modify: `app/w/[widgetKey]/config/route.ts`
- Test: `tests/integration/api/widget-config-public.test.ts` (new — or add to an existing integration test file if one already covers this route)

**Approach:**
- Mirror the dispatch from `app/api/w/[widgetKey]/config/route.ts` exactly: import `translateDisplayConfig`, then branch on `widget.kind === 'display'`.
- The widget row already comes from `getWidgetByKeyWithUser()` which uses `select()` without column lists, so `kind` is already in the result.

**Test scenarios:**
- Happy path: GET this route with a `kind: 'display'` widget returns a response where `kind === 'display'` and `connection.relayEndpoint` is present.
- Regression: GET with a `kind: 'chat'` widget returns the same shape as before (chat translation).
- Integration: end-to-end POST + GET round-trip — DB-dependent, mark `it.skip` if DATABASE_URL unset.

**Verification:**
- Display widgets loaded via the public `/w/[widgetKey]/config` URL render correctly through `DisplayRenderer`.

---

### U4. XSS scheme validation in DocCard

**Goal:** Reject non-http/https URLs in `parseDocuments` so a malicious n8n workflow cannot inject `javascript:` URLs (#2).

**Requirements:** R1 (#2), R5

**Dependencies:** None.

**Files:**
- Modify: `widget/src/renderers/display/display-renderer.ts` (the `parseDocuments` method)
- Modify: `tests/unit/widget/display/display-renderer.test.ts`

**Approach:**
- In `parseDocuments`, after validating `typeof d.title === 'string' && typeof d.url === 'string'`, parse `new URL(d.url)` in a try/catch and accept only when `protocol === 'http:' || protocol === 'https:'`. Drop other items silently (or surface in console.warn — implementer's call, document the choice).
- Do NOT also gate at `createDocCard` — single validation point at parse time is cleaner; `createDocCard` trusts what `parseDocuments` returned.

**Patterns to follow:**
- Existing scheme-validation in `lib/validation/display-widget-schema.ts`'s `httpsUrl` validator (but parse-and-check, not regex).

**Test scenarios:**
- Happy path: `parseDocuments({documents: [{title: 'A', url: 'https://x/a.pdf'}]})` returns the document.
- Edge case: `parseDocuments({documents: [{title: 'A', url: 'http://x/a.pdf'}]})` accepts (http allowed).
- Error path: `parseDocuments({documents: [{title: 'X', url: 'javascript:alert(1)'}]})` drops the item, returns `[]`.
- Error path: `parseDocuments({documents: [{title: 'X', url: 'data:text/html,<script>...'}]})` drops.
- Error path: `parseDocuments({documents: [{title: 'X', url: 'vbscript:...'}]})` drops.
- Error path: `parseDocuments({documents: [{title: 'X', url: 'blob:...'}]})` drops.
- Error path: `parseDocuments({documents: [{title: 'X', url: 'not-a-url'}]})` drops (URL parse throws).
- Mixed: an array containing one valid and three invalid URLs returns only the valid one.

**Verification:**
- DOM inspection of rendered cards: no anchor has a non-http/https `href` after rendering an attacker-shaped response.

---

### U5. Renderer fetcher option (replaces window.fetch monkey-patch)

**Goal:** Eliminate the global `window.fetch` mutation in `DisplayPreview` (#3) by injecting the fetcher through `Renderer.mount()`.

**Requirements:** R1 (#3)

**Dependencies:** None (interface change, but ChatRenderer is the only other implementer).

**Files:**
- Modify: `widget/src/core/renderer.ts` (interface)
- Modify: `widget/src/renderers/chat/chat-renderer.ts` (accept and ignore)
- Modify: `widget/src/renderers/display/display-renderer.ts` (read from options)
- Modify: `components/configurator/display-preview.tsx` (pass fetcher, remove window.fetch mutation)
- Modify: `tests/unit/widget/renderer-interface.test.ts`
- Modify: `tests/unit/widget/chat-renderer.test.ts`
- Modify: `tests/unit/widget/display/display-renderer.test.ts`

**Approach:**
- `Renderer.mount(runtimeConfig, container, options?: { fetcher?: typeof fetch })`.
- `DisplayRenderer`: store `this.fetcher = options?.fetcher ?? globalThis.fetch.bind(globalThis)` in `mount()`, then call `this.fetcher(...)` instead of `fetch(...)` in `fire()`.
- `ChatRenderer`: extend signature to accept and ignore the third arg; tests already cover that container is ignored.
- `DisplayPreview`: build a stub fetcher inline, pass via the new options arg. Remove the entire `originalFetch = window.fetch; window.fetch = ...` block and matching cleanup.

**Execution note:** Test-first — write a `DisplayRenderer` test that asserts `window.fetch` is unchanged before and after `mount()` when a fetcher is provided.

**Test scenarios:**
- Happy path: `DisplayRenderer.mount(config, container, { fetcher: stub })` uses the stub for the auto-fire.
- Happy path: `DisplayRenderer.mount(config, container)` (no options) uses `globalThis.fetch`.
- Regression: `Renderer` interface test stub satisfies the new signature.
- Regression: existing `DisplayRenderer` test that spied on `global.fetch` still works (or migrates to the fetcher option pattern — implementer's call).
- Edge case: `DisplayPreview` mounted in jsdom does not modify `globalThis.fetch`. Verified by capturing `globalThis.fetch === originalFetch` before and after.

**Verification:**
- No reference to `window.fetch = ` anywhere in `components/configurator/display-preview.tsx`.
- Concurrent fetches on a page where `DisplayPreview` is mounted are not intercepted by the preview stub.

---

### U6. Trigger message validation + localhost-bypass tightening

**Goal:** Reject empty `triggerMessage` at schema time (#6) and fix the substring-`'localhost'` bypass in `httpsUrl` (#7).

**Requirements:** R1 (#6, #7), R5

**Dependencies:** None.

**Files:**
- Modify: `lib/validation/display-widget-schema.ts`
- Modify: `app/api/widgets/[id]/deploy/route.ts` (the deploy route has its own localhost check at line ~123 with the same bug)
- Modify: `tests/unit/validation/display-widget-schema.test.ts`

**Approach:**
- `triggerMessage: z.string().min(1, 'Trigger message is required').max(500)`.
- `httpsUrl`: replace the `u.includes('localhost')` check with a URL-parse-and-check pattern. Allow when `parsed.protocol === 'https:'` OR `(parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')`. Wrap in try/catch so malformed URLs cleanly fail with the existing Zod error.
- The deploy route's localhost-aware URL check at the same site uses the same predicate — apply the same fix.

**Test scenarios:**
- Happy path: webhookUrl `'https://example.com/wh'` accepted.
- Happy path: webhookUrl `'http://localhost:3000/wh'` accepted (R5 — previously untested).
- Happy path: webhookUrl `'http://127.0.0.1:3000/wh'` accepted.
- Error path: webhookUrl `'http://attacker.com/?ref=localhost'` rejected (the substring-bypass case).
- Error path: webhookUrl `'http://localhost.attacker.com/'` rejected (subdomain bypass).
- Error path: webhookUrl `'http://evil.com/#localhost'` rejected.
- Error path: triggerMessage `''` rejected with the new error message.
- Happy path: triggerMessage `'List required documents.'` accepted.
- Edge case: triggerMessage with 500 chars accepted; 501 rejected.

**Verification:**
- Cannot save a display widget with an empty triggerMessage through the configurator.
- Cannot save a display widget with a plaintext-HTTP webhook URL whose hostname is not literally `localhost` or `127.0.0.1`.

---

### U7. Tier 'free' bypass fix via normalization

**Goal:** Prevent the `tier as any = 'free'` path from silently bypassing all tier checks in `createWidgetConfigSchema` (#8).

**Requirements:** R1 (#8)

**Dependencies:** None.

**Files:**
- Modify: `lib/validation/widget-schema.ts` (add and export `normalizeTier`)
- Modify: `app/api/widgets/route.ts`
- Modify: `app/api/widgets/[id]/route.ts`
- Modify: `app/api/widgets/[id]/deploy/route.ts`
- Test: extend `tests/unit/validation/widget-schema-dispatch.test.ts` or new `tier-normalize.test.ts`

**Approach:**
- Add `export function normalizeTier(raw: string | null | undefined): LicenseTier`. Returns `raw` when it's `'basic' | 'pro' | 'agency'`, else `'basic'`. JSDoc the function as the canonical entry point for any user-derived or schema-passed tier value.
- At the three API call sites, replace `tier as any` with `normalizeTier(rawTier)` before passing to `getWidgetConfigSchemaForKind`.
- Remove the existing `tier as any` casts at:
  - `app/api/widgets/route.ts:152`
  - `app/api/widgets/[id]/route.ts:211`
  - `app/api/widgets/[id]/deploy/route.ts:88`

**Patterns to follow:**
- The existing `createDefaultConfig` already normalizes internally (per kieran-ts review note); the new helper makes the normalization explicit at the boundary.

**Test scenarios:**
- Happy path: `normalizeTier('basic')` returns `'basic'`.
- Happy path: `normalizeTier('pro')` returns `'pro'`.
- Happy path: `normalizeTier('agency')` returns `'agency'`.
- Edge case: `normalizeTier('free')` returns `'basic'`.
- Edge case: `normalizeTier(null)` returns `'basic'`.
- Edge case: `normalizeTier(undefined)` returns `'basic'`.
- Edge case: `normalizeTier('garbage')` returns `'basic'`.
- Integration: POST `/api/widgets` as a `'free'`-tier user successfully creates a chat widget validated against the basic schema (no silent bypass). DB-dependent, `it.skip` if needed.

**Verification:**
- `grep "tier as any" app/api/widgets/` returns no matches.
- A free-tier user cannot deploy an agency-only branding configuration (the regression the original bug enabled).

---

### U8. DisplayRenderer correctness pass

**Goal:** Resolve the cluster of DisplayRenderer-internal bugs: theme injection (#10), fetch timeout (#9), retry race (#11), captureContext toggle (#12), updateCount NPE guard (#13).

**Requirements:** R1 (#9–#13), R5

**Dependencies:** U5 (the fetcher option lands first because U8 modifies `mount()` heavily).

**Files:**
- Modify: `widget/src/renderers/display/display-renderer.ts`
- Modify: `tests/unit/widget/display/display-renderer.test.ts`

**Approach:**
- **Theme injection (#10):** in `mount()`, after `this.sidebar.mount(container)`, read `runtimeConfig.uiConfig.theme.color` and set CSS variables on the sidebar root via `root.style.setProperty('--cw-color-accent', color.accent)` for each of accent/surface/text/subText/border. Also set radius and density variables if the existing CSS-variables convention covers them (consult `widget/src/theming/css-variables.ts` for the canonical variable names).
- **Fetch timeout (#9):** wrap `this.fetcher(...)` call with `AbortSignal.any([this.abort.signal, AbortSignal.timeout(8000)])` (8s matches chat widget's project-standard). Catch `TimeoutError` distinctly and render the error state with a timeout message.
- **Retry race (#11):** add `private isFiring = false`. Set to `true` at the top of `fire()`, set to `false` in a `finally`. If `fire()` is called while already firing, return early. The existing AbortController dance still runs first so a retry click during a stalled fetch still aborts the previous one — but two rapid clicks within the same event-loop tick won't both enter the body.
- **captureContext toggle (#12):** change the `context:` line in the payload builder call from `this.capturePageContext()` to `runtimeConfig.uiConfig.connection?.captureContext === false ? {} : this.capturePageContext()`.
- **updateCount NPE guard (#13):** change `this.sidebar.updateCount(...)` to `this.sidebar?.updateCount(...)` on both call sites in `fire()`. Also tighten the non-null assertion `this.runtimeConfig!.uiConfig` in `setState()` to `if (!this.sidebar || !this.runtimeConfig) return;` and use `this.runtimeConfig.uiConfig` without the bang.

**Execution note:** Each fix is independent — write its failing test first, then the fix. Combining into one commit is fine; combining test writing for all five before any fix is acceptable, but recommend per-fix TDD for clarity.

**Test scenarios:**
- **Theme injection** — happy path: mount with `theme.color.accent = '#ff0000'`, assert `getComputedStyle(sidebarRoot).getPropertyValue('--cw-color-accent') === '#ff0000'`.
- **Theme injection** — happy path: light vs. dark colorScheme map to the right variables.
- **Fetch timeout** — error path: provide a fetcher that never resolves; advance jest fake timers by 8001ms; assert error state rendered with timeout message; assert dispose-style cleanup.
- **Retry race** — error path: two rapid `onRetry()` calls — assert `fire()` body runs only once (mock fetcher counts calls); first AbortController is aborted, second runs to completion.
- **captureContext toggle** — happy path: `captureContext: false` in config → payload `context` is `{}`.
- **captureContext toggle** — happy path: `captureContext: true` (or unset) → payload `context` has `pageUrl` etc.
- **updateCount NPE guard** — error path: simulate `dispose()` between the fetch resolution and the `updateCount` call — assert no TypeError thrown, no DOM mutation post-dispose.

**Verification:**
- The configurator's theme controls visibly affect the deployed widget's accent color.
- A stalled n8n response surfaces a timeout error within 8 seconds rather than infinite loading.
- A `captureContext: false` widget sends an empty `context` to the relay.

---

### U9. Bootstrap script selection + parseDocuments hardening

**Goal:** Replace last-wins script selection with `document.currentScript` (#15); make `parseDocuments` surface a clearer signal when items are dropped (#14).

**Requirements:** R2 (#14, #15)

**Dependencies:** None.

**Files:**
- Modify: `widget/src/index.ts`
- Modify: `widget/src/renderers/display/display-renderer.ts` (parseDocuments)
- Test: `tests/unit/widget/bootstrap-script-selection.test.ts` (new, or add to existing index test if one exists)
- Modify: `tests/unit/widget/display/display-renderer.test.ts`

**Approach:**
- **Bootstrap script selection (#15):** at the top of the IIFE (synchronously, before any `await` or event listener), capture `document.currentScript` into a constant. Use that as the script source for `data-*` attribute reads and `url` parsing. Fall back to the last-wins selection only if `document.currentScript` is null (e.g., async script with no module context, though this should be rare).
- **parseDocuments hardening (#14):** when items are dropped due to type/scheme mismatch, log a one-line `console.warn` with the count and the title-of-first-rejected for diagnostic value. Do not change the return shape (still filter silently from the caller's perspective). Bonus: when ALL items are dropped (and the array was non-empty), surface as an `error` state rather than `empty` — the host page told us there were docs but the widget couldn't accept any.

**Test scenarios:**
- **Script selection** — happy path: mount in a jsdom doc with `document.currentScript` set; assert the bootstrap reads attributes from it, not the last script.
- **Script selection** — fallback: `document.currentScript === null` and only one matching script exists; the last-wins fallback still works.
- **parseDocuments** — error path: input `{documents: [{title: 'a', url: 'javascript:'}, {title: 'b', url: 'javascript:'}]}` returns `null` (or triggers `error` state), not `[]`/`empty`.
- **parseDocuments** — partial-drop: input with one valid and one invalid item warns once and returns the valid item.
- **parseDocuments** — happy path: all valid → silent (no warn).

**Verification:**
- Two `<script src="/w/abc.js">` tags on the same page each pick up their own attributes.
- Console contains a warn (not error) when an attacker-shaped payload arrives with some valid entries.

---

### U10. P2 cleanup pass

**Goal:** Resolve the P2 findings (#17–#25) — dead imports, naming clarity, jest env annotation, double-display overlap, hybrid config pollution, V2 deploy edge cases.

**Requirements:** R3 (#17–#25)

**Dependencies:** U1, U7 (the helpers and tier work need to land first because some P2 items are downstream of those changes).

**Files:**
- Modify: `app/api/widgets/route.ts` (remove dead `createWidgetConfigSchema` import — #17)
- Modify: `widget/src/types.ts` (rename `WidgetRuntimeConfig.display` → `WidgetRuntimeConfig.embedMode` — #18, or document the naming if rename is too disruptive)
- Modify: `app/api/widgets/[id]/route.ts` (PATCH body `kind` field — #19: either reject explicitly with a 400 or pass through silently with a doc comment)
- Modify: `widget/src/renderers/display/styles.ts` (z-index strategy for multiple display widgets — #20: bump z-index by 1 per instance, or document the one-per-page constraint)
- Modify: `lib/utils/config-helpers.ts` (createDefaultConfig kind-aware — already done in U1 — confirm #21 closed)
- Modify: `widget/src/renderers/display/display-renderer.ts` (non-null assertion tightening — #22, done in U8 — confirm closed)
- Modify: `app/api/widgets/[id]/deploy/route.ts` (return 404 when user lookup fails — #23 instead of falling through to `'free'` tier)
- Modify: `widget/src/renderers/chat/chat-renderer.ts` (already documents `_container` is unused — #24; close as no-op)
- Modify: `tests/integration/api/widgets-display.test.ts` (add `@jest-environment node` annotation — #25)

**Approach:**
- Most items are single-line changes. Group into one commit per logical concern (naming change, dead-import sweep, jest env annotations, deploy edge case).
- For the `WidgetRuntimeConfig.display` rename (#18): if it touches more than 5 call sites, prefer a doc comment over rename. Implementer's call.
- For the PATCH `kind` field (#19): explicitly reject with `400 Bad Request, {error: 'kind cannot be changed via PATCH'}` if the body contains `kind`. This is friendlier than silent acceptance.

**Test scenarios:**
- #17: typecheck and lint clean after the dead import removal.
- #18: typecheck clean after the rename or doc-comment add.
- #19: PATCH `/api/widgets/[id]` with `{kind: 'chat', ...}` against a `kind: 'display'` widget → 400.
- #20: two `DisplayRenderer` instances on the same page have different z-indices, or the documentation makes the one-per-page constraint explicit.
- #23: deploy route — when `getWidgetById` returns a widget but `getUserById` returns null, response is 404 with `{error: 'User not found'}`. Existing tests verify the licensed path still works.
- #25: `pnpm test tests/integration/api/widgets-display.test.ts` runs in node environment (verifiable via `expect(typeof window)` assertion).

**Verification:**
- All P2 findings move from "open" to "closed" in the review tracker, or — for findings that turn out to be already-resolved by U1/U7/U8 — explicitly noted as covered upstream.

---

### U11. P3 cleanup pass

**Goal:** Resolve the P3 findings (#26–#30).

**Requirements:** R3 (#26–#30)

**Dependencies:** U8 (the renderer refactor is in flight).

**Files:**
- Modify: `widget/src/renderers/display/display-renderer.ts` (CSS injection cleanup on dispose — #26: optional; document the static-CSS assumption if cleanup is skipped)
- Modify: `widget/src/renderers/display/sidebar.ts` (collapse-button listener cleanup on dispose — #27)
- Modify: `widget/src/renderers/display/display-renderer.ts` (`catch (err: unknown)` with `instanceof Error` narrowing — #28)
- Modify: `lib/db/queries.ts` (document `updateWidget` does not accept `kind` — #29, or add a runtime check that rejects kind in the input)
- Test: `tests/unit/widget/display/sidebar.test.ts` (add the pre-mount and post-dispose `getBodyElement` throw tests — #30)

**Approach:**
- Each item is small. Group into one or two commits.
- For #26: implementer's call — strict cleanup is cleaner but the static-CSS assumption is sound for the foreseeable future. Document the choice either way.
- For #29: prefer a runtime check (`if ('kind' in data) throw`) over documentation-only. Tests for that check go in `tests/unit/db/queries.test.ts` or wherever query helpers are tested.

**Test scenarios:**
- #27: collapse-button click handler reference is not in the document after `dispose()` (detached DOM check, or a spy on `removeEventListener`).
- #28: `err instanceof Error` branch correctly narrows; no `any` cast remains in the catch.
- #29: `updateWidget(id, {kind: 'chat'})` throws or rejects (depending on whether the function is sync or async).
- #30: `new Sidebar({...}).getBodyElement()` throws pre-mount; after `mount()` then `dispose()`, throws again.

**Verification:**
- All P3 findings closed or explicitly documented as accepted-as-is.

---

### U12. Re-run the focused review

**Goal:** After U1–U11 land, re-run `ce-code-review` scoped to the changed files to confirm the verdict moved from "Not ready" → "Ready to merge" or "Ready with fixes".

**Requirements:** R1, R2, R3 (verification of completion)

**Dependencies:** U1–U11.

**Files:** None modified — verification-only.

**Approach:**
- Run `/ce-code-review mode:report-only base:<U1-base-sha>` (or whatever base captures the fix commits). Read-only mode is intentional — we want to verify, not to enter another fix loop.
- Compare verdict to baseline. Document the delta in the branch commit message or PR description.
- If new findings emerge (especially regressions), open separate follow-up issues rather than continuing this plan.

**Test scenarios:**
- N/A — this is a verification unit, not a behavioral change.

**Verification:**
- Review verdict moves from "Not ready" to "Ready to merge" or "Ready with fixes" (with non-blocking findings only).
- No NEW P0 or P1 findings introduced by the fix pass.

---

## System-Wide Impact

- **Interaction graph:** `stripLegacyConfigProperties` and `createDefaultConfig` are called from POST `/api/widgets`, PATCH `/api/widgets/[id]`, and possibly elsewhere. The kind-aware guard preserves chat-widget behavior. `normalizeTier` is added to the same call sites.
- **Renderer interface change** (`mount()` adds an optional third parameter): both `ChatRenderer` and `DisplayRenderer` implement it. Any future renderer implementations must too. The optional positioning is non-breaking for existing call sites.
- **Error propagation:** the new fetch timeout, retry guard, and updateCount guard tighten the error envelope but don't change which errors surface to users — the error state is still rendered with a retry button.
- **State lifecycle risks:** `DisplayPreview` no longer mutates global state, eliminating a class of races. `DisplayRenderer.dispose()` is now safer to call mid-flight.
- **API surface parity:** chat widget POST/PATCH/deploy unchanged in behavior. The same guards apply to both kinds, but chat takes the existing code path through the guards.
- **Integration coverage:** the round-trip test for POST → DB → GET `/w/[widgetKey]/config` with a display widget is the strongest end-to-end check. Mark `it.skip` when DATABASE_URL is unset; document the gap.
- **Unchanged invariants:** chat widget bootstrap, chat widget config schema, n8n payload shape, the 56 unit tests passing pre-fix, the `Renderer` interface's `mount` and `dispose` core methods (only adding optional parameters).

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `Renderer.mount()` signature change cascades through tests and mocks | All existing tests of `DisplayRenderer` and `ChatRenderer` are updated as part of U5; the change is optional-positional so unaware callers keep working. |
| Theme injection (U8 #10) changes visible rendering — could regress if `--cw-*` variable names disagree with `styles.ts` expectations | Cross-check variable names against `widget/src/renderers/display/styles.ts` before writing. Add a test that asserts the rendered CSS variable matches the configurator's input. |
| `normalizeTier` is a new convention — future code might forget to call it | JSDoc the function as the canonical entry; add a comment on each API route entry point referencing it. |
| The `parseDocuments` change from `empty` to `error` state when all items dropped (#14) is a visible UX shift | Verify against the configurator's stub response — if the empty state is more user-friendly for legitimate empty results, only escalate to `error` when the input was non-empty (the implementer should handle this distinction). |
| Obfuscator non-determinism across builds (per institutional learning) — fix pass involves many widget source changes | Run `pnpm build:widget` and `node --check public/widget/chat-widget.iife.js` at least 3 times with different obfuscation seeds before merging. |
| `WidgetRuntimeConfig.display` rename (#18) could ripple beyond expected scope | Implementer decides between rename and doc-comment based on grep-cardinality. If rename touches more than 5 call sites, defer to a separate refactor commit. |

---

## Documentation / Operational Notes

- Project standards docs (DEVELOPMENT_LOG, decisions.md, CLAUDE.md project structure) are deferred to follow-up work — they're flagged in the review but explicitly out of scope here.
- When the fix branch is ready for PR, the description should reference the code review run artifact (`/tmp/compound-engineering/ce-code-review/20260518-38c9e0c0/`) and which findings each commit resolves.
- The bundle (`public/widget/chat-widget.iife.js`) gets rebuilt and committed at multiple points during the fix pass — the existing commit-the-bundle-with-source pattern continues.

---

## Sources & References

- **Code review run artifact:** `/tmp/compound-engineering/ce-code-review/20260518-38c9e0c0/`
- **Branch:** `feat/document-display-widget`
- **Original feature spec:** `docs/superpowers/specs/2026-05-15-display-widget-design.md`
- **Original feature plan:** `docs/superpowers/plans/2026-05-16-document-display-widget.md`
- **Institutional learnings:** `docs/solutions/build-errors/obfuscator-mid-string-split-crashes-widget-2026-05-06.md`, `docs/solutions/design-patterns/link-preview-cards-with-feature-flag-gating-2026-05-06.md`, `docs/solutions/workflow-issues/vercel-deploy-alias-cache-branch-reconciliation-2026-05-06.md`, `docs/solutions/ui-bugs/chat-widget-link-visibility-2026-05-06.md`

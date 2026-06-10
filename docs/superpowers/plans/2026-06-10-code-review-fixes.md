# Code Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the actionable findings from the 2026-06-10 ce-code-review of `feat/production-readiness` (run `20260610-061226-73c78561`) — two P1 auth/correctness defects, five P2s, four P3 cleanups, and the migration deployment runbook.

**Architecture:** All fixes are small, surgical changes to existing modules — no new subsystems. The two P1s change auth input sourcing (`resolve-widget.ts` stops trusting the `Host` header) and relay config reading (normalize `provider`/`webhookUrl` instead of raw reads). Each task is independently committable; the suite must stay green after every task.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Zod 4, Drizzle ORM, Jest 29.

**Branch:** continue on `feat/production-readiness` (PR #9 is open; these commits land on the same branch).

**Out of scope (deliberately deferred, with reasons):**
- `migrateConfig` caching on hot read paths (M-04) — perf only, no correctness impact; revisit with real traffic data.
- `any`-type holes in `path.ts`/`migrate.ts`/`RelayBody` (M-06/07/08) — broad type refactor, separate PR.
- "Two normalizers must be called together" coupling (M-05) — needs design discussion.
- `isSubscriptionActive` null→active (security, confidence 50) — intentional: users without billing rows are active by design while BILLING_ENABLED=false.
- Widget↔license linkage column for the legacy adapter — Task 4 fails closed instead; adding a column back contradicts the v2 schema direction.

---

### Task 1: Remove Host-header trust from first-party domain check (P1 — finding #11)

`isDomainAllowed` currently returns `true` when `requestDomain === normalizeDomain(requestHost)`, and `requestHost` comes from the client-controlled `Host` header. On self-hosted Node (no fronting proxy that pins Host), an attacker sends `Origin: https://attacker.com` + `Host: attacker.com` and bypasses `allowedDomains`. Fix: derive the first-party domain from the server's own `NEXT_PUBLIC_APP_URL` env (already in `.env.example`), never from the request. Drop the `requestHost` parameter entirely.

**Files:**
- Modify: `lib/widget/resolve-widget.ts`
- Modify: `app/api/w/[widgetKey]/config/route.ts:44-47`
- Modify: `app/api/chat-relay/route.ts:104,126`
- Test: `tests/unit/widget/resolve-widget.test.ts`

- [ ] **Step 1: Write the failing tests**

In `tests/unit/widget/resolve-widget.test.ts`, the existing `isDomainAllowed` tests pass a 4th `requestHost` argument — update every call site in the file to the new 3-arg signature `isDomainAllowed(requestDomain, allowedDomains, userTier)` and every `resolveAuthorizedWidget(key, domain, host)` call to `resolveAuthorizedWidget(key, domain)`. Then add a new describe block:

```typescript
describe('first-party domain (NEXT_PUBLIC_APP_URL)', () => {
  const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  });

  it('allows the app own domain when NEXT_PUBLIC_APP_URL matches', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.io';
    expect(isDomainAllowed('app.example.io', ['customer.com'], 'pro')).toBe(true);
  });

  it('does NOT allow a domain just because the request Host header matched (old bypass)', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.io';
    // attacker.com is neither the app domain nor in allowedDomains
    expect(isDomainAllowed('attacker.com', ['customer.com'], 'pro')).toBe(false);
  });

  it('fails closed when NEXT_PUBLIC_APP_URL is unset', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(isDomainAllowed('app.example.io', ['customer.com'], 'pro')).toBe(false);
  });

  it('fails closed when NEXT_PUBLIC_APP_URL is unparseable', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'not a url';
    expect(isDomainAllowed('not a url', ['customer.com'], 'pro')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm jest tests/unit/widget/resolve-widget.test.ts`
Expected: FAIL — compile error on the 3-arg calls (function still takes 4) and/or the new bypass test failing.

- [ ] **Step 3: Implement in `lib/widget/resolve-widget.ts`**

Replace the first-party block (lines 49-73) and update the docblock + `resolveAuthorizedWidget` signature:

```typescript
/**
 * Resolve the platform's own first-party domain from NEXT_PUBLIC_APP_URL.
 * Returns null when unset/unparseable (no first-party allowance — fail closed).
 *
 * SECURITY: this must come from server config, NEVER from the request's Host
 * header — Host is client-controlled on self-hosted deployments, and trusting
 * it let any origin bypass allowedDomains by sending a matching Host.
 * Read per-call (not module-cached) so tests can vary the env.
 */
function getFirstPartyDomain(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;
  try {
    return normalizeDomain(new URL(appUrl).hostname) || null;
  } catch {
    return null;
  }
}

/**
 * Returns true when `requestDomain` is authorized to use the widget.
 *
 * Rules (short-circuit order):
 *  1. Agency tier → always allowed.
 *  2. No allowedDomains configured (empty array) → always allowed.
 *  3. First-party: request origin matches NEXT_PUBLIC_APP_URL's domain → allowed.
 *  4. localhost → allowed in development only (NODE_ENV !== 'production').
 *  5. allowedDomains list → exact match or subdomain suffix.
 */
export function isDomainAllowed(
  requestDomain: string,
  allowedDomains: string[],
  userTier: string
): boolean {
  if (TIER_LIMITS[normalizeUserTier(userTier)].unlimitedDomains || allowedDomains.length === 0) return true;

  const firstParty = getFirstPartyDomain();
  if (firstParty && requestDomain !== 'unknown' && requestDomain === firstParty) return true;

  // localhost bypass is only for non-production environments.
  // In production this gate is CLOSED to prevent embed-key abuse.
  if (requestDomain === 'localhost' && process.env.NODE_ENV !== 'production') return true;

  return allowedDomains.some((allowed) => {
    const a = normalizeDomain(allowed);
    return a === requestDomain || requestDomain.endsWith(`.${a}`);
  });
}
```

In `resolveAuthorizedWidget`: remove the `requestHost: string` parameter and pass only 3 args to `isDomainAllowed`:

```typescript
export async function resolveAuthorizedWidget(
  widgetKey: string,
  requestDomain: string | null
): Promise<ResolveResult> {
```

and at line 113:

```typescript
  if (!isDomainAllowed(requestDomain, allowed, user.tier || 'free')) {
```

- [ ] **Step 4: Update the two callers**

`app/api/w/[widgetKey]/config/route.ts` — delete line 45 (`const requestHost = ...`) and change line 47 to:

```typescript
    const resolved = await resolveAuthorizedWidget(widgetKey, requestDomain);
```

`app/api/chat-relay/route.ts` — delete line 104 (`const requestHost = ...`) and change line 126 to:

```typescript
    const resolved = await resolveAuthorizedWidget(licenseKey, requestDomain);
```

- [ ] **Step 5: Run tests + type-check**

Run: `pnpm jest tests/unit/widget/resolve-widget.test.ts tests/unit/security && pnpm exec tsc --noEmit`
Expected: PASS, no type errors. (The security suites cover the config + relay routes — they must still pass with the new signature.)

- [ ] **Step 6: Verify NEXT_PUBLIC_APP_URL is documented**

`.env.example` line 20 already has `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Add a comment above it (if not present):

```
# Also used as the trusted first-party domain for widget domain authorization.
# MUST be set in production or first-party embeds (dashboard/demo pages) will 403.
```

- [ ] **Step 7: Commit**

```bash
git add lib/widget/resolve-widget.ts "app/api/w/[widgetKey]/config/route.ts" app/api/chat-relay/route.ts tests/unit/widget/resolve-widget.test.ts .env.example
git commit -m "fix(security): first-party domain check uses NEXT_PUBLIC_APP_URL, not the client-controlled Host header"
```

---

### Task 2: Relay normalizes provider + webhookUrl instead of raw config reads (P1 — finding #12)

`app/api/chat-relay/route.ts:157-158` reads `config.connection.provider` raw from the DB. A legacy/typo provider value (e.g. `'N8N'`, `'webhook'`, or absent `connection`) returns a permanent 400 `Unsupported provider` on every message — unfixable until the owner re-saves the widget. The config endpoint runs `migrateConfig` (which defaults unknown providers to `'n8n'`), so the relay must mirror that behavior with a cheap normalization — not a full migrate on the hot path.

**Files:**
- Modify: `app/api/chat-relay/route.ts`
- Test: `tests/unit/security/chat-relay-security.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/security/chat-relay-security.test.ts` (follow the file's existing mock setup for `resolveAuthorizedWidget` — it mocks `@/lib/widget/resolve-widget`; reuse its helper for building a resolved widget and POST request):

```typescript
describe('relay provider normalization (legacy configs)', () => {
  it('treats an unknown legacy provider as n8n instead of 400', async () => {
    // widget.config has a legacy provider value and a v1 flat webhook url
    mockResolvedWidget({
      config: {
        connection: { provider: 'webhook' }, // legacy value, not in the v2 enum
        n8nWebhookUrl: 'https://n8n.example.com/webhook/abc',
      },
    });
    const res = await POST(buildRelayRequest());
    // Must NOT be 400 "Unsupported provider" — it should attempt the n8n relay
    // (which in this test environment fails at the SSRF/fetch layer, not 400).
    expect(res.status).not.toBe(400);
  });

  it('uppercase provider value is normalized', async () => {
    mockResolvedWidget({
      config: {
        connection: { provider: 'N8N', webhookUrl: 'https://n8n.example.com/webhook/abc' },
      },
    });
    const res = await POST(buildRelayRequest());
    expect(res.status).not.toBe(400);
  });
});
```

(Adapt `mockResolvedWidget`/`buildRelayRequest` to the file's actual helper names — read the file first; it already mocks the resolver and fetch.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm jest tests/unit/security/chat-relay-security.test.ts`
Expected: new tests FAIL (current code returns 400 `Unsupported provider: webhook`).

- [ ] **Step 3: Implement normalization in `app/api/chat-relay/route.ts`**

Add above `POST`:

```typescript
/**
 * Normalize the connection block from a possibly-legacy stored config WITHOUT
 * running the full migrateConfig on the hot relay path.
 *
 * Mirrors migrateConfig semantics for exactly the two fields the relay needs:
 *  - provider: case-insensitive; anything that is not 'chatkit' is treated as
 *    'n8n' (the schema default). A legacy/typo value must degrade to the
 *    default, NOT brick the widget with a permanent 400.
 *  - webhookUrl: canonical v2 path first, then the v1 flat field.
 */
function getRelayConnection(config: any): { provider: 'n8n' | 'chatkit'; webhookUrl?: string } {
  const rawProvider = config?.connection?.provider;
  const provider =
    typeof rawProvider === 'string' && rawProvider.trim().toLowerCase() === 'chatkit'
      ? 'chatkit'
      : 'n8n';
  const webhookUrl = config?.connection?.webhookUrl || config?.n8nWebhookUrl;
  return { provider, webhookUrl };
}
```

Replace lines 157-183 (`const config = ...` through the `Unsupported provider` response):

```typescript
    const config = widget.config as any;
    const { provider, webhookUrl } = getRelayConnection(config);

    if (provider === 'chatkit') {
      if (!CHATKIT_SERVER_ENABLED) {
        return new NextResponse(
          JSON.stringify({ error: 'Provider is disabled' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      return new NextResponse(
        JSON.stringify({
          error: 'ChatKit widgets connect directly to OpenAI via client-side session',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return handleN8nRelay(webhookUrl, body, userTier, corsHeaders);
```

Change `handleN8nRelay`'s signature to take the resolved URL directly (the v1/v2 fallback now lives in one place, `getRelayConnection`):

```typescript
async function handleN8nRelay(
  webhookUrl: string | undefined,
  body: RelayBody,
  userTier: string,
  corsHeaders: Record<string, string>
): Promise<NextResponse> {
  if (!webhookUrl) {
    // ... existing 500 'Webhook URL not configured' response unchanged
```

and delete the old line 199 (`const webhookUrl = config?.n8nWebhookUrl || config?.connection?.webhookUrl;`) and the now-unused `config` parameter.

Note the deliberate precedence flip: canonical `connection.webhookUrl` now wins over legacy `n8nWebhookUrl` (the old code had v1 first — adversarial finding ADV-008).

- [ ] **Step 4: Run tests + type-check**

Run: `pnpm jest tests/unit/security/chat-relay-security.test.ts tests/unit/chat-relay.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat-relay/route.ts tests/unit/security/chat-relay-security.test.ts
git commit -m "fix(relay): normalize legacy provider/webhookUrl instead of raw config reads (permanent-400 bug)"
```

---

### Task 3: Cap the buffered n8n response size (P2 — finding #14, ADV-003)

`handleN8nRelay` does `await response.text()` with no limit — a compromised/misbehaving webhook returning gigabytes OOMs the serverless function. Cap at 1 MB: reject via `Content-Length` when declared, and enforce while streaming when not.

**Files:**
- Modify: `app/api/chat-relay/route.ts`
- Test: `tests/unit/security/chat-relay-security.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
describe('relay response size cap', () => {
  it('rejects an upstream response larger than 1MB with 502', async () => {
    mockResolvedWidget({
      config: { connection: { provider: 'n8n', webhookUrl: 'https://n8n.example.com/webhook/abc' } },
    });
    // Mock global fetch to return an oversized body
    const big = 'x'.repeat(1_000_001);
    global.fetch = jest.fn().mockResolvedValue(
      new Response(big, { status: 200, headers: { 'Content-Type': 'text/plain' } })
    ) as any;
    // If the suite mocks assertPublicWebhookUrl, keep that mock returning the URL.
    const res = await POST(buildRelayRequest());
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/too large/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest tests/unit/security/chat-relay-security.test.ts -t "size cap"`
Expected: FAIL (currently returns 200 with the full body).

- [ ] **Step 3: Implement**

Add near the top of `app/api/chat-relay/route.ts`:

```typescript
/** Max upstream response body the relay will buffer (bytes). */
const N8N_MAX_RESPONSE_BYTES = 1_000_000;

/**
 * Read a response body with a hard byte cap. Returns null when the body
 * exceeds the cap (declared via Content-Length or discovered while streaming).
 * The relay buffers the whole body to re-serialize it as JSON, so an unbounded
 * upstream body is an OOM vector — cap it.
 */
async function readBodyCapped(response: Response, maxBytes: number): Promise<string | null> {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return null;

  if (!response.body) {
    const text = await response.text();
    return text.length > maxBytes ? null : text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buf);
}
```

In `handleN8nRelay`, replace `const responseText = await response.text();` with:

```typescript
    const responseText = await readBodyCapped(response, N8N_MAX_RESPONSE_BYTES);
    if (responseText === null) {
      console.error('[Chat Relay] N8n response exceeded size cap — rejected');
      return new NextResponse(
        JSON.stringify({ error: 'Workflow response too large' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
```

- [ ] **Step 4: Run tests + type-check**

Run: `pnpm jest tests/unit/security/chat-relay-security.test.ts tests/unit/chat-relay.test.ts && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat-relay/route.ts tests/unit/security/chat-relay-security.test.ts
git commit -m "fix(relay): cap buffered n8n response at 1MB (OOM guard)"
```

---

### Task 4: Legacy compat adapter fails closed on ambiguous widget (P2 — finding #13)

`app/api/widget/[license]/chat-widget.js/route.ts` serves the user's **first** active widget for a legacy license-key embed. For a multi-widget user that is silently the wrong widget. The proper fix (widget↔license link) contradicts the v2 schema; instead: serve the widget only when the user has **exactly one** active widget, otherwise return the JS-comment 404 and log. Single-widget users (the overwhelming legacy case) keep working; ambiguous cases fail visibly instead of wrongly.

**Files:**
- Modify: `lib/db/queries.ts` (replace `getFirstActiveWidgetForUser`)
- Modify: `app/api/widget/[license]/chat-widget.js/route.ts`
- Test: `tests/unit/security/widget-serve-route.test.ts` (this suite covers the compat adapter — read it first and extend; if it does not cover this route, create `tests/unit/api/widget-compat-adapter.test.ts` with the same mock style)

- [ ] **Step 1: Write the failing test**

```typescript
it('returns JS-comment 404 when the user has more than one active widget (ambiguous legacy embed)', async () => {
  mockGetLicenseByKey({ status: 'active', userId: 'user-1' });
  mockGetActiveWidgetsForUser([
    { id: 'w1', widgetKey: 'AAAAAAAAAAAAAAAA' },
    { id: 'w2', widgetKey: 'BBBBBBBBBBBBBBBB' },
  ]);
  const res = await GET(buildRequest('valid-license-key'));
  expect(res.status).toBe(404);
  expect(await res.text()).toContain('widget unavailable');
});

it('serves the bootstrap when the user has exactly one active widget', async () => {
  mockGetLicenseByKey({ status: 'active', userId: 'user-1' });
  mockGetActiveWidgetsForUser([{ id: 'w1', widgetKey: 'AAAAAAAAAAAAAAAA' }]);
  const res = await GET(buildRequest('valid-license-key'));
  expect(res.status).toBe(200);
  expect(await res.text()).toContain('AAAAAAAAAAAAAAAA');
});
```

(Adapt mock helper names to the suite's existing pattern — it already mocks `@/lib/db/queries`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest tests/unit/security/widget-serve-route.test.ts`
Expected: FAIL — `getActiveWidgetsForUser` does not exist yet.

- [ ] **Step 3: Add the query in `lib/db/queries.ts`**

Replace `getFirstActiveWidgetForUser` (line 855; it has no other callers) with:

```typescript
/**
 * Get up to `limit` active widgets for a user, ordered by createdAt ascending.
 * Used by the legacy /api/widget/[license]/chat-widget.js compat adapter, which
 * must serve a widget ONLY when the answer is unambiguous (exactly one active
 * widget). limit=2 is enough to distinguish 0 / 1 / many.
 */
export async function getActiveWidgetsForUser(userId: string, limit = 2): Promise<Widget[]> {
  return db
    .select()
    .from(widgets)
    .where(
      and(
        eq(widgets.userId, userId),
        eq(widgets.status, 'active')
      )
    )
    .orderBy(widgets.createdAt)
    .limit(limit);
}
```

- [ ] **Step 4: Update the adapter route**

In `app/api/widget/[license]/chat-widget.js/route.ts`, change the import and Step 2 block:

```typescript
import { getLicenseByKey, getActiveWidgetsForUser } from '@/lib/db/queries';
```

```typescript
    // Step 2: Find the owner's active widgets. The legacy URL carries no widget
    // identity, so we can only resolve it safely when the user has EXACTLY ONE
    // active widget. With 2+ widgets, serving the first would silently render
    // the wrong widget on the customer's site — fail closed and log instead.
    const activeWidgets = await getActiveWidgetsForUser(license.userId, 2);
    if (activeWidgets.length !== 1 || !activeWidgets[0].widgetKey) {
      if (activeWidgets.length > 1) {
        console.warn(
          `[Widget Compat Adapter] License ${licenseKey.slice(0, 8)}... has ${activeWidgets.length}+ active widgets — ambiguous legacy embed, refusing to guess. Re-embed with the widgetKey snippet.`
        );
      }
      return JS_UNAVAILABLE;
    }
    const widget = activeWidgets[0];
```

Also update the file's doc comment ("find the owner's first active widget" → "resolve the owner's single active widget; ambiguous (2+) fails closed").

- [ ] **Step 5: Run tests + type-check**

Run: `pnpm jest tests/unit/security/widget-serve-route.test.ts tests/unit/db 2>/dev/null || pnpm jest tests/unit/security/widget-serve-route.test.ts; pnpm exec tsc --noEmit`
Expected: PASS, no remaining references to `getFirstActiveWidgetForUser` (`grep -rn getFirstActiveWidgetForUser app lib tests scripts` returns nothing).

- [ ] **Step 6: Commit**

```bash
git add lib/db/queries.ts "app/api/widget/[license]/chat-widget.js/route.ts" tests/unit/security/widget-serve-route.test.ts
git commit -m "fix(compat): legacy adapter fails closed when widget resolution is ambiguous"
```

---

### Task 5: Map canonical shadeLevel (0-20) to runtime shade (-4..4) (P2 — finding #15, M-03)

Canonical `colorSystem.shadeLevel` is 0-20 (sidebar slider, default 10), but the runtime `GrayscaleConfig.shade` consumed by `generateGrayscalePalette` expects -4..4 (`widget/src/theming/css-variables.ts:54` applies `shade * 2` % lightness). `translate-config.ts:69` passes the 0-20 value straight through, so the **default config** ships `shade: 10` → +20% lightness, far outside the intended ±8%. Fix at the translation boundary: keep canonical 0-20 (UI + stored data unchanged), convert in `translateConfig`. `chatkit.grayscaleShade` is already -4..4 and needs no change.

**Files:**
- Modify: `lib/widget/translate-config.ts:65-71`
- Modify: `lib/widget-config/schema.ts:125` (comment only — document the two scales)
- Test: `tests/unit/widget/translate-config.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
describe('shadeLevel scale mapping', () => {
  it('maps canonical default 10 to runtime shade 0 (neutral)', () => {
    const cfg = makeCanonicalConfig({ colorSystem: { useTintedGrayscale: true, tintHue: 220, tintLevel: 5, shadeLevel: 10 } });
    const out = translateConfig(cfg, 'https://app.test', 'k', 'pro', false);
    expect(out.theme?.color?.grayscale?.shade).toBe(0);
  });

  it('maps canonical 0 to -4 and canonical 20 to +4', () => {
    const lo = makeCanonicalConfig({ colorSystem: { useTintedGrayscale: true, tintHue: 220, tintLevel: 5, shadeLevel: 0 } });
    const hi = makeCanonicalConfig({ colorSystem: { useTintedGrayscale: true, tintHue: 220, tintLevel: 5, shadeLevel: 20 } });
    expect(translateConfig(lo, 'https://app.test', 'k', 'pro', false).theme?.color?.grayscale?.shade).toBe(-4);
    expect(translateConfig(hi, 'https://app.test', 'k', 'pro', false).theme?.color?.grayscale?.shade).toBe(4);
  });
});
```

(Use the file's existing canonical-config builder helper; if it builds via `migrateConfig({})` + overrides, follow that pattern.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm jest tests/unit/widget/translate-config.test.ts -t shadeLevel`
Expected: FAIL (shade comes through as 10/0/20).

- [ ] **Step 3: Implement in `lib/widget/translate-config.ts`**

Replace the grayscale block:

```typescript
  if (cs.useTintedGrayscale) {
    theme.color.grayscale = {
      hue: cs.tintHue,
      tint: cs.tintLevel,
      // Canonical shadeLevel is a 0-20 slider (10 = neutral); the runtime
      // GrayscaleConfig.shade is -4..4 (css-variables.ts applies shade*2 %
      // lightness). Map linearly: 0→-4, 10→0, 20→+4. Conversion lives HERE,
      // at the canonical→runtime boundary, so stored configs and the sidebar
      // slider keep the 0-20 scale.
      shade: Math.round((cs.shadeLevel - 10) * 0.4),
    };
  }
```

- [ ] **Step 4: Document the dual scale in `lib/widget-config/schema.ts`**

Extend the comment at line 125:

```typescript
 * tintLevel/shadeLevel ranges mirror the config-sidebar slider caps (0–20,
 * 10 = neutral). NOTE: the runtime GrayscaleConfig.shade consumed by the
 * widget bundle is -4..4 — lib/widget/translate-config.ts converts at the
 * boundary. chatkit.grayscaleShade is already stored as -4..4 (ChatKit's
 * native scale) and is NOT converted.
```

- [ ] **Step 5: Run tests + type-check**

Run: `pnpm jest tests/unit/widget/translate-config.test.ts && pnpm exec tsc --noEmit`
Expected: PASS. If any existing translate-config test asserted `shade: 10` pass-through, update it — the old behavior was the bug.

- [ ] **Step 6: Commit**

```bash
git add lib/widget/translate-config.ts lib/widget-config/schema.ts tests/unit/widget/translate-config.test.ts
git commit -m "fix(theme): map canonical shadeLevel 0-20 to runtime shade -4..4 at translate boundary"
```

---

### Task 6: ChatKit popup template — safe interpolation of DB values (P2 — finding #17)

`app/w/[widgetKey]/route.ts` (~line 289) builds served JavaScript with template literals: `iframe.src = "${widgetUrl}"` and `background: ${accentColor}`. `accentColor` comes from the stored config; current write paths hex-validate it, but legacy blobs predate that — a value like `#000;"; }; evil(); //` would execute on the customer page. Defense-in-depth: hex-validate the color, `JSON.stringify` the URL.

**Files:**
- Modify: `app/w/[widgetKey]/route.ts`
- Test: `tests/unit/security/public-config-security.test.ts` (extend if it covers this route; otherwise add the assertions to whichever suite covers `app/w/[widgetKey]` — find it with `grep -rln "app/w/" tests/`; if none exists, create `tests/unit/security/chatkit-popup-template.test.ts` testing the route handler with a mocked widget)

- [ ] **Step 1: Write the failing test**

```typescript
it('does not interpolate a non-hex accentColor into the served popup script', async () => {
  mockWidget({
    widgetType: 'chatkit',
    embedType: 'popup',
    config: { chatkitAccentPrimary: '#fff;}};alert(1);//' },
  });
  const res = await GET(buildRequest('AAAAAAAAAAAAAAAA'));
  const js = await res.text();
  expect(js).not.toContain('alert(1)');
  expect(js).toContain('#0f172a'); // fell back to the default
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest <chosen test file>`
Expected: FAIL (malicious string appears verbatim in the script).

- [ ] **Step 3: Implement**

In the popup branch of `app/w/[widgetKey]/route.ts`, replace the accentColor/widgetUrl handling:

```typescript
        const config = widget.config as any;
        // Served-JS injection guard: these values are interpolated into a
        // script we serve to customer pages. Write paths validate them today,
        // but legacy rows predate that validation — never trust stored data
        // when building executable output.
        const rawAccent = config?.chatkitAccentPrimary || config?.accentColor || '#0f172a';
        const accentColor = /^#[0-9A-Fa-f]{3,8}$/.test(String(rawAccent)) ? String(rawAccent) : '#0f172a';
```

And everywhere the template embeds `widgetUrl` (both inline and popup branches), change:

```typescript
  iframe.src = "${widgetUrl}";
```

to:

```typescript
  iframe.src = ${JSON.stringify(widgetUrl)};
```

(`position` feeds a ternary producing fixed strings — already safe; leave it.)

- [ ] **Step 4: Run tests + type-check**

Run: `pnpm jest <chosen test file> && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/w/[widgetKey]/route.ts" tests/
git commit -m "fix(security): hex-validate accentColor and JSON-encode URLs in served ChatKit popup script"
```

---

### Task 7: Remove sanitizeConfig defaults that suppress schema defaults (P2 — finding #16, M-02)

`sanitizeConfig` runs **before** the canonical Zod parse, so its hardcoded fallbacks (`companyName = 'My Company'`, `firstMessage = 'Hello! How can I assist you today?'`) suppress the schema's own defaults — the exact divergence already fixed for `welcomeText` in commit 17ab127. Remove both; keep the genuine repairs (hex fixing, https coercion, tier coercion, launcherIcon repair) which the schema cannot do.

**Files:**
- Modify: `lib/utils/config-helpers.ts:62,70`
- Test: `tests/lib/zip-generator-sanitize.test.ts` (covers sanitizeConfig)

- [ ] **Step 1: Check schema defaults match**

Run: `grep -n "companyName\|firstMessage" lib/widget-config/schema.ts`
Confirm both fields have `.default(...)` in the canonical schema. If `firstMessage` has no schema default, add one to the branding section: `.default('Hello! How can I assist you today?')` — the value must live in exactly one place.

- [ ] **Step 2: Write/adjust the tests**

In `tests/lib/zip-generator-sanitize.test.ts`: if existing tests assert `companyName === 'My Company'` or the firstMessage fallback after sanitize, invert them:

```typescript
it('leaves missing companyName/firstMessage absent so the canonical schema default applies', () => {
  const result = sanitizeConfig({ branding: {} }, 'pro', 'chat');
  expect(result.branding.companyName).toBeUndefined();
  expect(result.branding.firstMessage).toBeUndefined();
});
```

- [ ] **Step 3: Run tests to verify the new one fails**

Run: `pnpm jest tests/lib/zip-generator-sanitize.test.ts`
Expected: new test FAILS (sanitize currently injects both).

- [ ] **Step 4: Implement**

In `lib/utils/config-helpers.ts` delete line 62 (`if (!sanitized.branding.companyName) ...`) and line 70 (`if (!sanitized.branding.firstMessage) ...`), replacing them with the same style of comment used for welcomeText:

```typescript
    // companyName / firstMessage fallbacks intentionally removed: sanitize runs
    // BEFORE safeParse, so hardcoding values here suppressed the canonical
    // schema defaults (same divergence class as the welcomeText fix). Let the
    // schema apply them.
```

- [ ] **Step 5: Run the full affected surface**

Run: `pnpm jest tests/lib/zip-generator-sanitize.test.ts tests/lib/zip-generator.test.ts tests/unit/api && pnpm exec tsc --noEmit`
Expected: PASS. If a zip-generator test relied on `My Company` appearing in generated output, update it to the schema default (check `lib/widget-config/schema.ts` for the actual default value).

- [ ] **Step 6: Commit**

```bash
git add lib/utils/config-helpers.ts tests/lib/zip-generator-sanitize.test.ts
git commit -m "fix(config): sanitizeConfig no longer shadows canonical schema defaults"
```

---

### Task 8: Preview bridge — source guard + concurrent-mount guard (P3 — findings #18, ADV-005)

Two small hardening fixes in `widget/src/preview/preview-bridge.ts`: (1) the message handler accepts `widget:config` from any frame — guard on `event.source === window.parent`; (2) two rapid configs race the async teardown/mount — serialize by queueing the latest config behind the in-flight mount.

**Files:**
- Modify: `widget/src/preview/preview-bridge.ts`
- Test: locate with `grep -rln "preview-bridge\|initPreviewBridge" tests/ widget/` and extend; if no test exists, add `tests/widget/preview-bridge.test.ts` (jsdom)

- [ ] **Step 1: Write the failing tests**

```typescript
it('ignores widget:config from a non-parent source', () => {
  initPreviewBridge();
  const evt = new MessageEvent('message', {
    data: { type: 'widget:config', kind: 'chat', config: {} },
    source: window, // NOT window.parent
  });
  window.dispatchEvent(evt);
  expect(document.querySelector('[data-n8n-widget-root]')).toBeNull();
});
```

(For the race: a unit test of interleaved async mounts is brittle in jsdom — cover the source guard in the test and rely on the serialization logic below being synchronous-by-construction.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest <preview-bridge test path>`
Expected: FAIL (bridge mounts regardless of source).

- [ ] **Step 3: Implement**

In `initPreviewBridge`, restructure the handler:

```typescript
  // Serialize mounts: a second widget:config arriving while a mount is in
  // flight must not interleave teardown/mount (double-mount race). We keep
  // only the LATEST pending config — intermediate configs are obsolete.
  let mountInFlight = false;
  let pendingMsg: any = null;

  async function mountFromMessage(msg: any): Promise<void> {
    // ... existing try/catch mount body, unchanged ...
  }

  window.addEventListener('message', (event: MessageEvent) => {
    // Only the embedding parent may drive the preview. The iframe is sandboxed
    // (null origin), so origin checks are unavailable — source identity is the
    // strongest available check.
    if (event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || msg.type !== 'widget:config') return;

    if (mountInFlight) {
      pendingMsg = msg; // coalesce: newest config wins
      return;
    }
    void (async () => {
      mountInFlight = true;
      try {
        await mountFromMessage(msg);
        while (pendingMsg) {
          const next = pendingMsg;
          pendingMsg = null;
          await mountFromMessage(next);
        }
      } finally {
        mountInFlight = false;
      }
    })();
  });
```

Move the existing async handler body into `mountFromMessage` verbatim (teardown, container creation, renderer mount, the `widget:mounted`/`widget:error` postMessages, readyTimer clearing).

- [ ] **Step 4: Run tests + rebuild widget**

Run: `pnpm jest <preview-bridge test path> && pnpm build:widget && pnpm exec tsc --noEmit`
Expected: PASS, widget builds. Manually sanity-check the configurator preview still live-updates (`pnpm dev`, open `/configurator/chat`, drag a color slider).

- [ ] **Step 5: Commit**

```bash
git add widget/src/preview/preview-bridge.ts tests/
git commit -m "fix(preview): bridge accepts config only from parent frame; serialize concurrent mounts"
```

---

### Task 9: Extract shared getRequestDomain helper (P3 — finding #21, M-01)

`getRequestDomain` is duplicated in `app/api/chat-relay/route.ts:51-68` and `app/api/w/[widgetKey]/config/route.ts:25-35` — and the copies differ (relay falls back to Referer when Origin is unparseable; config route does not). Extract the relay's more robust version into `lib/widget/resolve-widget.ts` (the module both routes already import).

**Files:**
- Modify: `lib/widget/resolve-widget.ts`
- Modify: `app/api/chat-relay/route.ts`
- Modify: `app/api/w/[widgetKey]/config/route.ts`
- Test: `tests/unit/widget/resolve-widget.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
describe('getRequestDomain', () => {
  const req = (headers: Record<string, string>) =>
    ({ headers: { get: (k: string) => headers[k.toLowerCase()] ?? null } });

  it('prefers origin over referer', () => {
    expect(getRequestDomain(req({ origin: 'https://a.com', referer: 'https://b.com/page' }))).toBe('a.com');
  });

  it('falls back to referer when origin is unparseable', () => {
    expect(getRequestDomain(req({ origin: 'null', referer: 'https://b.com/page' }))).toBe('b.com');
  });

  it('returns null when both are absent', () => {
    expect(getRequestDomain(req({}))).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm jest tests/unit/widget/resolve-widget.test.ts -t getRequestDomain`
Expected: FAIL — not exported.

- [ ] **Step 3: Implement in `lib/widget/resolve-widget.ts`**

```typescript
/** Minimal header-bag interface so this lib module does not import next/server. */
interface HeaderCarrier {
  headers: { get(name: string): string | null };
}

/**
 * Extract a normalized domain from an Origin or Referer header value.
 * Returns null when the header is absent or the URL is unparseable.
 */
function normalizeDomainFromHeader(urlHeader: string | null): string | null {
  if (!urlHeader) return null;
  try {
    const normalized = normalizeDomain(new URL(urlHeader).hostname);
    return normalized || null;
  } catch {
    return null;
  }
}

/**
 * Normalized request domain from Origin (preferred) or Referer (fallback).
 * Falls back to Referer even when Origin is PRESENT but unparseable (e.g.
 * 'null' from sandboxed iframes) — the previous config-route copy did not,
 * which was a behavioral divergence between the two routes.
 */
export function getRequestDomain(request: HeaderCarrier): string | null {
  return (
    normalizeDomainFromHeader(request.headers.get('origin')) ||
    normalizeDomainFromHeader(request.headers.get('referer'))
  );
}
```

- [ ] **Step 4: Update both routes**

In `app/api/chat-relay/route.ts`: delete the local `normalizeDomainFromHeader` + `getRequestDomain` (lines 47-68) and the now-unused `normalizeDomain` import; add `getRequestDomain` to the existing `@/lib/widget/resolve-widget` import.

In `app/api/w/[widgetKey]/config/route.ts`: delete the local `getRequestDomain` (lines 21-35) and the now-unused `normalizeDomain` import; add `getRequestDomain` to the existing `@/lib/widget/resolve-widget` import. The call site `getRequestDomain(request)` is unchanged in both.

- [ ] **Step 5: Run tests + type-check**

Run: `pnpm jest tests/unit/widget/resolve-widget.test.ts tests/unit/security && pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/widget/resolve-widget.ts app/api/chat-relay/route.ts "app/api/w/[widgetKey]/config/route.ts" tests/unit/widget/resolve-widget.test.ts
git commit -m "refactor: extract shared getRequestDomain into resolve-widget (removes divergent copies)"
```

---

### Task 10: Backfill exit codes + repairSection fallback warning (P3 — findings #20 ADV-006, #19 ADV-007)

Two observability fixes. (1) `scripts/migrate-v2-backfill.ts` exits 1 both for "dangling widgets need manual review" and for genuine failure — operators can't script against it. Use exit 2 for dangling-only. (2) `repairSection` in `lib/widget-config/migrate.ts` silently replaces a whole section with defaults when the 25-iteration cap is hit (cross-field refinement oscillation) — add a `console.warn` so data loss is at least visible in logs.

**Files:**
- Modify: `scripts/migrate-v2-backfill.ts` (verification/exit block, ~lines 188-230)
- Modify: `lib/widget-config/migrate.ts` (repairSection fallback returns)
- Test: `tests/lib/widget-config/migrate.test.ts`

- [ ] **Step 1: repairSection warning — write the failing test**

In `tests/lib/widget-config/migrate.test.ts`:

```typescript
it('warns when a section falls back to defaults entirely', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // a section whose value is a wrong type triggers the section-default fallback
  migrateConfig({ schemaVersion: 2, branding: 'not-an-object' });
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('branding'));
  warn.mockRestore();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm jest tests/lib/widget-config/migrate.test.ts -t "falls back to defaults"`
Expected: FAIL (no warn emitted).

- [ ] **Step 3: Implement the warning**

`repairSection` has multiple `return sectionSchema.parse({})` fallback points (non-cloneable, path-length-0, no-progress, iteration cap). It needs the section name for a useful message — change the signature to `repairSection(sectionName: string, sectionSchema: z.ZodTypeAny, raw: unknown)` and update its single caller to pass the key it is iterating. Add a tiny helper:

```typescript
function sectionDefaultFallback(sectionName: string, sectionSchema: z.ZodTypeAny, reason: string): unknown {
  console.warn(
    `[migrateConfig] Section '${sectionName}' could not be repaired (${reason}) — replaced with schema defaults. Original data for this section is dropped.`
  );
  return sectionSchema.parse({});
}
```

and replace each bare `return sectionSchema.parse({})` with `return sectionDefaultFallback(sectionName, sectionSchema, '<reason>')` using reasons: `'non-cloneable value'`, `'section is wrong type'`, `'no repair progress'`, `'iteration cap reached'`.

- [ ] **Step 4: Backfill exit codes**

In `scripts/migrate-v2-backfill.ts`, find the final verification block (after the dry-run early return). Replace the single `exit(1)` path with:

```typescript
  if (noUser.length > 0 || noKey.length > 0) {
    console.error(
      `INCOMPLETE: ${noUser.length} widget(s) still missing userId, ` +
      `${noKey.length} widget(s) still missing widgetKey`
    );
    if (dangling.length > 0 && noUser.length === dangling.length) {
      // Everything unresolved is accounted for by dangling widgets — this is
      // the "manual review required" outcome, not a script failure.
      // Exit codes: 0 = complete, 2 = dangling widgets need manual action,
      // 1 = unexpected failure. Lets deploy scripts branch on the outcome.
      process.exit(2);
    }
    process.exit(1);
  }
  console.log('Backfill complete.');
```

Update the script's header comment to document the 0/1/2 exit-code contract, and add the same note to the runbook in Task 11.

- [ ] **Step 5: Run tests + type-check**

Run: `pnpm jest tests/lib/widget-config/migrate.test.ts tests/unit/scripts 2>/dev/null || pnpm jest tests/lib/widget-config/migrate.test.ts; pnpm exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/widget-config/migrate.ts scripts/migrate-v2-backfill.ts tests/lib/widget-config/migrate.test.ts
git commit -m "fix(observability): warn on repairSection default fallback; backfill exit code 2 for dangling widgets"
```

---

### Task 11: Migration lock_timeout + v2 deployment runbook (data-migration findings DM-002/003/005 + verification SQL)

The `SET NOT NULL` statements in `drizzle/0001_drop_widget_configs_and_license_id.sql` take ACCESS EXCLUSIVE locks on the hot `widgets` table with no lock timeout — a long-running query at deploy time stalls the migration while it blocks ALL reads/writes behind it. Also: the migration is irreversible (DROP TABLE/COLUMN, no down migration), so the runbook must mandate a Neon branch snapshot first.

**Files:**
- Modify: `drizzle/0001_drop_widget_configs_and_license_id.sql`
- Create: `docs/development/v2-deploy-runbook.md`

- [ ] **Step 1: Add lock_timeout to the migration**

Insert immediately after the pre-flight guard block (after line 24) in `drizzle/0001_drop_widget_configs_and_license_id.sql`:

```sql
--> statement-breakpoint
-- ACCESS EXCLUSIVE locks below (SET NOT NULL, DROP COLUMN) on the hot widgets
-- table: bound the lock WAIT so a long-running query at deploy time fails this
-- migration fast (retryable) instead of stalling it while it blocks all
-- traffic queued behind the lock. Session-scoped; applies to every statement
-- in this migration run.
SET lock_timeout = '3s';
```

- [ ] **Step 2: Verify the migration still parses**

Run: `pnpm db:migrate --dry-run 2>/dev/null || echo "no dry-run support — review SQL manually"`
If drizzle-kit has no dry-run, verify by reading: the new statement must sit between its own `--> statement-breakpoint` markers, before the first `ALTER TABLE`.

- [ ] **Step 3: Write the runbook**

Create `docs/development/v2-deploy-runbook.md`:

```markdown
# v2 Schema Migration — Deployment Runbook

Applies to: `drizzle/0001_drop_widget_configs_and_license_id.sql` (irreversible — drops `widget_configs`, `widgets.license_id`, `analytics_events.license_id`).

## Pre-deploy

1. **Snapshot:** create a Neon branch of production (`neonctl branches create --name pre-v2-migration`). This migration has NO down migration — the branch is the only rollback path.
2. **Record analytics baseline** (historical rows lose attribution — license_id is dropped and user_id is NULL for old rows):
   ```sql
   SELECT count(*) AS pre_migration_analytics_rows FROM analytics_events;
   SELECT count(*) AS rows_with_license FROM analytics_events WHERE license_id IS NOT NULL;
   ```
   Save both numbers in the deploy notes. If any dashboard/metric feeds on these rows, expect attribution gaps for the historical window.
3. **Run backfill:** `pnpm db:backfill-v2 -- --dry-run`, review, then `pnpm db:backfill-v2`.
   Exit codes: `0` complete; `2` dangling widgets need manual review (see below); `1` failure — stop and investigate.

## Dangling widgets (exit code 2)

Widgets whose `license_id` points at a deleted license cannot be backfilled automatically. Preview:

```sql
SELECT w.id, w.name, w.license_id, w.created_at
FROM widgets w
LEFT JOIN licenses l ON l.id = w.license_id
WHERE w.user_id IS NULL AND l.id IS NULL;
```

Per widget, either assign an owner (`UPDATE widgets SET user_id = '<uuid>' WHERE id = '<id>';`)
or delete it (`DELETE FROM widgets WHERE id = '<id>';`). Re-run the backfill until exit 0.

## Deploy

4. Run `pnpm db:migrate` during a low-traffic window. The migration sets `lock_timeout = '3s'`; if it fails with a lock timeout, simply re-run (every statement is idempotent and the pre-flight guard re-checks).

## Post-deploy verification

```sql
-- Both must return 0:
SELECT count(*) FROM widgets WHERE user_id IS NULL OR widget_key IS NULL;
-- Must return NULL (table gone):
SELECT to_regclass('public.widget_configs');
-- Must return NULL (column gone):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'widgets' AND column_name = 'license_id';
```

5. Smoke-test: load an embedded widget on a customer domain, send one chat message through the relay, open the dashboard widget list.

## Rollback

There is no down migration. Restore = promote the `pre-v2-migration` Neon branch and redeploy the previous app release. Any writes after the migration are lost — decide within the incident window.
```

- [ ] **Step 4: Commit**

```bash
git add drizzle/0001_drop_widget_configs_and_license_id.sql docs/development/v2-deploy-runbook.md
git commit -m "ops: lock_timeout on v2 migration + deployment runbook (snapshot, verification SQL, dangling-widget procedure)"
```

---

### Task 12: Final verification gate

**Files:** none modified — verification + log update only.

- [ ] **Step 1: Full suite + type-check + both builds**

Run: `pnpm exec tsc --noEmit && pnpm test && pnpm build:widget && pnpm build`
Expected: type-check clean; all jest suites pass (was 46 suites / 580 tests + the new ones); both builds succeed.

- [ ] **Step 2: Grep for leftovers**

Run: `grep -rn "getFirstActiveWidgetForUser\|requestHost" app lib tests scripts --include="*.ts" | grep -v node_modules`
Expected: no `getFirstActiveWidgetForUser` anywhere; no `requestHost` flowing into domain authorization (other mentions, e.g. in `app/w/[widgetKey]/route.ts` URL building, are fine).

- [ ] **Step 3: Update the dev log**

Append to `docs/development/DEVELOPMENT_LOG.md`: one entry summarizing the review-fix round (findings #11-#21 from run `20260610-061226-73c78561`, what was fixed, what was deferred and why — copy the "Out of scope" list from this plan's header).

- [ ] **Step 4: Commit and push**

```bash
git add docs/development/DEVELOPMENT_LOG.md
git commit -m "docs: log code-review fix round"
git push origin feat/production-readiness
```

PR #9 picks up the new commits automatically.

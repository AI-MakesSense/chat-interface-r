# Architectural Decisions Log

This document records all significant architectural and technical decisions made during the development of the N8n Widget Designer Platform.

**Format**: Each decision includes date, context, decision, rationale, alternatives, and status.

---

## ADR-001: Backend-First Development Strategy

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to decide development order: backend-first, frontend-first, or parallel development.

### Decision

Build backend APIs completely before starting frontend development (Phases 1-3 backend, Phase 4 frontend).

### Rationale

1. **Stability**: Backend changes are riskier once in production; frontend can iterate faster
2. **Testing**: Backend business logic can be thoroughly tested independently
3. **API-First**: Enables future multi-platform support (web, mobile, CLI)
4. **Critical Path**: Payment processing and license validation are backend-heavy
5. **Complexity**: Business logic (Stripe webhooks, license validation) lives in backend

### Alternatives Considered

- **Frontend-First**: Rejected - would require mocking complex payment flows
- **Parallel Development**: Rejected - higher risk of API contract changes mid-development
- **Full-Stack Features**: Rejected - slows down iteration on each component

### Consequences

- Backend engineer can work unblocked for 6 weeks
- Frontend development starts Week 7 with stable APIs
- API documentation must be comprehensive for frontend team
- Early testing of payment flows possible before UI exists

---

## ADR-002: Use Drizzle ORM Instead of Prisma

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to choose an ORM for PostgreSQL database access.

### Decision

Use Drizzle ORM for all database operations.

### Rationale

1. **Type Safety**: Full TypeScript support with inferred types
2. **Performance**: Zero overhead, compiles to raw SQL
3. **Serverless**: Edge-ready, no connection pooling needed with Vercel Postgres
4. **Migration Control**: SQL-based migrations (more control than Prisma's black box)
5. **Bundle Size**: Smaller bundle than Prisma client

### Alternatives Considered

- **Prisma**: Rejected - slower, larger bundle, less control over SQL
- **Raw SQL**: Rejected - no type safety, more boilerplate
- **TypeORM**: Rejected - decorator syntax not as clean

### Consequences

- Manual migration files (more control but requires SQL knowledge)
- Excellent IntelliSense and type inference
- Drizzle Studio for database inspection
- Steeper learning curve than Prisma for team

---

## ADR-003: JWT in HTTP-Only Cookies (Not localStorage)

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to decide how to store authentication tokens on the client.

### Decision

Store JWT tokens in HTTP-only, secure, SameSite=Strict cookies.

### Rationale

1. **Security**: HTTP-only cookies prevent XSS attacks (JavaScript can't access token)
2. **CSRF Protection**: SameSite=Strict prevents CSRF attacks
3. **Best Practice**: Recommended by OWASP for web applications
4. **Automatic**: Browser automatically sends cookie with requests
5. **Expiration**: Cookie expiration enforced by browser

### Alternatives Considered

- **localStorage**: Rejected - vulnerable to XSS attacks, token accessible to any JavaScript
- **sessionStorage**: Rejected - same XSS vulnerability as localStorage
- **Memory Only**: Rejected - lost on page refresh, poor UX

### Consequences

- Cannot make API calls from different origins (CORS restrictions)
- Requires proper CORS configuration for frontend
- Cookie must be set by same domain as API (Next.js App Router handles this)
- 7-day expiration requires refresh token mechanism later (Phase 7)

---

## ADR-004: Use crypto.randomBytes for License Keys

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 2

### Context

Need to generate unique, secure license keys for purchased widgets.

### Decision

Use `crypto.randomBytes(16).toString('hex')` to generate 32-character hexadecimal license keys.

### Rationale

1. **Security**: Cryptographically secure random number generator (not predictable)
2. **Uniqueness**: 2^128 possible values (collision probability: ~10^-18 after 10 billion keys)
3. **Simplicity**: One-line implementation, no dependencies
4. **URL-Safe**: Hexadecimal characters safe in URLs
5. **Standard**: Common practice for API keys and tokens

### Alternatives Considered

- **UUID v4**: Rejected - contains dashes (not as clean), overkill for this use case
- **nanoid**: Rejected - adds dependency, custom alphabet not needed
- **Math.random()**: Rejected - NOT cryptographically secure, predictable
- **Timestamp-based**: Rejected - predictable, no security

### Consequences

- Must add database unique constraint to handle rare collisions
- License keys are not human-readable (acceptable trade-off)
- Keys are case-insensitive (all lowercase hex)
- No built-in expiration in key format (stored in database instead)

---

## ADR-005: Soft Delete for License Cancellation

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 2

### Context

Need to decide how to handle license cancellation (via user action or Stripe webhook).

### Decision

Set `status='cancelled'` instead of deleting the database row (soft delete).

### Rationale

1. **Data Preservation**: Keep historical data for analytics and reporting
2. **Referential Integrity**: Widget configs reference licenses; deletion would break foreign keys
3. **Stripe Integration**: Need to keep subscription ID for future webhook events
4. **Reactivation**: Potential to reactivate cancelled licenses (future feature)
5. **Audit Trail**: Maintain record of all transactions

### Alternatives Considered

- **Hard Delete**: Rejected - data loss, breaks foreign keys, no audit trail
- **Archived Table**: Rejected - overcomplicated, requires moving data
- **Deleted Flag**: Rejected - `status` field already exists, more semantic

### Consequences

- Must filter out cancelled licenses in queries (add `WHERE status = 'active'`)
- Database size grows over time (acceptable - licenses are small records)
- Need to handle widget serving for cancelled licenses (show error)
- Can show cancelled licenses in dashboard (with strikethrough)

---

## ADR-006: Domain Normalization Rules

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 2

### Context

Need consistent domain comparison for license validation (www.example.com vs example.com).

### Decision

Normalize domains by: (1) converting to lowercase, (2) removing 'www.' prefix, (3) stripping port numbers.

### Rationale

1. **User Experience**: Users shouldn't need to specify exact subdomain/port
2. **Consistency**: www.Example.com and example.com are the same domain
3. **Simplicity**: Ports are irrelevant for domain ownership (example.com:3000 = example.com)
4. **Standard Practice**: Most SaaS tools (Stripe, Auth0) normalize domains similarly

### Alternatives Considered

- **Exact Match**: Rejected - too strict, confuses users (www vs non-www)
- **Regex Validation**: Rejected - complex, harder to test, overkill
- **URL Parsing**: Rejected - domains may not be valid URLs during input

### Consequences

- `example.com`, `Example.com`, `WWW.EXAMPLE.COM` all match
- Port numbers ignored (`example.com:3000` matches `example.com:8080`)
- Subdomains NOT normalized (`api.example.com` ≠ `example.com`) - correct behavior
- localhost handled correctly (`localhost:3000` → `localhost`)

### Normalization Implementation

```typescript
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()           // example.COM → example.com
    .replace(/^www\./, '')   // www.example.com → example.com
    .replace(/:\d+$/, '');   // example.com:3000 → example.com
}
```

---

## ADR-007: Zod for API Input Validation

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to validate all API inputs to prevent invalid data and injection attacks.

### Decision

Use Zod schemas for all API route input validation.

### Rationale

1. **Type Safety**: Infer TypeScript types from schemas (single source of truth)
2. **Runtime Validation**: Validates data at runtime, not just compile time
3. **Error Messages**: Automatic, detailed error messages for validation failures
4. **Composability**: Can compose schemas from smaller pieces
5. **DX**: Excellent TypeScript integration and IntelliSense

### Alternatives Considered

- **Joi**: Rejected - not TypeScript-first, less type inference
- **Yup**: Rejected - similar to Zod but less TypeScript support
- **Manual Validation**: Rejected - error-prone, no type inference
- **TypeBox**: Rejected - less mature ecosystem

### Consequences

- All API routes have `.parse()` call at top
- Need to handle `ZodError` and format user-friendly messages
- Schemas can be exported and reused in frontend (bonus)
- Bundle size increase (~15KB for Zod library)

---

## ADR-008: Vitest Instead of Jest for Testing

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to choose a testing framework for unit and integration tests.

### Decision

Use Vitest for all backend tests (unit + integration).

### Rationale

1. **Speed**: 10-20x faster than Jest (Vite's speed)
2. **Native ESM**: Works with ES modules out of the box (no babel config)
3. **TypeScript**: First-class TypeScript support, no ts-jest needed
4. **API Compatibility**: Jest-compatible API (easy migration if needed)
5. **DX**: Better error messages and stack traces

### Alternatives Considered

- **Jest**: Rejected - slower, requires babel/ts-jest configuration
- **AVA**: Rejected - less popular, different API than Jest
- **Mocha + Chai**: Rejected - requires multiple libraries, more setup

### Consequences

- Test files use Vitest API (`describe`, `it`, `expect` from 'vitest')
- Fast test execution enables true TDD workflow
- Can use Vite plugins in tests (e.g., for module mocking)
- Smaller ecosystem than Jest (but growing rapidly)

---

## ADR-009: Module Size Limits (200-400 LOC Ideal, 600 LOC Hard Cap)

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: All Phases

### Context

Need to maintain codebase readability and testability as project grows.

### Decision

Enforce module size limits:
- **Ideal**: 200-400 lines of code per file
- **Hard Cap**: 600 lines (triggers mandatory refactor/split)
- **Cohesion**: Each file has ONE clear responsibility

### Rationale

1. **Readability**: Files over 600 LOC are difficult to understand at a glance
2. **Testability**: Smaller modules are easier to test thoroughly
3. **Maintainability**: Clear boundaries between modules reduce coupling
4. **Code Review**: Easier to review smaller, focused files
5. **Cognitive Load**: Developers can hold entire file in working memory

### Alternatives Considered

- **No Limits**: Rejected - leads to god files with multiple responsibilities
- **Stricter Limits** (100 LOC): Rejected - too granular, over-splitting
- **Function Count Limits**: Rejected - LOC is simpler metric

### Consequences

- Regular refactoring required when files grow
- May have more files than typical projects
- Need clear file naming to avoid confusion
- Helper functions may need separate files

### When to Split

**Triggers:**

1. File exceeds 400 LOC (consider splitting)
2. File exceeds 600 LOC (mandatory split)
3. Multiple unrelated concerns in one file
4. Testing becomes difficult due to complexity
5. Function count exceeds 10-12

**How to Split:**

- Extract helper functions to `helpers.ts`
- Separate validation logic to `validation.ts`
- Split by responsibility (e.g., `user-auth.ts` → `login.ts` + `signup.ts`)
- Create subdirectory if related files (e.g., `email/` → `templates/`, `send.ts`)

---

## ADR-010: Stripe for Payment Processing

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 2

### Context

Need to accept payments for widget subscriptions.

### Decision

Use Stripe Checkout + Stripe Billing for subscription payments.

### Rationale

1. **Industry Standard**: Most trusted payment processor for SaaS
2. **Subscriptions**: Built-in subscription and billing management
3. **Webhooks**: Reliable webhook system for automation
4. **Customer Portal**: Pre-built customer portal for managing subscriptions
5. **Test Mode**: Excellent test mode for development

### Alternatives Considered

- **PayPal**: Rejected - worse developer experience, less reliable webhooks
- **Paddle**: Rejected - merchant of record (less control), higher fees
- **Lemon Squeezy**: Rejected - newer, less proven
- **Manual Invoicing**: Rejected - not scalable

### Consequences

- Stripe fees: 2.9% + $0.30 per transaction
- Must implement webhook endpoint for `checkout.session.completed`
- Stripe account required (easy to create)
- PCI compliance handled by Stripe (major benefit)

---

## ADR-011: SendGrid for Email Delivery

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 2

### Context

Need to send transactional emails (welcome emails, license delivery, etc.).

### Decision

Use SendGrid for all transactional email delivery.

### Rationale

1. **Reliability**: 99%+ delivery rate for transactional emails
2. **Free Tier**: 100 emails/day free (sufficient for MVP)
3. **API**: Simple REST API for sending emails
4. **Templates**: Support for HTML email templates
5. **Analytics**: Email open/click tracking built-in

### Alternatives Considered

- **Resend**: Rejected - newer, less proven (but excellent DX)
- **AWS SES**: Rejected - more complex setup, requires domain verification
- **Mailgun**: Rejected - similar to SendGrid but less generous free tier
- **Postmark**: Rejected - no free tier

### Consequences

- SendGrid API key required (stored in env vars)
- Must verify sender email address
- HTML email templates written manually (no visual editor)
- Email deliverability depends on SendGrid reputation

---

## ADR-012: Next.js 15 App Router (Not Pages Router)

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to choose Next.js routing strategy (App Router vs Pages Router).

### Decision

Use Next.js 15 App Router for all routes (API routes and pages).

### Rationale

1. **Modern**: App Router is the future of Next.js (Pages Router in maintenance mode)
2. **React Server Components**: Built-in support for RSC (better performance)
3. **Layouts**: Nested layouts and shared UI components
4. **File Colocation**: Can colocate components with routes
5. **Streaming**: Built-in support for React Suspense streaming

### Alternatives Considered

- **Pages Router**: Rejected - legacy, missing modern features
- **Remix**: Rejected - smaller ecosystem than Next.js
- **SvelteKit**: Rejected - prefer React for hiring/ecosystem

### Consequences

- API routes in `app/api/` instead of `pages/api/`
- Route groups for layouts: `(marketing)/` and `(app)/`
- Server components by default (must opt into client components)
- Slightly steeper learning curve than Pages Router

---

## ADR-013: Vercel for Deployment and Hosting

**Date**: November 8, 2025
**Status**: ✅ Accepted
**Phase**: Phase 1

### Context

Need to choose deployment platform for Next.js application.

### Decision

Use Vercel for hosting, deployment, and Postgres database.

### Rationale

1. **Next.js Native**: Created by Vercel, best Next.js support
2. **Zero Config**: Push to deploy, no configuration needed
3. **Edge Functions**: Global edge network for fast APIs
4. **Postgres**: Managed Postgres database (Neon under the hood)
5. **Free Tier**: Generous free tier for MVP (100GB bandwidth)

### Alternatives Considered

- **Netlify**: Rejected - less optimized for Next.js than Vercel
- **Railway**: Rejected - good for databases but less frontend focus
- **AWS**: Rejected - overcomplicated for MVP, higher cost
- **Self-Hosted**: Rejected - too much operational overhead

### Consequences

- Vendor lock-in to Vercel (acceptable for MVP)
- Database hosted on Vercel Postgres (Neon)
- Environment variables managed in Vercel dashboard
- Automatic HTTPS and CDN
- Monitoring and analytics built-in

---

## ADR-014: Hybrid Database Schema for Widget Storage

**Date**: November 9, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3

### Context

Need to decide how to store widget configurations: fully normalized tables vs JSONB vs hybrid approach.

### Decision

Create a new `widgets` table with indexed columns (id, licenseId, name, status) and a JSONB `config` field for flexible configuration storage.

### Rationale

1. **Flexibility**: JSONB allows adding new configuration options without schema migrations
2. **Performance**: Indexed columns for fast queries on frequently-accessed fields
3. **Type Safety**: Zod validation ensures JSONB structure despite flexible storage
4. **Query Efficiency**: Can filter by name/status without parsing JSON
5. **Future-Proof**: Easy to add new config fields without database changes

### Alternatives Considered

- **Fully Normalized** (widget_configs, theme_configs, position_configs tables):
  - Rejected - Over-engineering, requires many JOINs, complex updates, no real benefit

- **Pure JSONB** (everything in config field):
  - Rejected - Can't efficiently query by widget name or status, poor indexing

- **Keep widget_configs table**:
  - Rejected - One-to-one relationship doesn't support multiple widgets per license

### Consequences

- Need migration script to move data from `widget_configs` to `widgets`
- JSONB queries require GIN index for performance
- Must validate JSONB structure with Zod on read/write
- Schema evolution handled at application layer (not database)

---

## ADR-015: One-to-Many Relationship (License → Widgets)

**Date**: November 9, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3

### Context

Should we support one widget per license or multiple widgets per license?

### Decision

Support multiple widgets per license, with tier-based limits:
- Basic: 1 widget
- Pro: 3 widgets
- Agency: unlimited widgets (-1)

### Rationale

1. **Business Logic**: Pro and Agency tiers should offer more value (multiple widgets)
2. **User Experience**: Users may want different widgets for different pages/purposes
3. **Scalability**: Agency tier can manage many client websites (each needs a widget)
4. **Upsell Opportunity**: Basic → Pro upgrade motivated by widget limit
5. **Database Design**: Foreign key naturally supports 1:N relationship

### Alternatives Considered

- **One Widget Per License**:
  - Rejected - Limits Pro/Agency value proposition, requires multiple licenses for multi-page sites

- **Unlimited Widgets for All Tiers**:
  - Rejected - No differentiation between tiers, eliminates upsell motivation

### Consequences

- Need `widgetLimit` field on licenses table (or derive from tier)
- Widget creation API must check count against limit
- Dashboard UI must show "2/3 widgets used" progress
- Deletion of widgets decrements count

---

## ADR-016: Tier-Aware Validation with Zod Refinements

**Date**: November 9, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3

### Context

How do we enforce tier-based configuration restrictions (e.g., Basic tier requires branding)?

### Decision

Use Zod schemas with `.refine()` and `.superRefine()` methods that accept `tier` context parameter and conditionally validate based on tier.

### Rationale

1. **Centralized Validation**: All tier logic in one place (validation schemas)
2. **Type Safety**: Zod infers TypeScript types automatically
3. **Reusability**: Same schemas used in API routes and frontend forms
4. **Error Messages**: Zod provides clear error messages ("Branding required for Basic tier")
5. **Testability**: Easy to test tier validation in isolation

### Alternatives Considered

- **Database Constraints**:
  - Rejected - Can't express complex tier logic in SQL CHECK constraints

- **Separate Schemas Per Tier** (basicWidgetSchema, proWidgetSchema, agencyWidgetSchema):
  - Rejected - Code duplication, harder to maintain, complex to switch between

- **Runtime Checks in API Routes**:
  - Rejected - Scattered validation logic, not reusable, harder to test

### Consequences

- Every widget create/update must pass tier to validation
- Validation functions signature: `validateWidgetConfig(config, tier, licenseInfo)`
- Need separate validation for "create" vs "update"
- Frontend can use same schemas for client-side validation

---

## ADR-017: Smart Defaults Based on Tier

**Date**: November 9, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3

### Context

What should new widgets look like when created? Empty config or pre-filled defaults?

### Decision

Generate tier-specific default configurations:
- Basic: Minimal config with branding enabled, default theme
- Pro: Rich config with branding disabled, premium themes available
- Agency: Full-featured config with white-label, advanced options

### Rationale

1. **User Experience**: Users get sensible starting point, not blank slate
2. **Discoverability**: Defaults showcase available features per tier
3. **Tier Differentiation**: Basic users see branding, Pro users don't (immediately visible value)
4. **Onboarding**: New users can deploy widget immediately without configuration
5. **Testing**: Default configs used in tests for consistency

### Alternatives Considered

- **Blank Configuration**:
  - Rejected - Poor UX, requires all fields filled before deployment

- **Single Default for All Tiers**:
  - Rejected - Doesn't showcase tier benefits

### Consequences

- Need `generateDefaultConfig(tier)` function
- Defaults must be kept in sync with validation schemas
- May need to update defaults when adding new features
- Migration: existing configs without new fields get defaults merged

---

## Status Legend

- ✅ **Accepted**: Decision is approved and implemented
- 🔄 **In Review**: Decision is under discussion
- ❌ **Rejected**: Decision was considered but not chosen
- 🚧 **Superseded**: Decision was replaced by a later decision

---

## ADR-018: Two-Tier Authorization for Widget API

**Date**: November 10, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3 Module 2

### Context

Widget operations require verifying that the authenticated user has permission to access the widget. Need to decide authorization strategy.

### Decision

Implement two-tier authorization:
1. **User Authentication**: Verify JWT token (existing `requireAuth` middleware)
2. **Resource Ownership**: Verify user owns the license associated with widget

### Rationale

1. **Security**: Prevents horizontal privilege escalation (user accessing another user's widgets)
2. **Simplicity**: Builds on existing auth infrastructure
3. **Consistency**: Same pattern used in license API (proven approach)
4. **Performance**: Single database query to get widget with license
5. **Clarity**: Clear separation between authentication and authorization

### Alternatives Considered

- **License ID in JWT**: Rejected - would require re-issuing JWT on license purchase
- **Role-Based Access**: Rejected - overkill for current requirements
- **License Ownership Only**: Rejected - need user context for audit logs

### Consequences

- Every widget endpoint must call `verifyWidgetOwnership(widgetId, userId)`
- Helper function consolidates ownership logic in one place
- Database query joins widgets with licenses for ownership check
- Consistent error messages: 401 for auth, 403 for ownership, 404 for not found

---

## ADR-019: Deep Merge Strategy for Partial Config Updates

**Date**: November 10, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3 Module 2

### Context

Users update widget configs via PATCH endpoint. Should we require full config or support partial updates?

### Decision

Support partial config updates with deep merge:
- User provides only fields they want to change
- System deep merges with existing config
- Arrays are replaced (not merged)
- Use `structuredClone()` for immutability

### Rationale

1. **User Experience**: Users don't need to send entire config for small changes
2. **Network Efficiency**: Smaller payloads (send only changed fields)
3. **Simplicity**: Frontend can send patch requests without fetching full config
4. **Flexibility**: Supports both shallow and deep nested updates
5. **Safety**: structuredClone prevents mutation bugs

### Alternatives Considered

- **Full Config Required**: Rejected - poor UX, larger payloads, requires fetch-before-update
- **Shallow Merge**: Rejected - can't update nested properties (e.g., theme.colors.primary)
- **JSONPatch (RFC 6902)**: Rejected - overcomplicated for this use case

### Consequences

- Need `deepMerge()` helper function with proper array handling
- Must validate merged result (not just user input)
- Version number increments on any config change
- Frontend can send minimal payloads: `{ config: { theme: { colors: { primary: "#FF0000" } } } }`

### Merge Behavior

```typescript
// Example: Update only primary color
PATCH /api/widgets/123
{
  "config": {
    "theme": {
      "colors": {
        "primary": "#FF5733"
      }
    }
  }
}

// Result: existing.config deep merged with above
// - theme.colors.primary → "#FF5733" (updated)
// - theme.colors.secondary → unchanged
// - branding → unchanged
// - behavior → unchanged
```

---

## ADR-020: Widget Limit Enforcement at Creation Time

**Date**: November 10, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3 Module 2

### Context

Tier limits restrict widget count (Basic=1, Pro=3, Agency=unlimited). When should we enforce these limits?

### Decision

Enforce limits at widget creation time by counting active widgets (status ≠ 'deleted'):
- Count widgets with `status IN ('active', 'paused')`
- Exclude soft-deleted widgets from count
- Check limit before creating new widget

### Rationale

1. **Business Logic**: Deleted widgets don't count toward limit (user can delete and recreate)
2. **User Experience**: Users can experiment by deleting and recreating widgets
3. **Simple Check**: Single database query for count
4. **No Cleanup Needed**: Soft delete pattern naturally supports this

### Alternatives Considered

- **Count All Widgets**: Rejected - deleted widgets would block new creation forever
- **Hard Delete**: Rejected - loses historical data, ADR-005 chose soft delete
- **Limit at Update**: Rejected - confusing if user can't activate existing widget

### Consequences

- Race condition possible with concurrent creates (acceptable for MVP)
- Users can delete widget to free up slot
- Dashboard shows "2/3 widgets used" based on active count
- Agency tier check: `if (limit === -1) allow;` (unlimited)

### Known Limitation

Concurrent widget creation could bypass limits:
- User A creates widget (count check: 2 < 3, OK)
- User B creates widget (count check: 2 < 3, OK)
- Result: 4 widgets for Pro tier (should be 3 max)

**Mitigation**: Document as known limitation, add database constraint post-MVP if needed

---

## ADR-021: Separate Deployment Validation Endpoint

**Date**: November 10, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3 Module 2

### Context

Widgets can be saved with incomplete config (e.g., empty webhookUrl). Should deployment be automatic or explicit?

### Decision

Create explicit `POST /api/widgets/[id]/deploy` endpoint with strict validation:
- Separate from create/update endpoints
- Validates config is complete (webhookUrl required, allowDefaults=false)
- Sets `deployedAt` timestamp
- Only deployed widgets can be embedded

### Rationale

1. **User Safety**: Prevents accidental deployment of incomplete widgets
2. **Clear Intent**: Explicit deployment action (not auto-deploy on update)
3. **Validation Flexibility**: Different rules for "save draft" vs "deploy to production"
4. **Audit Trail**: `deployedAt` timestamp shows when widget went live
5. **Rollback**: Can "undeploy" by setting status='paused'

### Alternatives Considered

- **Auto-Deploy on Create**: Rejected - users may want to configure before deploying
- **Auto-Deploy on First Update**: Rejected - unclear when deployment happens
- **Deploy Flag in Update**: Rejected - overloads update endpoint with multiple concerns

### Consequences

- Widget lifecycle: Create → Configure (multiple updates) → Deploy → Embed
- Frontend needs "Deploy" button (separate from "Save")
- Embed endpoint checks `deployedAt !== null` before serving config
- Deployment validation stricter than save validation

### Validation Difference

```typescript
// SAVE (PATCH /api/widgets/[id])
// - Allows empty webhookUrl
// - Uses createWidgetConfigSchema(tier, allowDefaults=true)
// - Permissive: users can save incomplete drafts

// DEPLOY (POST /api/widgets/[id]/deploy)
// - Requires valid HTTPS webhookUrl
// - Uses createWidgetConfigSchema(tier, allowDefaults=false)
// - Strict: all required fields must be complete
```

---

## ADR-022: Public Embed Endpoint with Domain-Based Security

**Date**: November 10, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3 Module 2

### Context

Widgets need to load configuration on embed. Should this require authentication or be public?

### Decision

Create public endpoint `GET /api/widgets/[id]/embed?domain=...` with domain-based authorization:
- No JWT required (public endpoint)
- Security via license validation + domain whitelist
- Only active, deployed widgets can be embedded
- Domain parameter required (prevents mass scraping)

### Rationale

1. **Ease of Use**: Widgets embed without auth (simpler for end users)
2. **Domain Security**: License validation ensures only authorized domains load widget
3. **Performance**: No auth overhead (faster response times)
4. **Cacheability**: Public endpoint can be CDN-cached
5. **License Validation**: Existing `validateLicense(key, domain)` function handles authorization

### Alternatives Considered

- **Require JWT**: Rejected - widgets would need auth tokens (complex embed code)
- **API Key in URL**: Rejected - sensitive data exposed in URLs (logging, analytics)
- **No Domain Check**: Rejected - anyone could embed widget anywhere

### Consequences

- Endpoint is PUBLIC and UNAUTHENTICATED
- Must validate: widget active, widget deployed, license active, domain authorized
- Rate limiting critical to prevent abuse (10 req/sec per IP)
- CDN caching recommended (cache key: widgetId + domain)
- Return sanitized config (exclude sensitive data)

### Security Measures

```typescript
// Checks before returning config
1. Widget exists
2. Widget.status === 'active'
3. Widget.deployedAt !== null
4. License.status === 'active'
5. License not expired
6. Domain in license.domains (normalized)
```

### Rate Limiting (Post-MVP)

- 10 requests/second per IP address
- 1000 requests/hour per widget ID
- CDN caching reduces backend load

---

## ADR-023: 10 Essential Tests for Widget Serving Endpoint

**Date**: November 10, 2025
**Status**: ✅ Accepted
**Phase**: Phase 3 - Widget Serving

### Context

Widget serving endpoint is critical infrastructure - must validate licenses, authorize domains, and serve JavaScript. Need to decide test coverage strategy.

### Decision

Implement **exactly 10 integration tests** covering:
- 1 success path
- 5 auth/authorization failures
- 1 edge case (localhost)
- 2 business logic validations (branding)
- 1 technical validation (IIFE structure)

### Rationale

1. **User Request**: "only 10/10 test we don't want to many" - high-quality, essential tests only
2. **Critical Path Coverage**: All failure modes tested (expired, cancelled, domain mismatch)
3. **No Redundancy**: Each test validates distinct behavior
4. **Business Logic**: Branding differentiation is core value proposition
5. **Security**: Domain validation prevents license key theft
6. **Integration Focus**: Tests hit actual API route with real database

### Alternatives Considered

- **15-20 Tests**: Rejected - redundant variations (domain normalization tested in unit tests)
- **5 Tests Only**: Rejected - insufficient coverage of failure modes
- **Unit Tests for Route**: Rejected - need integration tests for route + DB + license validation

### Consequences

- Total test count: 10 (exactly as requested)
- Test file: 395 lines (already written)
- Excluded: Domain normalization edge cases (covered by unit tests)
- Excluded: Cache headers, CORS, rate limiting (Phase 5 concerns)
- Excluded: Widget bundle missing (build-time issue)

### Test Coverage Justification

**Included** (critical for MVP):
- ✅ License validation (exists, active, not expired)
- ✅ Domain authorization (referer check, domain whitelist)
- ✅ Tier-based branding (Basic vs Pro differentiation)
- ✅ JavaScript serving (IIFE format, proper content-type)
- ✅ Localhost exception (enables development)

**Excluded** (tested elsewhere or low-value):
- ❌ Domain normalization (www, case, port) - unit tested in `tests/unit/license/domain.test.ts`
- ❌ SQL injection attempts - Drizzle ORM prevents by design
- ❌ Rate limiting - Phase 5 feature
- ❌ Cache-Control headers - non-critical, easily verified manually
- ❌ Widget bundle size - build-time concern (bundle analyzer)

---

**Last Updated**: November 10, 2025
**Total Decisions**: 23

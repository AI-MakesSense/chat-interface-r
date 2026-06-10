# Claude Code - N8n Widget Designer Platform

## Project Overview

The **N8n Widget Designer Platform** is a production-ready SaaS application that enables users to visually design, customize, and deploy embeddable chat widgets for N8n workflows. Users can create widgets with 70+ customization options, deploy them across multiple domains, and integrate with their N8n automation workflows.

**Current Status:** Production-ready with functional frontend and backend

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16.0.1 (App Router with Server Components)
- **Language:** TypeScript 5 (strict mode)
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui (Radix UI primitives)
- **State Management:** Zustand 5.0.8
- **Forms:** React Hook Form 7.66.0 + Zod 4.1.12 validation
- **Icons:** Lucide React 0.553.0
- **Theming:** next-themes 0.4.6
- **Notifications:** Sonner 2.0.7

### Backend
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL (Neon/Vercel Postgres)
- **ORM:** Drizzle ORM 0.44.7 + Drizzle Kit 0.31.6
- **Authentication:** JWT (jose 6.1.0) + HTTP-only cookies
- **Password Hashing:** bcryptjs 3.0.3
- **Validation:** Zod 4.1.12

### Widget (Standalone Embeddable)
- **Build Tool:** esbuild 0.21.5
- **Format:** IIFE (Immediately Invoked Function Expression)
- **Markdown:** markdown-it 14.1.0
- **Sanitization:** isomorphic-dompurify 2.31.0
- **Syntax Highlighting:** prismjs 1.30.0 (lazy loaded)
- **Package Generation:** jszip 3.10.1

### Testing
- **Framework:** Jest 29.7.0 with jsdom
- **React Testing:** @testing-library/react 15.0.0
- **API Mocking:** MSW 1.3.2 (Mock Service Worker)

### Development Tools
- **Package Manager:** pnpm
- **Linting:** ESLint 9 + eslint-config-next
- **TypeScript:** Full type safety with strict mode

---

## Project Structure

```
/
├── app/                          # Next.js 16 App Router
│   ├── api/                      # Backend API routes
│   │   ├── auth/                 # Authentication (login, logout, signup, me)
│   │   ├── licenses/             # License management (CRUD, validate)
│   │   ├── widgets/              # Widget CRUD, deploy, download
│   │   ├── widget/[license]/     # Widget serving (chat-widget.js, config)
│   │   ├── chat-relay/           # Chat message relay to N8n
│   │   └── embed/                # Embed bundle serving
│   ├── auth/                     # Login/signup pages
│   ├── dashboard/                # User dashboard
│   ├── configurator/             # Visual widget configurator
│   ├── demo/                     # Interactive demo page
│   ├── interface-testing/        # Testing page
│   └── chat/portal/[widgetId]/   # Fullscreen chat portal
│
├── components/                   # React components
│   ├── auth/                     # login-form, signup-form
│   ├── dashboard/                # license-card, widget-list, domain-manager, etc.
│   ├── configurator/             # config-sidebar, preview-canvas, chat-preview, code-modal, icon-picker, ui/
│   ├── landing/                  # navbar, hero, features, footer
│   └── ui/                       # shadcn/ui components (button, input, card, etc.)
│
├── lib/                          # Core business logic
│   ├── api/                      # API client and schemas
│   ├── auth/                     # JWT, password, guard, helpers
│   ├── db/                       # Database client, schema, queries
│   ├── license/                  # License generation, validation, domain handling
│   ├── widget/                   # Widget serving, rate limiting, headers, errors
│   ├── validation/               # Zod schemas for widget config
│   ├── config/                   # Default tier configurations
│   ├── types/                    # TypeScript definitions
│   ├── utils/                    # General utilities, API error handling
│   └── zip-generator/            # Package generation for downloads
│
├── stores/                       # Zustand state management
│   ├── auth-store.ts             # User authentication state
│   ├── widget-store.ts           # Widget configuration state
│   ├── preview-store.ts          # Real-time preview state
│   └── license-store.ts          # License management state
│
├── widget/                       # Standalone widget package
│   └── src/
│       ├── core/                 # widget, state, config, renderers
│       ├── ui/                   # header, footer, messages, input, toggle
│       ├── services/messaging/   # sse-client, message-sender, session, retry
│       ├── theming/              # theme-manager, css-injector, css-variables
│       └── utils/                # markdown, xss, syntax, cache, lazy-loader
│
├── tests/                        # Test suite (71 test files)
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── widget/                   # Widget-specific tests
│   └── lib/                      # Library tests
│
├── docs/                         # Documentation (49 files)
├── public/                       # Static assets
│   └── widget/                   # Compiled widget bundle
└── scripts/                      # Database seeding utilities
```

---

## API Routes

### Authentication (`/api/auth/`)
- **POST /api/auth/login** - Authenticate user, returns JWT in HTTP-only cookie
- **POST /api/auth/signup** - Create new user account
- **POST /api/auth/logout** - Clear authentication cookie
- **GET /api/auth/me** - Get current authenticated user

### License Management (`/api/licenses/`)
- **POST /api/licenses** - Create new license with tier-specific settings
- **GET /api/licenses** - List all licenses for authenticated user
- **PATCH /api/licenses/[id]** - Update license (domains, status)
- **POST /api/licenses/validate** - Public endpoint to validate license keys

### Widget Management (`/api/widgets/`)
- **POST /api/widgets** - Create widget with license validation
- **GET /api/widgets** - List user's widgets with pagination
- **GET /api/widgets/[id]** - Get single widget
- **PATCH /api/widgets/[id]** - Update widget config/status
- **DELETE /api/widgets/[id]** - Soft delete widget
- **GET /api/widgets/[id]/download** - Download widget package
- **POST /api/widgets/[id]/deploy** - Deploy widget

### Widget Serving (`/api/widget/`)
- **GET /api/widget/[license]/chat-widget.js** - Serve embeddable widget with domain validation
- **GET /api/widget/[license]/config** - Get widget config for license

### Other
- **POST /api/chat-relay** - Relay chat messages to N8n webhook
- **GET /api/embed/bundle.js** - Serve compiled widget bundle

---

## Database Schema

### Tables

> **Schema v2.0:** the legacy `widgetConfigs` table is GONE, and widgets now relate
> directly to a user (not via license). `widgets.licenseId` was removed; analytics is
> keyed on `userId`/`widgetId`.

**users** - User accounts
- id, email (unique), passwordHash, name, emailVerified, timestamps

**licenses** - Widget licenses
- id, userId, licenseKey (32-char hex, unique)
- tier ('basic' | 'pro' | 'agency')
- domains (text array), domainLimit, widgetLimit
- brandingEnabled, status ('active' | 'expired' | 'cancelled')
- stripeSubscriptionId, stripeCustomerId, expiresAt
- timestamps

**widgets** - Widget instances (owned directly by a user)
- id, userId (NOT NULL), widgetKey (16-char alphanumeric, unique, NOT NULL — drives embed URLs)
- name, status ('active' | 'paused' | 'deleted')
- widgetType ('n8n' | 'chatkit'), kind ('chat' | 'display')
- embedType ('popup' | 'inline' | 'fullpage' | 'portal')
- config (JSONB, canonical widget-config shape), allowedDomains (text array)
- version (incremented on updates), deployedAt, timestamps

**analyticsEvents** - Usage tracking
- id, userId, widgetId, eventType, domain, metadata (JSONB), createdAt

**passwordResetTokens** - Password reset flow
- id, userId, token (unique), expiresAt, createdAt

**invitations** / **activityLog** - Team invitations and audit trail

### License Tiers
- **Basic** ($29/year): 1 domain, 1 widget, branding enabled
- **Pro** ($49/year): 1 domain, 3 widgets, white-label
- **Agency** ($149/year): Unlimited domains/widgets, white-label

---

## Key Features

### Widget System
- 70+ customization options across 6 sections:
  - Branding (company name, logo, welcome text)
  - Theme (colors, position, size, dark mode)
  - Typography (fonts, sizes, Google Fonts)
  - Advanced Styling (message bubbles, code blocks)
  - Features (file attachments, context capture)
  - Connection (N8n webhook URL)
- Real-time preview with device toggle (desktop/mobile/tablet)
- Domain validation and authorization
- Rate limiting via Upstash Redis (sliding window) when configured; in-memory fallback in dev/test (`lib/security/rate-limit.ts`)
- Session management with persistent IDs
- SSE streaming for real-time responses

### Config Architecture (canonical single source of truth)
- `lib/widget-config/` is the single source of truth for the widget config schema:
  - `schema.ts` (canonical Zod schema + types), `defaults.ts`, `field-registry.ts`
    (schema-driven field metadata that powers the configurator sidebar), `migrate.ts`
    (normalizes legacy shapes to schemaVersion 2), `path.ts`, `index.ts`.
- The legacy `widgetConfigs` table and the per-tier config files have been replaced
  by this canonical module.

### Serving Model (v2)
- Customers embed a single stable URL: **`/widget/loader.js`** with `data-widget-key`.
- The loader fetches **`GET /api/w/[widgetKey]/config`**, which returns an envelope
  `{ bundlePath, runtime }` (`runtime` = `{ uiConfig, relay, flags }`).
- The loader pre-injects `window.ChatWidgetConfig = runtime`, then injects the
  **content-hashed bundle** (`/widget/v/chat-widget.<hash>.js`).
- The bundle reads the pre-injected config (fast path); there is no runtime config
  re-fetch and no server-side HTML injection pipeline (removed).
- Legacy `/api/widget/[license]/chat-widget.js` is a thin compat adapter that
  bootstraps the same loader with the resolved widgetKey.

### Configurator
- Schema-driven registry sidebar (renders fields from `lib/widget-config/field-registry.ts`).
- Single unified dynamic route: `app/configurator/[kind]/` (chat | display) replaces
  the previously duplicated per-kind pages.

### Markdown Rendering
- XSS sanitization with DOMPurify
- Markdown rendering with markdown-it
- Syntax highlighting with Prism.js (lazy loaded)
- LRU cache with TTL for performance
- 64% bundle reduction through lazy loading

---

## Development Workflow

### Getting Started

```bash
# 1. Environment Setup
cp .env.example .env.local
# Edit .env.local with DATABASE_URL and JWT_SECRET

# 2. Install Dependencies
pnpm install

# 3. Database Setup
pnpm db:push     # Push schema to database
pnpm db:seed     # Seed with test data

# 4. Development Server
pnpm dev         # Start on http://localhost:3000

# 5. Build Widget
pnpm build:widget  # Build standalone widget
```

### Running Tests

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # Coverage report
```

### Database Commands

```bash
pnpm db:generate   # Generate migrations
pnpm db:push       # Push schema (development)
pnpm db:migrate    # Run migrations (production)
pnpm db:studio     # Visual database browser
pnpm db:seed       # Seed test data
```

---

## Documentation Structure

### docs/development/
- **DEVELOPMENT_LOG.md** - Development history
- **PROGRESS.md** - Progress tracking
- **decisions.md** - Architectural Decision Records
- **SESSION_HANDOFF.md** - Session handoff instructions
- **todo.md** - Task tracking

### docs/planning/
- **PLANNING.md** - Project planning and roadmap
- **IMPLEMENTATION_BRIEF.md** - Implementation strategy

### docs/modules/
- Phase completion summaries
- Module-specific documentation

### docs/testing/
- Test coverage and results
- Testing quick start guide

### docs/reviews/
- Code quality reviews
- Security audits

### docs/solutions/
- Documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.

---

## Configuration Files

- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **next.config.ts** - Next.js configuration
- **drizzle.config.ts** - Database configuration
- **jest.config.js** - Testing configuration
- **eslint.config.mjs** - Linting configuration
- **components.json** - shadcn/ui configuration
- **middleware.ts** - Route protection

---

## Files for Active Development

1. **docs/development/DEVELOPMENT_LOG.md** - Log significant changes
2. **docs/development/decisions.md** - Document architectural decisions
3. **docs/development/PROGRESS.md** - Update progress tracking
4. **docs/development/todo.md** - Track active tasks

---

**Last Updated:** 2026-06-10
**Git Branch:** feat/production-readiness

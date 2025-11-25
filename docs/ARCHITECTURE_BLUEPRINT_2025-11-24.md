# N8n Widget Designer Platform - Architecture Blueprint

**Document Created:** 2025-11-24
**Verified Against:** Codebase commit `dfd30a8`
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [API Routes](#2-api-routes)
3. [React Components](#3-react-components)
4. [State Management](#4-state-management)
5. [Library Modules](#5-library-modules)
6. [Widget Architecture](#6-widget-architecture)
7. [Database Schema](#7-database-schema)
8. [Data Flows](#8-data-flows)
9. [Security Architecture](#9-security-architecture)

---

## 1. System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  Next.js App │  │   Widget     │  │    Customer Website          │  │
│  │  (React SPA) │  │  Configurator│  │    (Embedded Widget)         │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┬───────────────┘  │
│         │                 │                          │                  │
│         ▼                 ▼                          ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Zustand Stores                                 │  │
│  │  auth-store | license-store | widget-store | preview-store       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │
│  │ /api/auth  │ │/api/licenses│ │/api/widgets│ │ /api/widget/[key]  │   │
│  │  - login   │ │  - CRUD    │ │  - CRUD    │ │  - chat-widget.js  │   │
│  │  - signup  │ │  - validate│ │  - deploy  │ │  - config          │   │
│  │  - logout  │ │            │ │  - download│ │                    │   │
│  │  - me      │ │            │ │            │ │                    │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘   │
│                                                                         │
│  ┌────────────────────┐  ┌────────────────────────────────────────┐    │
│  │  /api/chat-relay   │  │  /api/embed/bundle.js                  │    │
│  │  (N8n forwarding)  │  │  (Raw widget bundle)                   │    │
│  └────────────────────┘  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  lib/auth    │ │ lib/license  │ │  lib/widget  │ │   lib/db     │   │
│  │  - jwt.ts    │ │ - generate.ts│ │  - serve.ts  │ │  - schema.ts │   │
│  │  - password  │ │ - validate.ts│ │  - rate-limit│ │  - queries.ts│   │
│  │  - guard.ts  │ │ - domain.ts  │ │  - headers.ts│ │  - client.ts │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    PostgreSQL (Neon)                              │  │
│  │  users | licenses | widgets | widgetConfigs | analyticsEvents    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16.0.1 |
| Language | TypeScript | 5.x |
| UI Library | React | 18.3.1 |
| State | Zustand | 5.0.8 |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui | - |
| Database | PostgreSQL | - |
| ORM | Drizzle | 0.44.7 |
| Auth | JWT (jose) | 6.1.0 |
| Validation | Zod | 4.1.12 |
| Testing | Jest | 29.7.0 |
| Widget Build | esbuild | 0.21.5 |

---

## 2. API Routes

### Authentication (`app/api/auth/`)

| File | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `login/route.ts` | POST | `/api/auth/login` | Authenticate user, return JWT in HTTP-only cookie |
| `signup/route.ts` | POST | `/api/auth/signup` | Create user account with validation |
| `logout/route.ts` | POST | `/api/auth/logout` | Clear authentication cookie |
| `me/route.ts` | GET | `/api/auth/me` | Get authenticated user profile |

**Authentication Flow:**
```
POST /api/auth/login
Body: { email: string, password: string }
Response: { user: {id, email, name}, token: string }
Cookie: auth_token (HTTP-only, Secure, SameSite=Strict)
```

### License Management (`app/api/licenses/`)

| File | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `route.ts` | POST | `/api/licenses` | Create license with tier settings |
| `route.ts` | GET | `/api/licenses` | List user's licenses |
| `[id]/route.ts` | PATCH | `/api/licenses/[id]` | Update domains/status |
| `validate/route.ts` | POST | `/api/licenses/validate` | Public license validation |

**Tier Configuration:**
```typescript
Basic:  { domainLimit: 1,  widgetLimit: 1,  brandingEnabled: true  }
Pro:    { domainLimit: 1,  widgetLimit: 3,  brandingEnabled: false }
Agency: { domainLimit: -1, widgetLimit: -1, brandingEnabled: false }
```

### Widget Management (`app/api/widgets/`)

| File | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `route.ts` | POST | `/api/widgets` | Create widget with config |
| `route.ts` | GET | `/api/widgets` | List widgets (paginated) |
| `[id]/route.ts` | GET | `/api/widgets/[id]` | Get single widget |
| `[id]/route.ts` | PATCH | `/api/widgets/[id]` | Update widget config |
| `[id]/route.ts` | DELETE | `/api/widgets/[id]` | Soft delete widget |
| `[id]/deploy/route.ts` | POST | `/api/widgets/[id]/deploy` | Deploy with validation |
| `[id]/download/route.ts` | GET | `/api/widgets/[id]/download` | Download package |

**Widget Creation:**
```typescript
POST /api/widgets
Body: { licenseId: string, name: string, config?: Partial<WidgetConfig> }
Response: { widget: Widget, licenseKey: string }
```

### Widget Serving (`app/api/widget/`)

| File | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `[license]/chat-widget.js/route.ts` | GET | `/api/widget/[key]/chat-widget.js` | Serve widget bundle |
| `[license]/config/route.ts` | GET | `/api/widget/[key]/config` | Get widget config |

**Widget Serving Security:**
- Referer header validation
- Domain authorization check
- Rate limiting (10 req/sec IP, 100 req/min license)
- License status verification

### Other Routes

| File | Method | Endpoint | Purpose |
|------|--------|----------|---------|
| `chat-relay/route.ts` | POST | `/api/chat-relay` | Forward messages to N8n |
| `embed/bundle.js/route.ts` | GET | `/api/embed/bundle.js` | Serve raw widget bundle |

---

## 3. React Components

### Component Tree

```
components/
├── auth/
│   ├── login-form.tsx      # Email/password login
│   └── signup-form.tsx     # Registration form
├── dashboard/
│   ├── license-card.tsx    # License display card
│   ├── widget-list.tsx     # Widget grid with actions
│   ├── domain-manager.tsx  # Add/remove domains
│   ├── domain-input.tsx    # Domain input field
│   └── widget-download-buttons.tsx
├── configurator/
│   ├── preview-frame.tsx   # Iframe preview
│   ├── device-switcher.tsx # Desktop/tablet/mobile
│   └── domain-info-card.tsx
├── landing/
│   ├── navbar.tsx          # Navigation header
│   ├── hero.tsx            # Hero section
│   ├── features.tsx        # Feature cards
│   └── footer.tsx          # Page footer
└── ui/                     # shadcn/ui components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── badge.tsx
    ├── dialog.tsx
    ├── alert.tsx
    └── sonner.tsx
```

### Key Component Details

**PreviewFrame** (`components/configurator/preview-frame.tsx`)
```typescript
interface PreviewFrameProps {
  config: WidgetConfig;
  className?: string;
}
// Renders widget in isolated iframe
// Communicates via postMessage API
// Debounced config updates (50ms)
```

**WidgetList** (`components/dashboard/widget-list.tsx`)
```typescript
interface WidgetListProps {
  widgets: Widget[];
  onDelete: (id: string) => Promise<void>;
}
// Grid of widget cards
// Edit, delete, deploy, download actions
// Copy embed code functionality
```

**DomainManager** (`components/dashboard/domain-manager.tsx`)
```typescript
interface DomainManagerProps {
  domains: string[];
  domainLimit: number;
  onUpdate: (domains: string[]) => Promise<void>;
  disabled?: boolean;
}
// Add/remove authorized domains
// Validates against domain limit
```

---

## 4. State Management

### Store Architecture

```
stores/
├── auth-store.ts      # Authentication state
├── license-store.ts   # License management
├── widget-store.ts    # Widget CRUD & config
└── preview-store.ts   # Preview iframe state
```

### Auth Store (`stores/auth-store.ts`)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Actions
login(email, password)    // POST /api/auth/login
signup(data)              // POST /api/auth/signup
logout()                  // POST /api/auth/logout
checkAuth()               // GET /api/auth/me
```

### License Store (`stores/license-store.ts`)

```typescript
interface LicenseState {
  licenses: License[];
  selectedLicense: License | null;
  isLoading: boolean;
  error: string | null;
}

// Actions
fetchLicenses()           // GET /api/licenses
updateLicense(id, data)   // PATCH /api/licenses/:id
deleteLicense(id)         // DELETE /api/licenses/:id
selectLicense(license)    // Set active license
```

### Widget Store (`stores/widget-store.ts`)

```typescript
interface WidgetState {
  widgets: Widget[];
  currentWidget: Widget | null;
  currentConfig: WidgetConfig;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: string | null;
}

// Actions
fetchWidgets(licenseId?)  // GET /api/widgets
createWidget(data)        // POST /api/widgets
getWidget(id)             // GET /api/widgets/:id
updateWidget(id, data)    // PATCH /api/widgets/:id
deleteWidget(id)          // DELETE /api/widgets/:id
deployWidget(id)          // POST /api/widgets/:id/deploy
updateConfig(partial)     // Local config update
saveConfig()              // Save to server
```

### Preview Store (`stores/preview-store.ts`)

```typescript
interface PreviewState {
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  isPreviewReady: boolean;
  isWidgetOpen: boolean;
  previewError: string | null;
  iframeRef: HTMLIFrameElement | null;
}

// Device Dimensions
desktop: { width: 1440, height: 900 }
tablet:  { width: 768,  height: 1024 }
mobile:  { width: 375,  height: 667 }

// Actions
setDeviceMode(mode)       // Switch viewport
sendConfigUpdate(config)  // PostMessage to iframe
openWidget() / closeWidget()
```

---

## 5. Library Modules

### Module Map

```
lib/
├── api/
│   ├── auth-client.ts    # Client-side auth utilities
│   └── schemas.ts        # Zod request schemas
├── auth/
│   ├── jwt.ts            # JWT sign/verify (jose)
│   ├── password.ts       # Hash/verify (bcrypt)
│   ├── guard.ts          # requireAuth middleware
│   └── helpers.ts        # Auth helper functions
├── db/
│   ├── client.ts         # Drizzle DB instance
│   ├── schema.ts         # Table definitions
│   └── queries.ts        # CRUD operations
├── license/
│   ├── generate.ts       # License key generation
│   ├── validate.ts       # License validation
│   └── domain.ts         # Domain normalization
├── widget/
│   ├── serve.ts          # Bundle serving
│   ├── inject.ts         # License flag injection
│   ├── rate-limit.ts     # Rate limiting
│   ├── headers.ts        # Response headers
│   └── error.ts          # Error scripts
├── validation/
│   └── widget-schema.ts  # Config validation
├── config/
│   └── defaults.ts       # Tier defaults
├── types/
│   └── widget-config.ts  # TypeScript types
├── utils.ts              # General utilities (cn, classnames)
├── utils/
│   └── api-error.ts      # Error handling
├── zip-generator.ts      # Main package generator
└── zip-generator/
    ├── html-templates.ts
    ├── extension-templates.ts
    └── readme-templates.ts
```

### Key Module Functions

**Authentication** (`lib/auth/`)
```typescript
// jwt.ts
signJWT(payload): Promise<string>
verifyJWT(token): Promise<JWTPayload>

// password.ts
hashPassword(password): Promise<string>
verifyPassword(password, hash): Promise<boolean>
validatePasswordStrength(password): { valid, errors }

// guard.ts
requireAuth(request): Promise<JWTPayload>
createAuthCookie(token): ResponseCookie
clearAuthCookie(): ResponseCookie
```

**License** (`lib/license/`)
```typescript
// generate.ts
generateLicenseKey(): string  // 32-char hex

// validate.ts
validateLicense(key, domain): Promise<ValidationResult>

// domain.ts
normalizeDomain(domain): string  // lowercase, strip www/port
```

**Widget** (`lib/widget/`)
```typescript
// serve.ts
serveWidgetBundle(license, widgetId?): Promise<string>

// rate-limit.ts
checkRateLimit(identifier, type): { allowed, retryAfter? }

// inject.ts
injectLicenseFlags(bundle, license, widgetId?): string
```

**Database** (`lib/db/queries.ts`)
```typescript
// Users
getUserByEmail(email), getUserById(id), createUser(data)

// Licenses
getLicenseByKey(key), getLicenseById(id), createLicense(data)

// Widgets
createWidget(data), getWidgetById(id), getWidgetWithLicense(id)
getWidgetsByLicenseId(licenseId), updateWidget(id, data)
deleteWidget(id), deployWidget(id), getWidgetsPaginated(userId, options)
getActiveWidgetCount(licenseId)
```

---

## 6. Widget Architecture

### Widget File Structure

```
widget/src/
├── index.ts              # IIFE entry point
├── widget.ts             # Main widget creation
├── markdown.ts           # Markdown rendering
├── types.ts              # TypeScript definitions
├── core/
│   ├── widget.ts         # Widget class
│   ├── config.ts         # Config management
│   ├── state.ts          # StateManager class
│   ├── config-validator.ts
│   ├── normal-renderer.ts
│   ├── portal-renderer.ts
│   └── ui-builder.ts
├── ui/
│   ├── toggle-button.ts  # Chat bubble
│   ├── chat-container.ts # Chat window
│   ├── header.ts         # Window header
│   ├── message-list.ts   # Message display
│   ├── input-area.ts     # User input
│   ├── footer.ts         # Optional footer
│   └── file-upload.ts    # Attachments
├── services/messaging/
│   ├── message-sender.ts # Send to relay
│   ├── session-manager.ts # Session persistence
│   ├── payload.ts        # Payload construction
│   ├── sse-client.ts     # Streaming responses
│   ├── retry-policy.ts   # Retry logic
│   └── types.ts
├── theming/
│   ├── theme-manager.ts  # Light/dark switching
│   ├── css-variables.ts  # CSS custom properties
│   └── css-injector.ts   # Style injection
└── utils/
    ├── xss-sanitizer.ts  # DOMPurify wrapper
    ├── markdown-renderer.ts
    ├── markdown-cache.ts
    ├── markdown-pipeline.ts
    ├── syntax-highlighter.ts
    ├── lazy-loader.ts
    ├── session-id-generator.ts
    └── network-error-handler.ts
```

### Widget Initialization Flow

```
1. Script loads: <script src="/api/widget/{key}/chat-widget.js">
2. IIFE executes immediately
3. Wait for DOMContentLoaded
4. Read config from window.__WIDGET_CONFIG__ or fetch from API
5. Extract license key from script URL or container
6. Create SessionManager (restore or generate session ID)
7. Build WidgetRuntimeConfig with relay settings
8. Call createChatWidget(config)
9. Render bubble button in corner
10. User clicks → open chat window
11. Messages sent via /api/chat-relay
```

### Widget Modes

```typescript
type WidgetMode = 'normal' | 'portal' | 'embedded';

// Normal: Bubble + popup window (default)
// Portal: Full-screen chat interface
// Embedded: Chat in custom container
```

### Message Flow

```
User types message
       ↓
MessageSender.send(message)
       ↓
Build payload: {
  widgetId, licenseKey, message,
  chatInput, sessionId, context
}
       ↓
POST /api/chat-relay
       ↓
Server validates license ownership
       ↓
Forward to N8n webhook URL
       ↓
N8n processes, returns response
       ↓
Display in message list (markdown rendered)
```

### Widget Configuration Interface

```typescript
interface WidgetConfig {
  // Metadata (optional)
  widgetId?: string;
  license?: {
    key?: string;
    active?: boolean;
    plan?: string;
  };
  // Branding
  branding: {
    companyName?: string;
    logoUrl?: string;
    welcomeText?: string;
    firstMessage?: string;
  };
  // Style
  style: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    backgroundColor?: string;
    textColor?: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    cornerRadius?: number;
  };
  // Typography
  typography?: {
    fontFamily?: string;
    fontSize?: number;
  };
  // Connection
  connection: {
    webhookUrl: string;
    routeParam?: string;
  };
  // Features
  features?: {
    fileAttachments?: boolean;
    allowedExtensions?: string[];
    maxFileSize?: number;
  };
  // Advanced
  advanced?: {
    customCss?: string;
    customJs?: string;
  };
}
```

---

## 7. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   licenses   │       │   widgets    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │──┐    │ id (PK)      │
│ email        │  │    │ userId (FK)  │←─┘    │ licenseId(FK)│←─┘
│ passwordHash │  └───→│ licenseKey   │       │ name         │
│ name         │       │ tier         │       │ config (JSON)│
│ emailVerified│       │ domains[]    │       │ status       │
│ createdAt    │       │ domainLimit  │       │ version      │
│ updatedAt    │       │ widgetLimit  │       │ deployedAt   │
└──────────────┘       │ brandingEnab │       │ createdAt    │
                       │ status       │       │ updatedAt    │
                       │ stripeSubId  │       └──────────────┘
                       │ stripeCustId │
                       │ expiresAt    │
                       │ createdAt    │
                       │ updatedAt    │
                       └──────────────┘
```

### Table Definitions

**users** (`lib/db/schema.ts:20`)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**licenses** (`lib/db/schema.ts:39`)
```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  license_key VARCHAR(32) UNIQUE NOT NULL,
  tier VARCHAR(20) NOT NULL,
  domains TEXT[] NOT NULL DEFAULT '{}',
  domain_limit INTEGER NOT NULL,
  widget_limit INTEGER NOT NULL DEFAULT 1,
  branding_enabled BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

**widgets** (`lib/db/schema.ts:92`)
```sql
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  config JSONB NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  deployed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX widgets_license_id_idx ON widgets(license_id);
CREATE INDEX widgets_status_idx ON widgets(status);
CREATE INDEX widgets_config_idx ON widgets USING GIN(config);
```

**Additional Tables:**
- `widget_configs` - Legacy one-to-one config (deprecated)
- `analytics_events` - Usage tracking (optional)
- `password_reset_tokens` - Password reset flow

---

## 8. Data Flows

### Authentication Flow

```
┌─────────┐      ┌─────────────┐      ┌─────────────┐      ┌──────────┐
│ Browser │      │  AuthStore  │      │  /api/auth  │      │    DB    │
└────┬────┘      └──────┬──────┘      └──────┬──────┘      └────┬─────┘
     │                  │                    │                  │
     │ submit login     │                    │                  │
     │─────────────────>│                    │                  │
     │                  │ POST /login        │                  │
     │                  │───────────────────>│                  │
     │                  │                    │ getUserByEmail   │
     │                  │                    │─────────────────>│
     │                  │                    │<─────────────────│
     │                  │                    │ verifyPassword   │
     │                  │                    │ signJWT          │
     │                  │<───────────────────│ Set-Cookie       │
     │ update state     │                    │                  │
     │<─────────────────│                    │                  │
     │ redirect /dashboard                   │                  │
```

### Widget Embedding Flow

```
┌───────────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────┐
│Customer Site  │     │/api/widget/[key]│     │  /api/relay  │     │ N8n  │
└───────┬───────┘     └────────┬────────┘     └──────┬───────┘     └──┬───┘
        │                      │                     │                │
        │ <script src="...">   │                     │                │
        │─────────────────────>│                     │                │
        │                      │ validate referer    │                │
        │                      │ check license       │                │
        │                      │ check domain        │                │
        │<─────────────────────│ JS bundle           │                │
        │                      │                     │                │
        │ IIFE executes        │                     │                │
        │ render widget        │                     │                │
        │                      │                     │                │
        │ user sends message   │                     │                │
        │─────────────────────────────────────────->│                │
        │                      │                     │ validate       │
        │                      │                     │ forward to N8n │
        │                      │                     │───────────────>│
        │                      │                     │<───────────────│
        │<─────────────────────────────────────────│ response        │
        │ display response     │                     │                │
```

### Preview Update Flow

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│ Configurator│     │PreviewStore │     │ PreviewFrame │
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                   │
       │ updateConfig      │                   │
       │──────────────────>│                   │
       │                   │ debounce 50ms     │
       │                   │──────────────────>│
       │                   │ postMessage       │
       │                   │ CONFIG_UPDATE     │
       │                   │──────────────────>│
       │                   │                   │ re-render widget
       │                   │                   │
```

---

## 9. Security Architecture

### Authentication Security

| Mechanism | Implementation |
|-----------|----------------|
| Password Storage | bcrypt (12 rounds) |
| Token Format | JWT (HS256) |
| Token Storage | HTTP-only cookie |
| Token Expiry | 7 days |
| Cookie Flags | Secure, SameSite=Strict |

### Authorization Model

```
┌─────────────────────────────────────────────────────────┐
│                    Request                               │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  1. Extract JWT from cookie                             │
│  2. Verify JWT signature and expiry                     │
│  3. Extract userId from payload                         │
└─────────────────────────┬───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  4. Query resource from database                        │
│  5. Verify resource.userId === auth.userId              │
│  6. Return 403 if ownership check fails                 │
└─────────────────────────────────────────────────────────┘
```

### Widget Security

| Layer | Protection |
|-------|------------|
| Domain | Referer header validation |
| License | Status, expiration, domain check |
| Rate Limit | IP: 10/sec, License: 100/min |
| XSS | DOMPurify sanitization |
| Webhook | HTTPS required (except localhost) |

### Input Validation

All API inputs validated with Zod schemas:
- `lib/api/schemas.ts` - Request body schemas
- `lib/validation/widget-schema.ts` - Widget config schema

### Data Protection

| Data | Protection |
|------|------------|
| Passwords | bcrypt hash, never logged |
| JWT Secret | Environment variable only |
| Database | Parameterized queries (Drizzle) |
| Sessions | SessionStorage (not localStorage) |
| Webhook URLs | Not exposed to client (relay pattern) |

---

## Appendix: File Index

### API Routes (15 files)
```
app/api/auth/login/route.ts
app/api/auth/logout/route.ts
app/api/auth/me/route.ts
app/api/auth/signup/route.ts
app/api/chat-relay/route.ts
app/api/embed/bundle.js/route.ts
app/api/licenses/route.ts
app/api/licenses/[id]/route.ts
app/api/licenses/validate/route.ts
app/api/widget/[license]/chat-widget.js/route.ts
app/api/widget/[license]/config/route.ts
app/api/widgets/route.ts
app/api/widgets/[id]/route.ts
app/api/widgets/[id]/deploy/route.ts
app/api/widgets/[id]/download/route.ts
```

### Components (22 files)
```
components/auth/login-form.tsx
components/auth/signup-form.tsx
components/configurator/device-switcher.tsx
components/configurator/domain-info-card.tsx
components/configurator/preview-frame.tsx
components/dashboard/domain-input.tsx
components/dashboard/domain-manager.tsx
components/dashboard/license-card.tsx
components/dashboard/widget-download-buttons.tsx
components/dashboard/widget-list.tsx
components/landing/features.tsx
components/landing/footer.tsx
components/landing/hero.tsx
components/landing/navbar.tsx
components/ui/alert.tsx
components/ui/badge.tsx
components/ui/button.tsx
components/ui/card.tsx
components/ui/dialog.tsx
components/ui/input.tsx
components/ui/label.tsx
components/ui/sonner.tsx
```

### Stores (4 files)
```
stores/auth-store.ts
stores/license-store.ts
stores/preview-store.ts
stores/widget-store.ts
```

### Widget Source (35 files)
```
widget/src/index.ts
widget/src/widget.ts
widget/src/markdown.ts
widget/src/types.ts
widget/src/core/*.ts (7 files)
widget/src/ui/*.ts (7 files)
widget/src/services/messaging/*.ts (6 files)
widget/src/theming/*.ts (3 files)
widget/src/utils/*.ts (8 files)
```

---

**Document End**

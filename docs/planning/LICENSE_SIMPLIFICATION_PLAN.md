# License & Domain Management Simplification Plan

**Version:** 2.0
**Last Updated:** December 2024
**Status:** Ready for Implementation

---

## Executive Summary

This plan transforms the current three-layer architecture (Users → Licenses → Widgets) into a simpler two-layer model (Users → Widgets) while:

1. Moving subscription/tier management to the account level
2. Implementing proper embed types (popup, inline, fullpage, portal)
3. Simplifying domain management to per-widget optional whitelists
4. Creating cleaner embed URLs with widget keys

This aligns with industry best practices from Zapier, Pickaxe, and other successful embeddable widget platforms.

---

## Table of Contents

1. [Current vs. Proposed Architecture](#current-vs-proposed-architecture)
2. [Key Design Decisions](#key-design-decisions)
3. [Database Schema Changes](#database-schema-changes)
4. [Embed Types System](#embed-types-system)
5. [API Changes](#api-changes)
6. [Frontend Changes](#frontend-changes)
7. [Widget Loader Updates](#widget-loader-updates)
8. [Migration Strategy](#migration-strategy)
9. [Implementation Checklist](#implementation-checklist)
10. [Risk Mitigation](#risk-mitigation)

---

## Current vs. Proposed Architecture

### Current Architecture (Problems)

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│  User   │────▶│ License  │────▶│ Widget  │
└─────────┘     └──────────┘     └─────────┘
                     │
                     ├── licenseKey (embed identifier)
                     ├── tier (basic/pro/agency)
                     ├── domains[] (whitelist)
                     ├── domainLimit
                     └── widgetLimit
```

**Problems:**
- Users must create a license before creating a widget (extra step)
- Domain management is at license level, not widget level
- Multiple licenses per user creates confusion
- License key in embed URL exposes billing relationship
- Only one embed code type generated (popup only)
- Embed modes exist in code but aren't exposed to users
- `widgetType` (n8n/chatkit) conflated with `embedType` (popup/inline/fullpage)

### Proposed Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│          User           │────▶│         Widget          │
├─────────────────────────┤     ├─────────────────────────┤
│ tier                    │     │ widgetKey (unique)      │
│ stripeCustomerId        │     │ name                    │
│ stripeSubscriptionId    │     │ widgetType (n8n/chatkit)│
│ subscriptionStatus      │     │ embedType (popup/inline/│
│ currentPeriodEnd        │     │           fullpage/portal)│
└─────────────────────────┘     │ config                  │
                                │ allowedDomains[]        │
                                │ status                  │
                                └─────────────────────────┘
```

**Benefits:**
- One-step widget creation (no license step)
- Per-widget domain control (optional)
- Account-level subscription (simpler billing)
- Widget-centric embed URLs
- Four distinct embed types with proper codes
- Clear separation of widget type vs embed type

---

## Key Design Decisions

### 1. Tier Management: Account-Level

**Decision:** Move `tier` to `users` table

**Rationale:**
- Users think "I have a Pro account" not "I have 3 Pro licenses"
- Simplifies upgrade flow (one action upgrades everything)
- Matches Pickaxe/Zapier model
- Reduces database complexity

### 2. Domain Management: Optional Per-Widget Whitelist

**Decision:** Domains become optional, per-widget, with wildcard support

**Rationale:**
- Most users don't need domain restrictions
- Those who do want per-widget control, not per-license
- Wildcard support (`*.example.com`) reduces friction
- Empty whitelist = allow all domains

### 3. Widget Limits: Feature-Based, Not Count-Based

**Decision:** Remove widget count limits, differentiate by features

**Rationale:**
- Widget limits feel arbitrary to users
- Creates support burden ("why can't I create another widget?")
- Feature differentiation is more intuitive
- Usage-based limits (messages/month) are fairer

### 4. Embed Identifier: Widget Key

**Decision:** Use `widgetKey` in embed URL instead of `licenseKey`

**Rationale:**
- Decouples billing from embedding
- More intuitive ("embed this widget" vs "embed this license")
- Allows multiple widgets with independent domains
- Cleaner URL structure (`/w/KEY.js` vs `/api/widget/LICENSE/chat-widget.js`)

### 5. Embed Types: Four Distinct Options

**Decision:** Support popup, inline, fullpage, and portal embed types

**Rationale:**
- Different use cases require different embed approaches
- Current single embed code doesn't serve all needs
- Users need clear guidance on which to use
- Each type has different code and behavior

### 6. License Table: Repurpose for Billing Only

**Decision:** Keep `licenses` table but rename to `subscriptions`

**Rationale:**
- Preserves existing Stripe integration
- Allows future support for multiple subscriptions
- Clean separation of concerns
- Easier migration path

---

## Database Schema Changes

### Phase 1: Add New Fields to Users Table

```sql
-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN current_period_end TIMESTAMP;

-- Add index for subscription lookups
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

### Phase 2: Add New Fields to Widgets Table

```sql
-- Add widget key for embed URLs (16-char alphanumeric)
ALTER TABLE widgets ADD COLUMN widget_key VARCHAR(16) UNIQUE;

-- Add embed type
ALTER TABLE widgets ADD COLUMN embed_type VARCHAR(20) DEFAULT 'popup';

-- Add optional domain whitelist (per-widget)
ALTER TABLE widgets ADD COLUMN allowed_domains TEXT[];

-- Add direct user relationship
ALTER TABLE widgets ADD COLUMN user_id UUID REFERENCES users(id);

-- Generate widget keys for existing widgets
UPDATE widgets SET widget_key = substr(md5(random()::text), 1, 16) WHERE widget_key IS NULL;

-- Make widget_key required
ALTER TABLE widgets ALTER COLUMN widget_key SET NOT NULL;

-- Add indexes
CREATE UNIQUE INDEX idx_widgets_widget_key ON widgets(widget_key);
CREATE INDEX idx_widgets_user_id ON widgets(user_id);
CREATE INDEX idx_widgets_embed_type ON widgets(embed_type);
```

### Phase 3: Migrate Data from Licenses

```sql
-- Copy tier data from licenses to users (use highest tier if multiple)
UPDATE users u SET tier = (
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM licenses l WHERE l.user_id = u.id AND l.tier = 'agency') THEN 'agency'
    WHEN EXISTS (SELECT 1 FROM licenses l WHERE l.user_id = u.id AND l.tier = 'pro') THEN 'pro'
    WHEN EXISTS (SELECT 1 FROM licenses l WHERE l.user_id = u.id AND l.tier = 'basic') THEN 'basic'
    ELSE 'free'
  END
);

-- Copy Stripe data from licenses to users
UPDATE users u SET
  stripe_customer_id = l.stripe_customer_id,
  stripe_subscription_id = l.stripe_subscription_id,
  current_period_end = l.expires_at
FROM licenses l
WHERE l.user_id = u.id AND l.status = 'active';

-- Copy domains from licenses to widgets
UPDATE widgets w SET allowed_domains = l.domains
FROM licenses l
WHERE w.license_id = l.id AND array_length(l.domains, 1) > 0;

-- Populate user_id from license relationship
UPDATE widgets w SET user_id = l.user_id
FROM licenses l
WHERE w.license_id = l.id;

-- Make user_id required
ALTER TABLE widgets ALTER COLUMN user_id SET NOT NULL;
```

### Phase 4: Rename/Archive License Table

```sql
-- Rename licenses to subscriptions (keep for billing history)
ALTER TABLE licenses RENAME TO subscriptions;

-- Remove limit columns (no longer used)
ALTER TABLE subscriptions DROP COLUMN widget_limit;
ALTER TABLE subscriptions DROP COLUMN domain_limit;

-- Make license_id optional on widgets (backward compatibility)
ALTER TABLE widgets ALTER COLUMN license_id DROP NOT NULL;
```

### Final Drizzle Schema

```typescript
// lib/db/schema.ts

import { pgTable, uuid, varchar, boolean, timestamp, text, jsonb, integer, uniqueIndex, index } from 'drizzle-orm/pg-core';

// =============================================================================
// Users Table (with account-level subscription)
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  emailVerified: boolean('email_verified').default(false),

  // Subscription (moved from licenses)
  tier: varchar('tier', { length: 20 }).default('free'), // 'free' | 'basic' | 'pro' | 'agency'
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }).default('active'),
  currentPeriodEnd: timestamp('current_period_end'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// Widgets Table (direct user relationship, embed types)
// =============================================================================

export const widgets = pgTable('widgets', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Direct user relationship (new)
  userId: uuid('user_id').references(() => users.id).notNull(),

  // Widget identification
  widgetKey: varchar('widget_key', { length: 16 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'), // 'active' | 'paused' | 'deleted'

  // Widget type (n8n vs chatkit) - determines backend provider
  widgetType: varchar('widget_type', { length: 20 }).default('n8n'), // 'n8n' | 'chatkit'

  // Embed type (how widget is deployed) - determines embed code
  embedType: varchar('embed_type', { length: 20 }).default('popup'), // 'popup' | 'inline' | 'fullpage' | 'portal'

  // Configuration
  config: jsonb('config').notNull(),

  // Domain whitelist (optional, empty = allow all)
  allowedDomains: text('allowed_domains').array(),

  // Versioning
  version: integer('version').default(1),
  deployedAt: timestamp('deployed_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Legacy: Keep for backward compatibility during migration
  licenseId: uuid('license_id').references(() => subscriptions.id),
}, (table) => ({
  widgetKeyIdx: uniqueIndex('widget_key_idx').on(table.widgetKey),
  userIdIdx: index('widgets_user_id_idx').on(table.userId),
  embedTypeIdx: index('widgets_embed_type_idx').on(table.embedType),
  statusIdx: index('widgets_status_idx').on(table.status),
}));

// =============================================================================
// Subscriptions Table (renamed from licenses, billing only)
// =============================================================================

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),

  // Subscription details
  tier: varchar('tier', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).default('active'), // 'active' | 'canceled' | 'past_due'

  // Stripe integration
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),

  // Billing period
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// =============================================================================
// Usage Events Table (for analytics and billing)
// =============================================================================

export const usageEvents = pgTable('usage_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  widgetId: uuid('widget_id').references(() => widgets.id).notNull(),

  eventType: varchar('event_type', { length: 50 }).notNull(), // 'message' | 'session' | 'file_upload'
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Embed Types System

### Overview

The system supports **4 distinct embed types**, each with different code, behavior, and use cases:

| Embed Type | Display | Use Case | URL Pattern |
|------------|---------|----------|-------------|
| **Popup** | Bubble + floating window | Website chat support | `/w/:widgetKey.js` |
| **Inline** | Embedded in container | Sidebar, dedicated section | `/w/:widgetKey.js?mode=inline` |
| **Fullpage** | Full viewport | Standalone chat page | `/chat/:widgetKey` (iframe) |
| **Portal** | Shareable link | Email, QR codes | `/chat/:widgetKey` (direct) |

### Terminology Clarification

| Term | Meaning | Values |
|------|---------|--------|
| `widgetType` | Backend provider | `'n8n'` or `'chatkit'` |
| `embedType` | How widget is deployed | `'popup'`, `'inline'`, `'fullpage'`, `'portal'` |

These are **independent** - any widget type can use any embed type.

### Embed Code by Type

#### 1. Popup (Default) - Floating Chat Widget

```html
<!-- Chat Widget (Popup) -->
<script src="https://yoursite.com/w/WIDGET_KEY.js" async></script>
```

**Behavior:**
- Renders floating bubble button (position configurable)
- Clicking opens chat window overlay
- Can be minimized/closed
- Works on any page

**Best For:** Website chat support, customer service

---

#### 2. Inline - Embedded in Container

```html
<!-- Chat Widget (Inline) -->
<div id="chat-widget" style="width: 400px; height: 600px;"></div>
<script
  src="https://yoursite.com/w/WIDGET_KEY.js"
  data-mode="inline"
  data-container="chat-widget"
  async
></script>
```

**Behavior:**
- Renders inside specified container element
- No floating bubble
- Sized to container dimensions
- Scrolls with page content

**Best For:** Sidebars, dedicated chat sections, documentation pages

---

#### 3. Fullpage - Full Viewport

```html
<!-- Chat Widget (Fullpage via iFrame) -->
<iframe
  src="https://yoursite.com/chat/WIDGET_KEY"
  style="width: 100%; height: 100vh; border: none;"
  allow="microphone; clipboard-write"
  title="Chat"
></iframe>
```

**Or as standalone page:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Chat Support</title>
  <style>html, body { margin: 0; height: 100%; }</style>
</head>
<body>
  <script src="https://yoursite.com/w/WIDGET_KEY.js" data-mode="fullpage" async></script>
</body>
</html>
```

**Behavior:**
- Takes full viewport
- No bubble, no minimize
- Header with title/branding
- Mobile-optimized

**Best For:** Standalone chat pages, mobile apps, kiosks

---

#### 4. Portal/Link - Shareable URL

```
Direct Link: https://yoursite.com/chat/WIDGET_KEY

Email Signature:
<a href="https://yoursite.com/chat/WIDGET_KEY">Chat with us</a>

QR Code: [Generated QR pointing to above URL]
```

**Behavior:**
- Standalone page (no embed needed)
- Shareable via any medium
- Same as fullpage but accessed directly

**Best For:** Email signatures, QR codes, support tickets, marketing

---

### Embed Code Generator

```typescript
// lib/embed/generate-embed-code.ts

import { Widget } from '@/lib/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://chat-interface-r.vercel.app';

export type EmbedType = 'popup' | 'inline' | 'fullpage' | 'portal';

export interface EmbedCodeResult {
  type: EmbedType;
  title: string;
  description: string;
  code: string;
  language: 'html' | 'url';
  icon: string; // For UI
}

export function generateEmbedCode(widget: Widget, type: EmbedType): EmbedCodeResult {
  const key = widget.widgetKey;

  switch (type) {
    case 'popup':
      return {
        type: 'popup',
        title: 'Popup Widget',
        description: 'Floating chat bubble that opens a chat window. Best for websites.',
        language: 'html',
        icon: 'message-circle',
        code: `<!-- Chat Widget -->
<script src="${BASE_URL}/w/${key}.js" async></script>`,
      };

    case 'inline':
      return {
        type: 'inline',
        title: 'Inline Widget',
        description: 'Embedded in a container. Best for sidebars or dedicated sections.',
        language: 'html',
        icon: 'layout',
        code: `<!-- Chat Widget (Inline) -->
<div id="chat-widget" style="width: 400px; height: 600px;"></div>
<script
  src="${BASE_URL}/w/${key}.js"
  data-mode="inline"
  data-container="chat-widget"
  async
></script>`,
      };

    case 'fullpage':
      return {
        type: 'fullpage',
        title: 'Fullpage Widget',
        description: 'Full viewport chat. Use iFrame to embed in other sites.',
        language: 'html',
        icon: 'maximize',
        code: `<!-- Chat Widget (Fullpage) -->
<iframe
  src="${BASE_URL}/chat/${key}"
  style="width: 100%; height: 100vh; border: none;"
  allow="microphone; clipboard-write"
  title="Chat"
></iframe>`,
      };

    case 'portal':
      return {
        type: 'portal',
        title: 'Shareable Link',
        description: 'Direct URL to chat. Share via email, QR code, or links.',
        language: 'url',
        icon: 'link',
        code: `${BASE_URL}/chat/${key}`,
      };
  }
}

export function generateAllEmbedCodes(widget: Widget): EmbedCodeResult[] {
  return (['popup', 'inline', 'fullpage', 'portal'] as EmbedType[]).map(type =>
    generateEmbedCode(widget, type)
  );
}

// Generate widget key (16-char alphanumeric)
export function generateWidgetKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
```

---

## API Changes

### New URL Structure

| Purpose | Old URL | New URL |
|---------|---------|---------|
| Widget bundle | `/api/widget/:license/chat-widget.js` | `/w/:widgetKey.js` |
| Widget config | `/api/widget/:license/config` | `/w/:widgetKey/config` |
| Fullpage chat | `/chat/portal/:widgetId` | `/chat/:widgetKey` |
| ChatKit iframe | `/widget/chatkit/:license` | `/chat/:widgetKey` (unified) |

### New Endpoints

#### Widget Management

```typescript
// POST /api/widgets - Create widget (simplified, no license required)
Request: {
  name: string;
  widgetType?: 'n8n' | 'chatkit';
  embedType?: 'popup' | 'inline' | 'fullpage' | 'portal';
  config?: Partial<WidgetConfig>;
  allowedDomains?: string[];
}

Response: {
  id: string;
  widgetKey: string;
  name: string;
  widgetType: string;
  embedType: string;
  config: WidgetConfig;
  allowedDomains: string[];
  embedCodes: EmbedCodeResult[]; // All 4 embed codes
}
```

```typescript
// GET /api/widgets - List user's widgets
Response: {
  widgets: Widget[];
  total: number;
}

// GET /api/widgets/:id - Get single widget
Response: Widget & { embedCodes: EmbedCodeResult[] }

// PATCH /api/widgets/:id - Update widget
Request: {
  name?: string;
  embedType?: EmbedType;
  config?: Partial<WidgetConfig>;
  allowedDomains?: string[];
  status?: 'active' | 'paused';
}

// DELETE /api/widgets/:id - Soft delete widget
```

#### Widget Serving

```typescript
// GET /w/:widgetKey.js - Serve widget bundle
// Query params: mode=popup|inline|fullpage
// Headers: Origin (for domain validation)

// GET /w/:widgetKey/config - Get widget config (JSON)

// GET /chat/:widgetKey - Fullpage/portal chat page (SSR)
```

#### Account/Subscription

```typescript
// GET /api/account/subscription
Response: {
  tier: 'free' | 'basic' | 'pro' | 'agency';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  features: {
    widgetLimit: number | 'unlimited';
    advancedStyling: boolean;
    whiteLabel: boolean;
    fileAttachments: boolean;
    prioritySupport: boolean;
  };
}

// POST /api/account/subscription/upgrade
Request: {
  tier: 'basic' | 'pro' | 'agency';
  paymentMethodId?: string;
}
Response: {
  checkoutUrl: string; // Stripe checkout
}

// POST /api/account/subscription/cancel
```

### Deprecated Endpoints (6-month sunset)

| Endpoint | Replacement |
|----------|-------------|
| `POST /api/licenses` | Account subscription auto-created |
| `GET /api/licenses` | `GET /api/account/subscription` |
| `PATCH /api/licenses/:id` | Domains: widget-level; Tier: account-level |
| `GET /api/widget/:license/config` | `GET /w/:widgetKey/config` |
| `GET /api/widget/:license/chat-widget.js` | `GET /w/:widgetKey.js` |

---

## Frontend Changes

### Dashboard Simplification

#### Current Flow (Complex)
```
Dashboard
├── Licenses (list)
│   ├── License 1
│   │   ├── Domains (manage)
│   │   └── Widgets (list)
│   │       ├── Widget A
│   │       └── Widget B
│   └── License 2
│       ├── Domains (manage)
│       └── Widgets (list)
└── Create License → Add Domains → Create Widget
```

#### New Flow (Simple)
```
Dashboard
├── Widgets (flat list)
│   ├── Widget 1 (with inline settings)
│   ├── Widget 2 (with inline settings)
│   └── Widget 3 (with inline settings)
├── Create Widget (one-click)
└── Account
    └── Subscription (manage/upgrade)
```

### Component Changes

| Old Component | Change |
|---------------|--------|
| `LicenseCard` | Remove → Replace with `SubscriptionCard` |
| `DomainManager` | Move into `WidgetSettings` |
| `WidgetList` | Flatten (remove license grouping) |
| `CreateWidgetModal` | Simplify (remove license selection) |
| `CodeModal` | Replace with `EmbedCodeModal` (tabbed) |

### New Components

#### SubscriptionCard
```typescript
// components/dashboard/subscription-card.tsx
// Shows current tier, usage, upgrade button
```

#### EmbedCodeModal (Tabbed)
```typescript
// components/configurator/embed-code-modal.tsx

interface EmbedCodeModalProps {
  widget: Widget;
  isOpen: boolean;
  onClose: () => void;
  defaultType?: EmbedType;
}

export function EmbedCodeModal({ widget, isOpen, onClose, defaultType = 'popup' }: EmbedCodeModalProps) {
  const [selectedType, setSelectedType] = useState<EmbedType>(defaultType);
  const embedCodes = generateAllEmbedCodes(widget);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList>
          {embedCodes.map(ec => (
            <TabsTrigger key={ec.type} value={ec.type}>
              <Icon name={ec.icon} />
              {ec.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {embedCodes.map(ec => (
          <TabsContent key={ec.type} value={ec.type}>
            <p className="text-muted-foreground">{ec.description}</p>
            <CodeBlock language={ec.language} code={ec.code} />
            <CopyButton code={ec.code} />
            {ec.type === 'portal' && <QRCodeGenerator url={ec.code} />}
          </TabsContent>
        ))}
      </Tabs>
    </Modal>
  );
}
```

#### Embed Type Selector (Configurator)
```typescript
// components/configurator/embed-type-selector.tsx

export function EmbedTypeSelector({ value, onChange }: Props) {
  const options = [
    { value: 'popup', label: 'Popup', description: 'Floating bubble on your website', icon: 'message-circle' },
    { value: 'inline', label: 'Inline', description: 'Embedded in a specific section', icon: 'layout' },
    { value: 'fullpage', label: 'Fullpage', description: 'Standalone chat page', icon: 'maximize' },
    { value: 'portal', label: 'Link Only', description: 'Shareable URL for email/QR', icon: 'link' },
  ];

  return (
    <RadioGroup value={value} onValueChange={onChange}>
      {options.map(opt => (
        <RadioGroupItem key={opt.value} value={opt.value}>
          <Icon name={opt.icon} />
          <div>
            <Label>{opt.label}</Label>
            <p className="text-sm text-muted-foreground">{opt.description}</p>
          </div>
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}
```

### Store Updates (Zustand)

```typescript
// stores/widget-store.ts - Updated

interface WidgetStore {
  widgets: Widget[];
  currentWidget: Widget | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchWidgets: () => Promise<void>;
  createWidget: (data: CreateWidgetInput) => Promise<Widget>;
  updateWidget: (id: string, data: UpdateWidgetInput) => Promise<void>;
  deleteWidget: (id: string) => Promise<void>;

  // Removed: license-related actions
}

// stores/account-store.ts - New

interface AccountStore {
  subscription: Subscription | null;
  isLoading: boolean;

  fetchSubscription: () => Promise<void>;
  upgrade: (tier: Tier) => Promise<string>; // Returns checkout URL
  cancel: () => Promise<void>;
}
```

---

## Widget Loader Updates

### Script Attribute Handling

The widget loader needs to detect mode from script attributes:

```typescript
// widget/src/core/loader.ts

interface LoaderConfig {
  widgetKey: string;
  mode: 'popup' | 'inline' | 'fullpage';
  container?: string;
}

(function() {
  // Get current script element
  const script = document.currentScript as HTMLScriptElement;
  if (!script) return;

  // Parse config from script attributes and URL
  const config: LoaderConfig = {
    widgetKey: extractWidgetKey(script.src),
    mode: (script.dataset.mode as LoaderConfig['mode']) || 'popup',
    container: script.dataset.container,
  };

  // Fetch widget config from server
  fetchWidgetConfig(config.widgetKey).then(widgetConfig => {
    initializeWidget(config, widgetConfig);
  });
})();

function initializeWidget(loader: LoaderConfig, config: WidgetConfig) {
  // Map loader mode to widget mode
  const widgetMode = loader.mode === 'popup' ? 'normal'
                   : loader.mode === 'inline' ? 'embedded'
                   : 'portal';

  const extendedConfig: ExtendedWidgetConfig = {
    ...config,
    mode: widgetMode,
  };

  // Handle inline mode with container
  if (loader.mode === 'inline' && loader.container) {
    const containerEl = document.getElementById(loader.container);
    if (containerEl) {
      const widget = new Widget(extendedConfig);
      widget.renderInContainer(containerEl);
      return;
    }
    console.warn(`Container #${loader.container} not found, falling back to popup mode`);
  }

  // Render widget
  const widget = new Widget(extendedConfig);
  widget.render();
}

function extractWidgetKey(src: string): string {
  // /w/ABC123XYZ.js -> ABC123XYZ
  const match = src.match(/\/w\/([a-zA-Z0-9]+)\.js/);
  return match ? match[1] : '';
}
```

### API Route: Widget Bundle Serving

```typescript
// app/w/[widgetKey]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { widgets, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetKey: string } }
) {
  const widgetKey = params.widgetKey.replace('.js', '');

  // 1. Find widget
  const widget = await db.query.widgets.findFirst({
    where: eq(widgets.widgetKey, widgetKey),
    with: { user: true },
  });

  if (!widget) {
    return new NextResponse('// Widget not found', {
      status: 404,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }

  if (widget.status !== 'active') {
    return new NextResponse('// Widget is not active', {
      status: 403,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }

  // 2. Check subscription
  if (widget.user.subscriptionStatus !== 'active') {
    return new NextResponse('// Subscription inactive', {
      status: 403,
      headers: { 'Content-Type': 'application/javascript' },
    });
  }

  // 3. Domain validation (if whitelist set)
  const origin = request.headers.get('origin');
  if (widget.allowedDomains && widget.allowedDomains.length > 0) {
    if (!validateDomain(origin, widget.allowedDomains)) {
      return new NextResponse('// Domain not authorized', {
        status: 403,
        headers: { 'Content-Type': 'application/javascript' },
      });
    }
  }

  // 4. Get appropriate bundle
  const bundle = await getWidgetBundle(widget);

  return new NextResponse(bundle, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function validateDomain(origin: string | null, allowedDomains: string[]): boolean {
  if (!origin) return false;

  try {
    const hostname = new URL(origin).hostname;
    return allowedDomains.some(pattern => matchDomainPattern(hostname, pattern));
  } catch {
    return false;
  }
}

function matchDomainPattern(domain: string, pattern: string): boolean {
  // Support wildcards: *.example.com matches sub.example.com
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return domain === suffix || domain.endsWith('.' + suffix);
  }
  return domain.toLowerCase() === pattern.toLowerCase();
}
```

### API Route: Fullpage Chat Page

```typescript
// app/chat/[widgetKey]/page.tsx

import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { widgets, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { FullpageChat } from '@/components/chat/fullpage-chat';

interface Props {
  params: { widgetKey: string };
}

export default async function ChatPage({ params }: Props) {
  const widget = await db.query.widgets.findFirst({
    where: eq(widgets.widgetKey, params.widgetKey),
    with: { user: true },
  });

  if (!widget) {
    notFound();
  }

  if (widget.status !== 'active') {
    return <WidgetInactivePage />;
  }

  if (widget.user.subscriptionStatus !== 'active') {
    return <SubscriptionExpiredPage />;
  }

  return <FullpageChat widget={widget} />;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props) {
  const widget = await db.query.widgets.findFirst({
    where: eq(widgets.widgetKey, params.widgetKey),
  });

  return {
    title: widget?.config?.branding?.companyName || 'Chat',
    description: widget?.config?.branding?.welcomeText || 'Chat with us',
  };
}
```

---

## Tier Feature Matrix

| Feature | Free | Basic ($29/yr) | Pro ($49/yr) | Agency ($149/yr) |
|---------|------|----------------|--------------|------------------|
| **Widgets** | 3 | 5 | Unlimited | Unlimited |
| **Embed Types** | Popup only | All | All | All |
| **Advanced Styling** | - | - | Yes | Yes |
| **White Label** | - | - | Yes | Yes |
| **File Attachments** | - | Yes | Yes | Yes |
| **Domain Whitelist** | - | Yes | Yes | Yes |
| **Custom Fonts** | - | - | Yes | Yes |
| **Email Transcripts** | - | - | - | Yes |
| **Priority Support** | - | - | - | Yes |
| **API Access** | - | - | - | Yes |
| **Team Members** | 1 | 1 | 1 | 5 |

**Note:** Domain restrictions are now a security feature available to all paid tiers, not a tier gate.

---

## Migration Strategy

### Phase 1: Parallel Operation (Week 1-2)

**Goal:** Deploy new schema without breaking existing functionality

1. Add new columns to `users` table (tier, stripe fields)
2. Add new columns to `widgets` table (widgetKey, embedType, allowedDomains, userId)
3. Generate widgetKey for all existing widgets
4. Populate userId from license relationship
5. Keep old API endpoints working
6. Deploy new `/w/:widgetKey.js` route (parallel to old route)

**Rollback:** Remove new columns, no data loss

**Verification:**
- Both old and new embed URLs work
- Existing widgets continue functioning
- Dashboard still uses old endpoints

### Phase 2: Frontend Migration (Week 3-4)

**Goal:** Update UI to new widget-centric model

1. Update dashboard to show flat widget list
2. Add `EmbedCodeModal` with tabs for all embed types
3. Add subscription management UI
4. Update configurator with embed type selector
5. Keep using old API endpoints (with new UI)

**Rollback:** Revert frontend changes

**Verification:**
- Users can create widgets without license step
- All 4 embed codes display correctly
- Subscription info shows on account page

### Phase 3: API Migration (Week 5-6)

**Goal:** Switch to new API endpoints

1. Update frontend to use new endpoints
2. Add deprecation headers to old endpoints
3. Log usage of deprecated endpoints
4. Update widget serving to use widgetKey
5. Redirect old URLs to new format

**Rollback:** Revert to old endpoints

**Verification:**
- New embed URLs work everywhere
- Old embed URLs redirect properly
- Analytics track embed type usage

### Phase 4: Cleanup (Week 7-8)

**Goal:** Remove legacy code and data

1. Remove deprecated API endpoints (or return 410 Gone)
2. Make `licenseId` nullable, stop using
3. Archive licenses table to `subscriptions`
4. Update all documentation
5. Send migration complete email to users

**Rollback:** Restore from backup (last resort)

---

## Implementation Checklist

### Database
- [ ] Create migration: add fields to `users` table
- [ ] Create migration: add `widgetKey`, `embedType`, `allowedDomains`, `userId` to `widgets`
- [ ] Create migration: populate `userId` from license relationship
- [ ] Create migration: generate `widgetKey` for existing widgets
- [ ] Create migration: copy tier/Stripe data to users
- [ ] Create migration: rename `licenses` to `subscriptions`
- [ ] Update Drizzle schema file
- [ ] Update seed script with new schema

### Backend API - Widget Serving
- [ ] Create `GET /w/:widgetKey.js` route
- [ ] Create `GET /w/:widgetKey/config` route
- [ ] Create `GET /chat/:widgetKey` page
- [ ] Update widget bundle to handle `data-mode` attribute
- [ ] Implement domain validation with wildcard support
- [ ] Add subscription status check
- [ ] Set up redirects from old URLs

### Backend API - Widget Management
- [ ] Update `POST /api/widgets` (remove license requirement)
- [ ] Update `GET /api/widgets` (filter by userId)
- [ ] Add `embedType` to widget CRUD
- [ ] Return `embedCodes` array in responses
- [ ] Add deprecation headers to old license endpoints

### Backend API - Account
- [ ] Create `GET /api/account/subscription`
- [ ] Create `POST /api/account/subscription/upgrade`
- [ ] Create `POST /api/account/subscription/cancel`
- [ ] Update Stripe webhook handlers

### Frontend - Dashboard
- [ ] Create `SubscriptionCard` component
- [ ] Update `WidgetList` (flatten, remove license grouping)
- [ ] Update `CreateWidgetModal` (remove license step)
- [ ] Add widget settings panel (domains, embed type)
- [ ] Update navigation/layout

### Frontend - Configurator
- [ ] Create `EmbedCodeModal` with tabs
- [ ] Create `EmbedTypeSelector` component
- [ ] Add QR code generator for portal links
- [ ] Update preview to match selected embed type
- [ ] Show embed type in widget summary

### Frontend - Stores
- [ ] Update `widget-store.ts` (remove license refs)
- [ ] Create `account-store.ts`
- [ ] Remove or update `license-store.ts`

### Widget Bundle
- [ ] Update loader to parse `data-mode` and `data-container`
- [ ] Add `renderInContainer()` method
- [ ] Test all 4 embed modes
- [ ] Update bundle build process

### Testing
- [ ] Unit tests for new API endpoints
- [ ] Unit tests for embed code generation
- [ ] Unit tests for domain validation (wildcards)
- [ ] Integration tests for widget serving
- [ ] E2E tests for widget creation flow
- [ ] E2E tests for all embed types
- [ ] Load testing new endpoints

### Documentation
- [ ] Update API documentation
- [ ] Update embed code documentation
- [ ] Create migration guide for existing users
- [ ] Update CLAUDE.md
- [ ] Update README

---

## Risk Mitigation

### Risk 1: Breaking Existing Embeds

**Severity:** High
**Probability:** Medium

**Mitigation:**
- Keep old `/api/widget/:license/chat-widget.js` route working
- Add redirect from old URLs to new format
- 6-month deprecation period with console warnings
- Email notification to users with old embed codes
- Analytics to track old vs new URL usage

### Risk 2: Data Loss During Migration

**Severity:** High
**Probability:** Low

**Mitigation:**
- All migrations are additive first (add columns, not remove)
- Full database backup before each phase
- Test migrations on staging first
- Rollback scripts prepared and tested
- Keep `licenseId` on widgets during transition

### Risk 3: Stripe Integration Issues

**Severity:** High
**Probability:** Medium

**Mitigation:**
- Test with Stripe test mode extensively
- Keep subscription data in both tables during transition
- Manual reconciliation script ready
- Webhook handlers log all events
- Customer support trained on migration issues

### Risk 4: User Confusion

**Severity:** Medium
**Probability:** Medium

**Mitigation:**
- In-app migration wizard for existing users
- Email notification explaining changes
- Help documentation with before/after screenshots
- Video walkthrough of new flow
- Prominent "What's New" banner

### Risk 5: Performance Degradation

**Severity:** Medium
**Probability:** Low

**Mitigation:**
- New routes have proper caching headers
- Database indexes on new columns
- Load testing before production
- Gradual rollout (10% → 50% → 100%)
- Monitoring dashboards ready

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Steps to create first widget | 4 | 1 | User flow tracking |
| Time to first embed | ~10 min | <2 min | Analytics |
| Support tickets (domain issues) | ~20% | <5% | Zendesk |
| Embed code copy rate | N/A | Track all 4 types | Analytics |
| Widget creation conversion | Baseline | +20% | Funnel tracking |
| Database tables for core flow | 3 | 2 | Schema |
| API calls per widget creation | 3 | 1 | Request logging |

---

## Timeline Summary

| Phase | Duration | Key Deliverables | Risk Level |
|-------|----------|------------------|------------|
| **Phase 1:** Schema | 2 weeks | New columns, data migration, parallel routes | Low |
| **Phase 2:** Frontend | 2 weeks | New dashboard, embed modal, subscription UI | Medium |
| **Phase 3:** API | 2 weeks | New endpoints, deprecation, redirects | Medium |
| **Phase 4:** Cleanup | 2 weeks | Remove old code, documentation, email users | Low |

**Total:** 8 weeks for full migration

---

## Appendix A: Widget Key Format

- **Length:** 16 characters
- **Character Set:** Base62 (A-Z, a-z, 0-9)
- **Examples:** `aB3cD4eF5gH6iJ7k`, `Xy9Zw8Vu7Ts6Rq5P`
- **Uniqueness:** Database unique constraint
- **Generation:** Cryptographically random

**Benefits over license key (32-char hex):**
- Shorter (easier to share, fits in URLs)
- More readable (mixed case, no special chars)
- Independent from billing

---

## Appendix B: Backward Compatibility Routes

```typescript
// middleware.ts - Add redirects

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old widget bundle URL
  // /api/widget/:license/chat-widget.js → /w/:widgetKey.js
  const oldBundleMatch = pathname.match(/^\/api\/widget\/([a-f0-9]{32})\/chat-widget\.js$/);
  if (oldBundleMatch) {
    const licenseKey = oldBundleMatch[1];
    // Look up widgetKey from licenseKey (cached)
    const widgetKey = await getWidgetKeyFromLicense(licenseKey);
    if (widgetKey) {
      return NextResponse.redirect(new URL(`/w/${widgetKey}.js`, request.url), 301);
    }
  }

  // Redirect old portal URL
  // /chat/portal/:widgetId → /chat/:widgetKey
  const oldPortalMatch = pathname.match(/^\/chat\/portal\/([a-f0-9-]{36})$/);
  if (oldPortalMatch) {
    const widgetId = oldPortalMatch[1];
    const widgetKey = await getWidgetKeyFromId(widgetId);
    if (widgetKey) {
      return NextResponse.redirect(new URL(`/chat/${widgetKey}`, request.url), 301);
    }
  }

  return NextResponse.next();
}
```

---

## Appendix C: Domain Validation with Wildcards

```typescript
// lib/domain/validate.ts

export function normalizeDomain(input: string): string {
  let domain = input.toLowerCase().trim();

  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');

  // Remove www. prefix
  domain = domain.replace(/^www\./, '');

  // Remove port
  domain = domain.replace(/:\d+$/, '');

  // Remove path
  domain = domain.split('/')[0];

  return domain;
}

export function matchDomainPattern(domain: string, pattern: string): boolean {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedPattern = normalizeDomain(pattern);

  // Wildcard pattern: *.example.com
  if (normalizedPattern.startsWith('*.')) {
    const suffix = normalizedPattern.slice(2);
    // Match exact domain or any subdomain
    return normalizedDomain === suffix || normalizedDomain.endsWith('.' + suffix);
  }

  // Exact match
  return normalizedDomain === normalizedPattern;
}

export function validateDomainWhitelist(origin: string | null, allowedDomains: string[]): boolean {
  // No origin header = server-side request, allow
  if (!origin) return true;

  // No whitelist = allow all domains
  if (!allowedDomains || allowedDomains.length === 0) return true;

  try {
    const hostname = new URL(origin).hostname;
    return allowedDomains.some(pattern => matchDomainPattern(hostname, pattern));
  } catch {
    return false;
  }
}

// Examples:
// matchDomainPattern('app.example.com', '*.example.com') → true
// matchDomainPattern('example.com', '*.example.com') → true
// matchDomainPattern('other.com', '*.example.com') → false
// matchDomainPattern('example.com', 'example.com') → true
```

---

**End of Plan**

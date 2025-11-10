# Phase 3 Module 1: Visual Diagrams and Architecture

**Date:** November 9, 2025
**Related:** PHASE_3_MODULE_1_DESIGN.md

---

## Table of Contents

1. [Database Schema Diagram](#database-schema-diagram)
2. [Data Flow Diagrams](#data-flow-diagrams)
3. [Validation Flow](#validation-flow)
4. [Tier Restriction Matrix](#tier-restriction-matrix)
5. [Module Dependencies](#module-dependencies)

---

## Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS TABLE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                           │
│ email: varchar(255) UNIQUE                                              │
│ passwordHash: varchar(255)                                              │
│ name: varchar(100)                                                      │
│ emailVerified: boolean                                                  │
│ createdAt: timestamp                                                    │
│ updatedAt: timestamp                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            LICENSES TABLE                                │
├─────────────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                           │
│ userId: uuid (FK → users.id) CASCADE DELETE                             │
│ licenseKey: varchar(32) UNIQUE                                          │
│ tier: varchar(20) ('basic' | 'pro' | 'agency')                         │
│ domains: text[] (array of authorized domains)                           │
│ domainLimit: integer (1 for basic/pro, -1 for agency)                  │
│ widgetLimit: integer (1 for basic, 3 for pro, -1 for agency) ← NEW     │
│ brandingEnabled: boolean (true for basic, false for pro/agency)        │
│ status: varchar(20) ('active' | 'expired' | 'cancelled')               │
│ stripeSubscriptionId: varchar(255)                                      │
│ stripeCustomerId: varchar(255)                                          │
│ expiresAt: timestamp                                                    │
│ createdAt: timestamp                                                    │
│ updatedAt: timestamp                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N (NEW RELATIONSHIP)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            WIDGETS TABLE (NEW)                           │
├─────────────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                           │
│ licenseId: uuid (FK → licenses.id) CASCADE DELETE                       │
│ name: varchar(100) (e.g., "Homepage Chat", "Support Widget")           │
│ status: varchar(20) ('active' | 'paused' | 'deleted')                  │
│ config: jsonb (complete widget configuration)                           │
│   ├─ branding: { companyName, welcomeText, logo, ... }                 │
│   ├─ theme: { mode, colors, position, size, typography, ... }          │
│   ├─ advancedStyling: { enabled, messages, markdown, ... }             │
│   ├─ behavior: { autoOpen, persistMessages, ... }                      │
│   ├─ connection: { webhookUrl, route, timeout, ... }                   │
│   └─ features: { attachments, emailTranscript, ... }                   │
│ version: integer (increment on config updates)                          │
│ deployedAt: timestamp (last deployment time)                            │
│ createdAt: timestamp                                                    │
│ updatedAt: timestamp                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ INDEXES:                                                                │
│ - widgets_license_id_idx (licenseId)                                   │
│ - widgets_status_idx (status)                                          │
│ - widgets_config_idx GIN (config) -- for JSONB queries                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      WIDGET_CONFIGS TABLE (DEPRECATED)                   │
├─────────────────────────────────────────────────────────────────────────┤
│ ⚠️  TO BE MIGRATED TO WIDGETS TABLE IN PHASE 3                          │
│ ⚠️  KEPT FOR ROLLBACK SAFETY, DROPPED IN PHASE 4                        │
│                                                                         │
│ id: uuid (PK)                                                           │
│ licenseId: uuid (FK → licenses.id) CASCADE DELETE                       │
│ config: jsonb                                                           │
│ version: integer                                                        │
│ createdAt: timestamp                                                    │
│ updatedAt: timestamp                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Widget Creation Flow

```
┌──────────────┐
│   Frontend   │
│  Dashboard   │
└──────┬───────┘
       │ POST /api/widgets
       │ { licenseId, name, config }
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Route: POST /api/widgets                  │
├─────────────────────────────────────────────────────────────────┤
│ 1. requireAuth(request) → get userId                            │
│ 2. getLicenseById(licenseId)                                    │
│ 3. Verify license.userId === userId (authorization)             │
│ 4. Check widget count: getWidgetCount(licenseId)                │
│    - If count >= widgetLimit → 403 "Widget limit reached"      │
│ 5. Validate config with tier-aware schema:                      │
│    - createWidgetConfigSchema(license.tier, license.branding)  │
│    - If invalid → 400 with Zod errors                          │
│ 6. createWidget({ licenseId, name, config, status: 'active' }) │
│ 7. Return 201 { widget }                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
                     ┌─────────────────────┐
                     │  Database Insert    │
                     │  widgets table      │
                     │  + version=1        │
                     └─────────────────────┘
```

### 2. Widget Configuration Update Flow

```
┌──────────────┐
│  Frontend    │
│ Configurator │
└──────┬───────┘
       │ PUT /api/widgets/:id
       │ { config: { ... } }
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API Route: PUT /api/widgets/:id                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. requireAuth(request) → get userId                            │
│ 2. getWidgetById(id)                                            │
│ 3. getLicenseById(widget.licenseId)                             │
│ 4. Verify license.userId === userId (authorization)             │
│ 5. Validate new config:                                         │
│    - createWidgetConfigSchema(license.tier, license.branding)  │
│    - If invalid → 400 with Zod errors                          │
│ 6. updateWidget(id, { config, version: version + 1 })          │
│ 7. Return 200 { widget }                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
                     ┌─────────────────────┐
                     │  Database Update    │
                     │  config + version++ │
                     │  updatedAt = NOW()  │
                     └─────────────────────┘
```

### 3. Widget Serving Flow (Phase 3 Module 3)

```
┌──────────────┐
│   Browser    │
│ (End User)   │
└──────┬───────┘
       │ GET /api/widget/{licenseKey}/chat-widget.js
       │ Referer: https://example.com
       ▼
┌─────────────────────────────────────────────────────────────────┐
│          API Route: GET /api/widget/:license/chat-widget.js      │
├─────────────────────────────────────────────────────────────────┤
│ 1. Extract referer domain from headers                          │
│ 2. validateLicense(licenseKey, domain)                          │
│    - If invalid → return error as JS comment                   │
│ 3. getWidgetsByLicenseId(license.id)                            │
│    - Get active widgets (status='active')                       │
│ 4. Select widget (default: first active widget)                 │
│ 5. Inject license flags into widget JS:                         │
│    - window.__WIDGET_CONFIG__ = widget.config                   │
│    - window.__LICENSE_TIER__ = license.tier                     │
│    - window.__BRANDING_ENABLED__ = license.brandingEnabled     │
│ 6. Return widget JS with injected config                        │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
                     ┌─────────────────────┐
                     │  Widget Loads       │
                     │  + Config Applied   │
                     │  + Tier Enforcement │
                     └─────────────────────┘
```

---

## Validation Flow

### Tier-Aware Configuration Validation

```
┌────────────────────────────────────────────────────────────────────┐
│                      VALIDATION PIPELINE                            │
└────────────────────────────────────────────────────────────────────┘

Input: { config, tier, brandingRequired }
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Base Schema Validation (widgetConfigBaseSchema)         │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Hex colors (#RRGGBB format)                                  │
│ ✓ HTTPS URLs (webhook, logo, etc.)                             │
│ ✓ String lengths (companyName ≤100, welcomeText ≤200)          │
│ ✓ Number ranges (fontSize 12-20, timeout 10-60)                │
│ ✓ Required fields (companyName, webhookUrl, etc.)              │
└──────────────────────┬──────────────────────────────────────────┘
                       │ If invalid → return Zod errors
                       ▼ If valid → continue
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Tier-Specific Restrictions (.superRefine)               │
├─────────────────────────────────────────────────────────────────┤
│ IF tier === 'basic':                                            │
│   ✗ brandingEnabled must be true (if brandingRequired)         │
│   ✗ advancedStyling.enabled must be false                       │
│   ✗ features.emailTranscript must be false                      │
│   ✗ features.ratingPrompt must be false                         │
│                                                                  │
│ IF tier === 'pro':                                              │
│   ✓ All features allowed                                        │
│   ✓ brandingEnabled can be false                                │
│   ✓ advancedStyling allowed                                     │
│                                                                  │
│ IF tier === 'agency':                                           │
│   ✓ All features allowed                                        │
│   ✓ White-label (brandingEnabled can be false)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ If violations → add Zod issues
                       ▼ If valid → continue
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Conditional Field Validation                            │
├─────────────────────────────────────────────────────────────────┤
│ IF launcherIcon === 'custom':                                   │
│   ✗ customLauncherIconUrl must be set                           │
│                                                                  │
│ IF advancedStyling.messages.showAvatar === true:                │
│   ✗ advancedStyling.messages.avatarUrl must be set              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VALIDATION RESULT                            │
├─────────────────────────────────────────────────────────────────┤
│ SUCCESS: { success: true, data: WidgetConfig }                  │
│    OR                                                            │
│ FAILURE: { success: false, errors: ZodError }                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tier Restriction Matrix

### Feature Availability by Tier

```
╔════════════════════════════╦════════════╦════════════╦═══════════════╗
║ Feature                    ║   Basic    ║    Pro     ║    Agency     ║
╠════════════════════════════╬════════════╬════════════╬═══════════════╣
║ WIDGET LIMITS              ║            ║            ║               ║
║ - Max Widgets              ║      1     ║      3     ║   Unlimited   ║
║ - Max Domains              ║      1     ║      1     ║   Unlimited   ║
╠════════════════════════════╬════════════╬════════════╬═══════════════╣
║ BRANDING                   ║            ║            ║               ║
║ - "Powered by" Footer      ║  Required  ║  Optional  ║   Optional    ║
║ - Custom Logo              ║     ✓      ║      ✓     ║       ✓       ║
║ - Company Name             ║     ✓      ║      ✓     ║       ✓       ║
║ - Custom Launcher Icon     ║     ✗      ║      ✓     ║       ✓       ║
╠════════════════════════════╬════════════╬════════════╬═══════════════╣
║ THEME & STYLING            ║            ║            ║               ║
║ - Color Customization      ║  Basic     ║    Full    ║     Full      ║
║ - Position Selection       ║     ✓      ║      ✓     ║       ✓       ║
║ - Size Options             ║     ✓      ║      ✓     ║       ✓       ║
║ - Typography (Fonts)       ║  Limited   ║    Full    ║     Full      ║
║ - Dark Mode Override       ║     ✗      ║      ✓     ║       ✓       ║
║ - Advanced Styling         ║     ✗      ║      ✓     ║       ✓       ║
║   - Message Styling        ║     ✗      ║      ✓     ║       ✓       ║
║   - Markdown Styling       ║     ✗      ║      ✓     ║       ✓       ║
║   - Custom Avatar          ║     ✗      ║      ✓     ║       ✓       ║
╠════════════════════════════╬════════════╬════════════╬═══════════════╣
║ BEHAVIOR                   ║            ║            ║               ║
║ - Auto-Open                ║     ✓      ║      ✓     ║       ✓       ║
║ - Persist Messages         ║     ✓      ║      ✓     ║       ✓       ║
║ - Sound Notifications      ║     ✓      ║      ✓     ║       ✓       ║
║ - Typing Indicator         ║     ✓      ║      ✓     ║       ✓       ║
╠════════════════════════════╬════════════╬════════════╬═══════════════╣
║ FEATURES                   ║            ║            ║               ║
║ - File Attachments         ║  Basic     ║  Advanced  ║   Advanced    ║
║   - Max File Size          ║   10 MB    ║    50 MB   ║     50 MB     ║
║   - Allowed Extensions     ║  Limited   ║    Full    ║     Full      ║
║ - Email Transcript         ║     ✗      ║      ✓     ║       ✓       ║
║ - Print Transcript         ║     ✓      ║      ✓     ║       ✓       ║
║ - Rating Prompt            ║     ✗      ║      ✓     ║       ✓       ║
╠════════════════════════════╬════════════╬════════════╬═══════════════╣
║ PRICING                    ║  $29/year  ║  $49/year  ║  $149/year    ║
╚════════════════════════════╩════════════╩════════════╩═══════════════╝

Legend:
  ✓ = Enabled
  ✗ = Disabled
  Required = Must be enabled (cannot disable)
  Optional = User can choose to enable or disable
  Basic = Limited options
  Full = All options available
  Advanced = Premium features
```

---

## Module Dependencies

### Phase 3 Module 1 Internal Dependencies

```
┌──────────────────────────────────────────────────────────────────┐
│                   lib/db/schema.ts (UPDATE)                      │
│                   - Add widgets table                            │
│                   - Update licenses relations                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Imported by
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                   lib/db/queries.ts (UPDATE)                     │
│                   - Add widget CRUD functions                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Used by
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                  lib/types/widget-config.ts (NEW)                │
│                  - TypeScript type definitions                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Imported by
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                lib/validation/widget-schema.ts (NEW)             │
│                - Zod validation schemas                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Used by
                         ├────────────────┬────────────────────────┐
                         ▼                ▼                        ▼
          ┌─────────────────────┐  ┌────────────────┐  ┌──────────────────┐
          │ lib/widget/         │  │ lib/widget/    │  │ API Routes       │
          │ defaults.ts (NEW)   │  │ validation.ts  │  │ (Phase 3 Mod 2)  │
          │ - Default configs   │  │ - Helpers      │  │                  │
          └─────────────────────┘  └────────────────┘  └──────────────────┘
```

### External Dependencies (From Previous Phases)

```
Phase 1 (Authentication):
  lib/auth/middleware.ts → requireAuth()
  lib/db/schema.ts → users, licenses tables

Phase 2 (License Management):
  lib/db/queries.ts → getLicenseById(), getLicenseByKey()
  lib/license/validate.ts → validateLicense()
  lib/api/schemas.ts → updateLicenseSchema

Phase 3 Module 1 (This Module):
  lib/db/schema.ts → widgets table
  lib/validation/widget-schema.ts → all validation schemas
  lib/widget/defaults.ts → generateDefaultConfig()
```

### Dependencies for Future Modules

```
Phase 3 Module 2 (Widget CRUD API):
  → Depends on: Module 1 (widget schema, validation)
  → Uses: createWidgetConfigSchema(), generateDefaultConfig()

Phase 3 Module 3 (Widget Serving):
  → Depends on: Module 1 (widget schema), Module 2 (widget queries)
  → Uses: getWidgetsByLicenseId(), validateLicense()

Phase 3 Module 4 (Frontend Integration):
  → Depends on: Module 1 (types), Module 2 (API), Module 3 (serving)
  → Uses: All widget types, validation schemas for client-side
```

---

## Configuration Structure Tree

```
WidgetConfig
│
├─ branding
│  ├─ companyName: string
│  ├─ welcomeText: string
│  ├─ logoUrl: string | null
│  ├─ responseTimeText: string
│  ├─ firstMessage: string
│  ├─ inputPlaceholder: string
│  ├─ launcherIcon: 'chat' | 'support' | 'bot' | 'custom'
│  ├─ customLauncherIconUrl: string | null
│  └─ brandingEnabled: boolean ◄── TIER RESTRICTED (Basic: true)
│
├─ theme
│  ├─ mode: 'light' | 'dark' | 'auto'
│  ├─ colors
│  │  ├─ primary: string (#hex)
│  │  ├─ secondary: string (#hex)
│  │  ├─ background: string (#hex)
│  │  ├─ userMessage: string (#hex)
│  │  ├─ botMessage: string (#hex)
│  │  ├─ text: string (#hex)
│  │  ├─ textSecondary: string (#hex)
│  │  ├─ border: string (#hex)
│  │  ├─ inputBackground: string (#hex)
│  │  └─ inputText: string (#hex)
│  ├─ darkOverride
│  │  ├─ enabled: boolean ◄── TIER RESTRICTED (Basic: false)
│  │  └─ colors: Partial<ThemeColors>
│  ├─ position
│  │  ├─ position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
│  │  ├─ offsetX: number (0-500px)
│  │  └─ offsetY: number (0-500px)
│  ├─ size
│  │  ├─ mode: 'compact' | 'standard' | 'expanded'
│  │  ├─ customWidth: number | null
│  │  ├─ customHeight: number | null
│  │  └─ fullscreenOnMobile: boolean
│  ├─ typography
│  │  ├─ fontFamily: string
│  │  ├─ fontSize: number (12-20px)
│  │  ├─ fontUrl: string | null
│  │  └─ disableDefaultFont: boolean
│  └─ cornerRadius: number (0-20px)
│
├─ advancedStyling ◄── TIER RESTRICTED (Pro/Agency only)
│  ├─ enabled: boolean ◄── TIER CHECK (Basic: must be false)
│  ├─ messages
│  │  ├─ userMessageBackground: string (#hex)
│  │  ├─ userMessageText: string (#hex)
│  │  ├─ botMessageBackground: string (#hex)
│  │  ├─ botMessageText: string (#hex)
│  │  ├─ messageSpacing: number (0-50px)
│  │  ├─ bubblePadding: number (5-30px)
│  │  ├─ showAvatar: boolean
│  │  └─ avatarUrl: string | null
│  └─ markdown
│     ├─ codeBlockBackground: string (#hex)
│     ├─ codeBlockText: string (#hex)
│     ├─ codeBlockBorder: string (#hex)
│     ├─ inlineCodeBackground: string (#hex)
│     ├─ inlineCodeText: string (#hex)
│     ├─ linkColor: string (#hex)
│     ├─ linkHoverColor: string (#hex)
│     ├─ tableHeaderBackground: string (#hex)
│     └─ tableBorderColor: string (#hex)
│
├─ behavior
│  ├─ autoOpen: boolean
│  ├─ autoOpenDelay: number (0-60s)
│  ├─ showCloseButton: boolean
│  ├─ persistMessages: boolean
│  ├─ enableSoundNotifications: boolean
│  └─ enableTypingIndicator: boolean
│
├─ connection
│  ├─ webhookUrl: string (HTTPS required)
│  ├─ route: string | null
│  └─ timeoutSeconds: number (10-60s)
│
└─ features
   ├─ attachments
   │  ├─ enabled: boolean
   │  ├─ allowedExtensions: string[] (max 20)
   │  └─ maxFileSizeMB: number (1-50)
   ├─ emailTranscript: boolean ◄── TIER RESTRICTED (Pro/Agency only)
   ├─ printTranscript: boolean
   └─ ratingPrompt: boolean ◄── TIER RESTRICTED (Pro/Agency only)
```

---

## Migration Strategy

### Phase 3.1: Add widgets table (Parallel with widget_configs)

```
┌─────────────────────────┐      ┌─────────────────────────┐
│   widget_configs        │      │   widgets (NEW)         │
│   (Existing)            │      │                         │
├─────────────────────────┤      ├─────────────────────────┤
│ id                      │      │ id                      │
│ licenseId (FK)          │      │ licenseId (FK)          │
│ config (JSONB)          │      │ name (NEW)              │
│ version                 │      │ status (NEW)            │
│ createdAt               │      │ config (JSONB)          │
│ updatedAt               │      │ version                 │
└─────────────────────────┘      │ deployedAt (NEW)        │
                                 │ createdAt               │
        ▲                        │ updatedAt               │
        │                        └─────────────────────────┘
        │                                  ▲
        │                                  │
        └──────────────────────────────────┘
           Both tables exist in Phase 3
           (for rollback safety)
```

### Phase 3.2: Migrate data

```
FOR EACH row IN widget_configs:
  1. Read config from widget_configs
  2. Create widget in widgets table:
     - licenseId: same as widget_configs.licenseId
     - name: "Default Widget" (or derive from config)
     - status: "active"
     - config: same JSONB from widget_configs
     - version: same as widget_configs.version
     - deployedAt: null
  3. Mark as migrated (flag in widget_configs)

ROLLBACK PLAN:
  - If migration fails, widgets table is dropped
  - widget_configs table remains intact
  - No data loss
```

### Phase 4: Deprecate widget_configs table

```
1. Update all code to use widgets table
2. Verify no references to widget_configs
3. Drop widget_configs table
4. Celebrate! 🎉
```

---

**Document Version:** 1.0
**Last Updated:** November 9, 2025
**Author:** Claude (Architect/Planner Subagent)

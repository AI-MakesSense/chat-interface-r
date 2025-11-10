# Phase 3 Module 1: Widget Schema Definition - Design Document

**Date:** November 9, 2025
**Phase:** Phase 3 - Widget Engine
**Module:** Module 1 - Widget Schema Definition
**Status:** Design Complete, Ready for Implementation
**Designer:** Claude (Architect/Planner)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context & Requirements](#context--requirements)
3. [Architectural Decisions](#architectural-decisions)
4. [Database Schema Design](#database-schema-design)
5. [TypeScript Type Definitions](#typescript-type-definitions)
6. [Zod Validation Schemas](#zod-validation-schemas)
7. [Tier-Based Feature Restrictions](#tier-based-feature-restrictions)
8. [Module Breakdown](#module-breakdown)
9. [Test Strategy](#test-strategy)
10. [Implementation Order (TDD)](#implementation-order-tdd)
11. [Risk Assessment](#risk-assessment)
12. [Appendix: Configuration Examples](#appendix-configuration-examples)

---

## Executive Summary

This document defines the complete architecture for Phase 3 Module 1: Widget Schema Definition. The module provides the foundation for storing, validating, and managing widget configurations for the N8n Widget Designer Platform.

### Key Decisions

1. **Database Strategy:** Hybrid approach - dedicated `widgets` table with JSONB config field (deprecate `widget_configs` table)
2. **Relationship Model:** One-to-many (License → Widgets), supporting multiple widgets per license based on tier
3. **Validation Strategy:** Tier-aware Zod schemas with runtime enforcement of feature limits
4. **Default Configurations:** Smart defaults based on tier, with progressive disclosure of advanced features

### What This Module Delivers

- Complete database schema for widget storage
- TypeScript types for full type safety
- Zod validation schemas with tier enforcement
- Default configuration generators
- Test coverage plan (unit + integration)
- Foundation for Phase 3 Modules 2-4 (Widget CRUD API, Widget Serving, Frontend Integration)

---

## Context & Requirements

### Project Context

**Technology Stack:**
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Drizzle ORM with Neon Postgres
- Zod for validation
- Vitest for testing

**Completed Work:**
- Phase 1: Authentication system (169 tests)
- Phase 2: License management (205 tests)
  - License CRUD operations
  - Domain authorization
  - Tier definitions: Basic, Pro, Agency

**Existing Database Tables:**
- `users` (id, email, passwordHash, createdAt, updatedAt)
- `licenses` (id, userId, licenseKey, tier, domains[], domainLimit, brandingEnabled, status, expiresAt)
- `widget_configs` (id, licenseId, config, version) - **WILL BE DEPRECATED**

### Requirements

#### Functional Requirements

1. **Widget Configuration Storage**
   - Store complete widget configuration (theme, position, behavior, n8n connection)
   - Support multiple widgets per license (tier-dependent)
   - Version tracking for configuration changes
   - Default configurations for new widgets

2. **Tier-Based Restrictions**
   - Basic: 1 widget, limited customization, branding required
   - Pro: 3 widgets, full customization, no branding
   - Agency: unlimited widgets, white-label, advanced features

3. **Validation Requirements**
   - Validate configurations against tier limits
   - Enforce branding requirements for Basic tier
   - Validate n8n webhook URL format
   - Validate color formats (hex codes)
   - Validate domain names (for multi-widget scenarios)

#### Non-Functional Requirements

1. **Type Safety:** Full TypeScript coverage, no `any` types
2. **Performance:** Configuration retrieval <50ms, validation <10ms
3. **Extensibility:** Easy to add new configuration options
4. **Backward Compatibility:** Migration path from `widget_configs` to `widgets`
5. **Testability:** All validation logic unit-testable

---

## Architectural Decisions

### Decision 1: Hybrid Database Schema (widgets table + JSONB config)

**Problem:** Should we store widget configurations in normalized tables or flexible JSONB?

**Decision:** Create a new `widgets` table with core fields (id, licenseId, name, status) and a JSONB `config` field for flexible configuration storage.

**Rationale:**

1. **Flexibility:** JSONB allows adding new configuration options without schema migrations
2. **Performance:** Indexed columns (id, licenseId, status) for fast queries; JSONB for flexibility
3. **Type Safety:** Zod validation ensures JSONB structure despite flexible storage
4. **Query Efficiency:** Core fields (name, status, tier) as columns for filtering
5. **Future-Proof:** Easy to add new config fields without database changes

**Alternatives Considered:**

- **Fully Normalized** (widget_configs, theme_configs, position_configs tables)
  - **Rejected:** Over-engineering, requires many JOINs, complex updates, no real benefit for our use case

- **Pure JSONB** (everything in config field)
  - **Rejected:** Can't efficiently query by widget name or status, poor indexing

- **Keep widget_configs table**
  - **Rejected:** One-to-one relationship (license → config) doesn't support multiple widgets per license

**Consequences:**

- Need migration script to move data from `widget_configs` to `widgets`
- JSONB queries require GIN index for performance
- Must validate JSONB structure with Zod on read/write
- Schema evolution handled at application layer (not database)

**Status:** ✅ Accepted

---

### Decision 2: One-to-Many Relationship (License → Widgets)

**Problem:** Should we support one widget per license or multiple widgets per license?

**Decision:** Support multiple widgets per license, with tier-based limits:
- Basic: 1 widget
- Pro: 3 widgets
- Agency: unlimited widgets (-1)

**Rationale:**

1. **Business Logic:** Pro and Agency tiers should offer more value (multiple widgets)
2. **User Experience:** Users may want different widgets for different pages/purposes
3. **Scalability:** Agency tier can manage many client websites (each needs a widget)
4. **Upsell Opportunity:** Basic → Pro upgrade motivated by widget limit
5. **Database Design:** Foreign key `widgets.licenseId → licenses.id` naturally supports 1:N

**Alternatives Considered:**

- **One Widget Per License**
  - **Rejected:** Limits Pro/Agency value proposition, requires multiple licenses for multi-page sites

- **Unlimited Widgets for All Tiers**
  - **Rejected:** No differentiation between tiers, eliminates upsell motivation

**Consequences:**

- Need `widgetLimit` field on licenses table (or derive from tier)
- Widget creation API must check count against limit
- Dashboard UI must show "2/3 widgets used" progress
- Deletion of widgets decrements count

**Status:** ✅ Accepted

---

### Decision 3: Tier-Aware Validation with Zod Refinements

**Problem:** How do we enforce tier-based configuration restrictions?

**Decision:** Use Zod schemas with `.refine()` methods that accept `tier` context parameter and conditionally validate based on tier.

**Rationale:**

1. **Centralized Validation:** All tier logic in one place (validation schemas)
2. **Type Safety:** Zod infers TypeScript types automatically
3. **Reusability:** Same schemas used in API routes and frontend forms
4. **Error Messages:** Zod provides clear error messages ("Branding required for Basic tier")
5. **Testability:** Easy to test tier validation in isolation

**Alternatives Considered:**

- **Database Constraints**
  - **Rejected:** Can't express complex tier logic in SQL CHECK constraints

- **Separate Schemas Per Tier** (basicWidgetSchema, proWidgetSchema, agencyWidgetSchema)
  - **Rejected:** Code duplication, harder to maintain, complex to switch between

- **Runtime Checks in API Routes**
  - **Rejected:** Scattered validation logic, not reusable, harder to test

**Consequences:**

- Every widget create/update must pass tier to validation
- Validation functions signature: `validateWidgetConfig(config, tier, licenseInfo)`
- Need separate validation for "create" vs "update" (update may skip tier checks if tier unchanged)
- Frontend can use same schemas for client-side validation

**Status:** ✅ Accepted

---

### Decision 4: Smart Defaults Based on Tier

**Problem:** What should new widgets look like when created?

**Decision:** Generate tier-specific default configurations:
- Basic: Minimal config with branding enabled, default theme
- Pro: Rich config with branding disabled, premium themes available
- Agency: Full-featured config with white-label, advanced options

**Rationale:**

1. **User Experience:** Users get sensible starting point, not blank slate
2. **Discoverability:** Defaults showcase available features per tier
3. **Tier Differentiation:** Basic users see branding, Pro users don't (immediately visible value)
4. **Onboarding:** New users can deploy widget immediately without configuration
5. **Testing:** Default configs used in tests for consistency

**Alternatives Considered:**

- **Blank Configuration**
  - **Rejected:** Poor UX, requires all fields filled before deployment

- **Single Default for All Tiers**
  - **Rejected:** Doesn't showcase tier benefits

**Consequences:**

- Need `generateDefaultConfig(tier)` function
- Defaults must be kept in sync with validation schemas
- May need to update defaults when adding new features
- Migration: existing configs without new fields get defaults merged

**Status:** ✅ Accepted

---

## Database Schema Design

### New Table: `widgets`

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Widgets Table
 *
 * Purpose: Stores widget instances with their configurations.
 *
 * Relationships:
 * - Many-to-one with licenses (multiple widgets per license)
 * - Tier-based widget count limits enforced at application layer
 *
 * JSONB Config Structure:
 * - branding: Company name, logo, welcome text
 * - theme: Colors, fonts, position, size
 * - behavior: Auto-open, triggers, welcome message
 * - connection: N8n webhook URL, route
 * - features: File attachments, allowed extensions
 */
export const widgets = pgTable('widgets', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign Keys
  licenseId: uuid('license_id')
    .references(() => licenses.id, { onDelete: 'cascade' })
    .notNull(),

  // Core Fields (indexed for performance)
  name: varchar('name', { length: 100 }).notNull(), // User-friendly name ("Homepage Chat", "Support Widget")
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'paused' | 'deleted'

  // Configuration (JSONB for flexibility)
  config: jsonb('config').notNull(), // Full widget configuration object

  // Metadata
  version: integer('version').default(1).notNull(), // Increment on config updates
  deployedAt: timestamp('deployed_at'), // Last deployment timestamp (null if never deployed)

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  licenseIdIdx: index('widgets_license_id_idx').on(table.licenseId),
  statusIdx: index('widgets_status_idx').on(table.status),
  // GIN index for JSONB queries (if needed for searching config)
  configIdx: index('widgets_config_idx').using('gin', table.config),
}));

// Relations
export const widgetsRelations = relations(widgets, ({ one }) => ({
  license: one(licenses, {
    fields: [widgets.licenseId],
    references: [licenses.id],
  }),
}));

// Update licenses relation to include widgets
export const licensesRelations = relations(licenses, ({ one, many }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  widgets: many(widgets), // NEW: One license → many widgets
  analyticsEvents: many(analyticsEvents),
}));

// Type exports
export type Widget = typeof widgets.$inferSelect;
export type NewWidget = typeof widgets.$inferInsert;
```

### Migration from widget_configs

**Strategy:** Deprecate `widget_configs` table, migrate data to `widgets` table.

**Migration Script (lib/db/migrations/migrate-widget-configs.ts):**

```typescript
/**
 * Migration: widget_configs → widgets
 *
 * Purpose: Migrate from one-to-one (license → config) to one-to-many (license → widgets)
 *
 * Steps:
 * 1. Create widgets table
 * 2. Migrate data: widget_configs → widgets (set name="Default Widget")
 * 3. Deprecate widget_configs table (keep for rollback, drop in Phase 4)
 */
export async function migrateWidgetConfigs() {
  // Implementation in Phase 3 Module 2 (after widgets table created)
}
```

### Updated License Table: Add widgetLimit

**Add to existing `licenses` table:**

```typescript
// In lib/db/schema.ts - update licenses table
export const licenses = pgTable('licenses', {
  // ... existing fields ...

  widgetLimit: integer('widget_limit').notNull(), // 1 for basic/pro, -1 for agency (unlimited)

  // ... rest of fields ...
});
```

**Default Values Based on Tier:**

- Basic: `widgetLimit = 1`
- Pro: `widgetLimit = 3`
- Agency: `widgetLimit = -1` (unlimited)

**Migration:** Backfill existing licenses with widgetLimit based on tier.

---

## TypeScript Type Definitions

### File: lib/types/widget-config.ts

```typescript
/**
 * Widget Configuration Type Definitions
 *
 * Purpose: Provides strongly-typed interfaces for widget configurations.
 *
 * Assumptions:
 * - All color values are 6-digit hex codes (#RRGGBB)
 * - URLs are validated before storage
 * - Tier restrictions enforced at validation layer
 */

// ============================================================================
// Branding Configuration
// ============================================================================

export interface BrandingConfig {
  companyName: string;              // max 100 chars
  welcomeText: string;              // max 200 chars
  logoUrl: string | null;           // HTTPS URL or null
  responseTimeText: string;         // e.g., "Typically replies in minutes"
  firstMessage: string;             // Initial bot message
  inputPlaceholder: string;         // Textarea placeholder
  launcherIcon: 'chat' | 'support' | 'bot' | 'custom'; // Icon type
  customLauncherIconUrl: string | null; // HTTPS URL if launcherIcon='custom'
  brandingEnabled: boolean;         // "Powered by N8n Widget Designer" footer
}

// ============================================================================
// Theme Configuration
// ============================================================================

export type ThemeMode = 'light' | 'dark' | 'auto'; // auto = follows system preference

export interface ThemeColors {
  primary: string;                  // Hex color (buttons, launcher)
  secondary: string;                // Hex color (accents)
  background: string;               // Hex color (chat window background)
  userMessage: string;              // Hex color (user message bubble)
  botMessage: string;               // Hex color (bot message bubble)
  text: string;                     // Hex color (main text)
  textSecondary: string;            // Hex color (secondary text)
  border: string;                   // Hex color (borders)
  inputBackground: string;          // Hex color (input field background)
  inputText: string;                // Hex color (input field text)
}

export interface ThemeDarkOverride {
  enabled: boolean;                 // Whether to use dark theme overrides
  colors: Partial<ThemeColors>;     // Override specific colors for dark mode
}

export type WidgetPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left';

export interface PositionConfig {
  position: WidgetPosition;
  offsetX: number;                  // Pixels from edge (default 20)
  offsetY: number;                  // Pixels from edge (default 20)
}

export type WidgetSize = 'compact' | 'standard' | 'expanded';

export interface SizeConfig {
  mode: WidgetSize;
  customWidth: number | null;       // Pixels (if mode='custom')
  customHeight: number | null;      // Pixels (if mode='custom')
  fullscreenOnMobile: boolean;      // Force fullscreen on mobile
}

export interface TypographyConfig {
  fontFamily: string;               // Font family name
  fontSize: number;                 // Base font size in px (12-20)
  fontUrl: string | null;           // Google Fonts URL or null for system fonts
  disableDefaultFont: boolean;      // Use custom font only
}

export interface ThemeConfig {
  mode: ThemeMode;
  colors: ThemeColors;
  darkOverride: ThemeDarkOverride;
  position: PositionConfig;
  size: SizeConfig;
  typography: TypographyConfig;
  cornerRadius: number;             // Border radius in px (0-20)
}

// ============================================================================
// Advanced Styling (Pro/Agency only)
// ============================================================================

export interface MessageStylingConfig {
  userMessageBackground: string;    // Override theme.colors.userMessage
  userMessageText: string;          // Text color in user messages
  botMessageBackground: string;     // Override theme.colors.botMessage
  botMessageText: string;           // Text color in bot messages
  messageSpacing: number;           // Gap between messages in px
  bubblePadding: number;            // Padding inside message bubbles in px
  showAvatar: boolean;              // Show bot avatar
  avatarUrl: string | null;         // Custom avatar URL
}

export interface MarkdownStylingConfig {
  codeBlockBackground: string;      // Hex color
  codeBlockText: string;            // Hex color
  codeBlockBorder: string;          // Hex color
  inlineCodeBackground: string;     // Hex color
  inlineCodeText: string;           // Hex color
  linkColor: string;                // Hex color
  linkHoverColor: string;           // Hex color
  tableHeaderBackground: string;    // Hex color
  tableBorderColor: string;         // Hex color
}

export interface AdvancedStylingConfig {
  enabled: boolean;                 // Pro/Agency only
  messages: MessageStylingConfig;
  markdown: MarkdownStylingConfig;
}

// ============================================================================
// Behavior Configuration
// ============================================================================

export interface BehaviorConfig {
  autoOpen: boolean;                // Auto-open chat on page load
  autoOpenDelay: number;            // Delay in seconds (if autoOpen=true)
  showCloseButton: boolean;         // Show X button in header
  persistMessages: boolean;         // Save messages in localStorage
  enableSoundNotifications: boolean; // Play sound on new messages
  enableTypingIndicator: boolean;   // Show "..." when bot is typing
}

// ============================================================================
// Connection Configuration
// ============================================================================

export interface ConnectionConfig {
  webhookUrl: string;               // N8n webhook URL (HTTPS required)
  route: string | null;             // Optional route parameter
  timeoutSeconds: number;           // Request timeout (10-60 seconds)
}

// ============================================================================
// Features Configuration
// ============================================================================

export interface FileAttachmentsConfig {
  enabled: boolean;                 // Allow file uploads
  allowedExtensions: string[];      // e.g., ['.pdf', '.png', '.jpg']
  maxFileSizeMB: number;            // Max file size in MB (1-50)
}

export interface FeaturesConfig {
  attachments: FileAttachmentsConfig;
  emailTranscript: boolean;         // Allow users to email transcript (Pro/Agency)
  printTranscript: boolean;         // Allow users to print transcript
  ratingPrompt: boolean;            // Prompt for rating after conversation (Pro/Agency)
}

// ============================================================================
// Complete Widget Configuration
// ============================================================================

export interface WidgetConfig {
  branding: BrandingConfig;
  theme: ThemeConfig;
  advancedStyling: AdvancedStylingConfig;
  behavior: BehaviorConfig;
  connection: ConnectionConfig;
  features: FeaturesConfig;
}

// ============================================================================
// Widget Metadata (from database)
// ============================================================================

export interface WidgetMetadata {
  id: string;                       // UUID
  licenseId: string;                // UUID
  name: string;                     // User-friendly name
  status: 'active' | 'paused' | 'deleted';
  version: number;
  deployedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Complete Widget (metadata + config)
// ============================================================================

export interface WidgetWithConfig extends WidgetMetadata {
  config: WidgetConfig;
}
```

---

## Zod Validation Schemas

### File: lib/validation/widget-schema.ts

```typescript
/**
 * Widget Configuration Validation Schemas
 *
 * Purpose: Provides Zod schemas for validating widget configurations
 * with tier-based restrictions.
 *
 * Assumptions:
 * - Tier information passed as context to validation
 * - URL validation requires HTTPS (except localhost)
 * - Color validation requires 6-digit hex (#RRGGBB)
 */

import { z } from 'zod';

// ============================================================================
// Shared Validators
// ============================================================================

/**
 * Hex color validator (#RRGGBB format)
 */
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');

/**
 * HTTPS URL validator (or localhost for development)
 */
const httpsUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.startsWith('https://') || url.includes('localhost'),
    'Must use HTTPS (or localhost for development)'
  );

/**
 * Optional HTTPS URL (null allowed)
 */
const optionalHttpsUrlSchema = z.union([
  httpsUrlSchema,
  z.null(),
]);

// ============================================================================
// Branding Schema
// ============================================================================

export const brandingSchema = z.object({
  companyName: z
    .string()
    .min(1, 'Company name required')
    .max(100, 'Company name must be 100 characters or less'),

  welcomeText: z
    .string()
    .min(1, 'Welcome text required')
    .max(200, 'Welcome text must be 200 characters or less'),

  logoUrl: optionalHttpsUrlSchema,

  responseTimeText: z
    .string()
    .max(100, 'Response time text must be 100 characters or less'),

  firstMessage: z
    .string()
    .min(1, 'First message required')
    .max(500, 'First message must be 500 characters or less'),

  inputPlaceholder: z
    .string()
    .max(100, 'Input placeholder must be 100 characters or less'),

  launcherIcon: z.enum(['chat', 'support', 'bot', 'custom']),

  customLauncherIconUrl: optionalHttpsUrlSchema,

  brandingEnabled: z.boolean(),
});

// ============================================================================
// Theme Schema
// ============================================================================

const themeColorsSchema = z.object({
  primary: hexColorSchema,
  secondary: hexColorSchema,
  background: hexColorSchema,
  userMessage: hexColorSchema,
  botMessage: hexColorSchema,
  text: hexColorSchema,
  textSecondary: hexColorSchema,
  border: hexColorSchema,
  inputBackground: hexColorSchema,
  inputText: hexColorSchema,
});

const themeDarkOverrideSchema = z.object({
  enabled: z.boolean(),
  colors: themeColorsSchema.partial(), // Partial colors for overrides
});

const positionSchema = z.object({
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
  offsetX: z.number().int().min(0).max(500),
  offsetY: z.number().int().min(0).max(500),
});

const sizeSchema = z.object({
  mode: z.enum(['compact', 'standard', 'expanded']),
  customWidth: z.number().int().min(300).max(1000).nullable(),
  customHeight: z.number().int().min(400).max(1000).nullable(),
  fullscreenOnMobile: z.boolean(),
});

const typographySchema = z.object({
  fontFamily: z.string().max(100),
  fontSize: z.number().int().min(12).max(20),
  fontUrl: optionalHttpsUrlSchema,
  disableDefaultFont: z.boolean(),
});

export const themeSchema = z.object({
  mode: z.enum(['light', 'dark', 'auto']),
  colors: themeColorsSchema,
  darkOverride: themeDarkOverrideSchema,
  position: positionSchema,
  size: sizeSchema,
  typography: typographySchema,
  cornerRadius: z.number().int().min(0).max(20),
});

// ============================================================================
// Advanced Styling Schema (Pro/Agency only)
// ============================================================================

const messageStylingSchema = z.object({
  userMessageBackground: hexColorSchema,
  userMessageText: hexColorSchema,
  botMessageBackground: hexColorSchema,
  botMessageText: hexColorSchema,
  messageSpacing: z.number().int().min(0).max(50),
  bubblePadding: z.number().int().min(5).max(30),
  showAvatar: z.boolean(),
  avatarUrl: optionalHttpsUrlSchema,
});

const markdownStylingSchema = z.object({
  codeBlockBackground: hexColorSchema,
  codeBlockText: hexColorSchema,
  codeBlockBorder: hexColorSchema,
  inlineCodeBackground: hexColorSchema,
  inlineCodeText: hexColorSchema,
  linkColor: hexColorSchema,
  linkHoverColor: hexColorSchema,
  tableHeaderBackground: hexColorSchema,
  tableBorderColor: hexColorSchema,
});

export const advancedStylingSchema = z.object({
  enabled: z.boolean(),
  messages: messageStylingSchema,
  markdown: markdownStylingSchema,
});

// ============================================================================
// Behavior Schema
// ============================================================================

export const behaviorSchema = z.object({
  autoOpen: z.boolean(),
  autoOpenDelay: z.number().int().min(0).max(60),
  showCloseButton: z.boolean(),
  persistMessages: z.boolean(),
  enableSoundNotifications: z.boolean(),
  enableTypingIndicator: z.boolean(),
});

// ============================================================================
// Connection Schema
// ============================================================================

export const connectionSchema = z.object({
  webhookUrl: httpsUrlSchema,
  route: z.string().max(100).nullable(),
  timeoutSeconds: z.number().int().min(10).max(60),
});

// ============================================================================
// Features Schema
// ============================================================================

const fileAttachmentsSchema = z.object({
  enabled: z.boolean(),
  allowedExtensions: z
    .array(z.string().regex(/^\.[a-z0-9]+$/, 'Extensions must start with dot'))
    .max(20, 'Maximum 20 file extensions allowed'),
  maxFileSizeMB: z.number().int().min(1).max(50),
});

export const featuresSchema = z.object({
  attachments: fileAttachmentsSchema,
  emailTranscript: z.boolean(),
  printTranscript: z.boolean(),
  ratingPrompt: z.boolean(),
});

// ============================================================================
// Complete Widget Config Schema (Base - No Tier Restrictions)
// ============================================================================

export const widgetConfigBaseSchema = z.object({
  branding: brandingSchema,
  theme: themeSchema,
  advancedStyling: advancedStylingSchema,
  behavior: behaviorSchema,
  connection: connectionSchema,
  features: featuresSchema,
});

// ============================================================================
// Tier-Aware Validation
// ============================================================================

export type LicenseTier = 'basic' | 'pro' | 'agency';

/**
 * Validate widget config with tier-specific restrictions
 */
export const createWidgetConfigSchema = (tier: LicenseTier, brandingRequired: boolean) => {
  return widgetConfigBaseSchema.superRefine((config, ctx) => {

    // RESTRICTION 1: Branding must be enabled for Basic tier
    if (tier === 'basic' && brandingRequired && !config.branding.brandingEnabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Branding must be enabled for Basic tier',
        path: ['branding', 'brandingEnabled'],
      });
    }

    // RESTRICTION 2: Advanced styling only for Pro/Agency
    if (tier === 'basic' && config.advancedStyling.enabled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Advanced styling is only available for Pro and Agency tiers',
        path: ['advancedStyling', 'enabled'],
      });
    }

    // RESTRICTION 3: Email transcript only for Pro/Agency
    if (tier === 'basic' && config.features.emailTranscript) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email transcript is only available for Pro and Agency tiers',
        path: ['features', 'emailTranscript'],
      });
    }

    // RESTRICTION 4: Rating prompt only for Pro/Agency
    if (tier === 'basic' && config.features.ratingPrompt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rating prompt is only available for Pro and Agency tiers',
        path: ['features', 'ratingPrompt'],
      });
    }

    // RESTRICTION 5: Custom launcher icon requires URL if type is 'custom'
    if (config.branding.launcherIcon === 'custom' && !config.branding.customLauncherIconUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Custom launcher icon URL required when launcher icon type is "custom"',
        path: ['branding', 'customLauncherIconUrl'],
      });
    }

    // RESTRICTION 6: Avatar URL required if showAvatar is true
    if (config.advancedStyling.enabled &&
        config.advancedStyling.messages.showAvatar &&
        !config.advancedStyling.messages.avatarUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Avatar URL required when show avatar is enabled',
        path: ['advancedStyling', 'messages', 'avatarUrl'],
      });
    }
  });
};

// ============================================================================
// Create Widget API Schema
// ============================================================================

export const createWidgetRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Widget name required')
    .max(100, 'Widget name must be 100 characters or less'),

  config: z.record(z.unknown()), // Validated separately with tier-aware schema
});

// ============================================================================
// Update Widget API Schema
// ============================================================================

export const updateWidgetRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Widget name required')
    .max(100, 'Widget name must be 100 characters or less')
    .optional(),

  config: z.record(z.unknown()).optional(), // Validated separately with tier-aware schema

  status: z.enum(['active', 'paused']).optional(), // Cannot update to 'deleted' (use DELETE)
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

// ============================================================================
// Type Exports
// ============================================================================

export type BrandingInput = z.infer<typeof brandingSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
export type AdvancedStylingInput = z.infer<typeof advancedStylingSchema>;
export type BehaviorInput = z.infer<typeof behaviorSchema>;
export type ConnectionInput = z.infer<typeof connectionSchema>;
export type FeaturesInput = z.infer<typeof featuresSchema>;
export type WidgetConfigInput = z.infer<typeof widgetConfigBaseSchema>;
export type CreateWidgetInput = z.infer<typeof createWidgetRequestSchema>;
export type UpdateWidgetInput = z.infer<typeof updateWidgetRequestSchema>;
```

---

## Tier-Based Feature Restrictions

### Feature Matrix

| Feature | Basic Tier | Pro Tier | Agency Tier |
|---------|------------|----------|-------------|
| **Widgets** | 1 widget | 3 widgets | Unlimited |
| **Domains** | 1 domain | 1 domain | Unlimited |
| **Branding ("Powered by")** | Required | Optional | Optional |
| **Advanced Styling** | ❌ No | ✅ Yes | ✅ Yes |
| **Custom Fonts** | ✅ Yes (limited) | ✅ Yes (full) | ✅ Yes (full) |
| **Custom Colors** | ✅ Yes (basic palette) | ✅ Yes (full palette) | ✅ Yes (full palette) |
| **File Attachments** | ✅ Yes (basic) | ✅ Yes (advanced) | ✅ Yes (advanced) |
| **Email Transcript** | ❌ No | ✅ Yes | ✅ Yes |
| **Rating Prompt** | ❌ No | ✅ Yes | ✅ Yes |
| **Custom Launcher Icon** | ❌ No | ✅ Yes | ✅ Yes |
| **Dark Mode Overrides** | ❌ No | ✅ Yes | ✅ Yes |
| **Markdown Styling** | ❌ No | ✅ Yes | ✅ Yes |

### Implementation Strategy

**Tier Enforcement Points:**

1. **Widget Creation:** Check `widgetLimit` before allowing new widget
2. **Config Validation:** Use tier-aware Zod schema
3. **Widget Serving:** Inject tier flags into widget JavaScript
4. **Dashboard UI:** Disable/hide unavailable features with upgrade prompts

**Example: Widget Count Check**

```typescript
// In POST /api/widgets route
const license = await getLicenseById(licenseId);
const existingWidgets = await getWidgetsByLicenseId(licenseId);

// Check widget limit
if (license.widgetLimit !== -1 && existingWidgets.length >= license.widgetLimit) {
  return NextResponse.json(
    { error: `Widget limit reached (${license.widgetLimit} for ${license.tier} tier)` },
    { status: 403 }
  );
}
```

**Example: Branding Enforcement**

```typescript
// In widget serving endpoint
if (license.brandingEnabled && !config.branding.brandingEnabled) {
  // Force branding on for Basic tier
  config.branding.brandingEnabled = true;
}
```

---

## Module Breakdown

### File Structure

```
n8n-widget-designer/
├── lib/
│   ├── db/
│   │   ├── schema.ts                          # ADD: widgets table, update licenses
│   │   ├── queries.ts                         # ADD: widget CRUD queries
│   │   └── migrations/
│   │       └── migrate-widget-configs.ts      # NEW: Migration script
│   │
│   ├── types/
│   │   └── widget-config.ts                   # NEW: TypeScript type definitions
│   │
│   ├── validation/
│   │   └── widget-schema.ts                   # NEW: Zod validation schemas
│   │
│   └── widget/
│       ├── defaults.ts                        # NEW: Default config generators
│       └── validation.ts                      # NEW: Tier-aware validation helpers
│
└── tests/
    ├── unit/
    │   ├── validation/
    │   │   └── widget-schema.test.ts          # NEW: Validation schema tests
    │   └── widget/
    │       ├── defaults.test.ts               # NEW: Default config tests
    │       └── validation.test.ts             # NEW: Tier validation tests
    │
    └── integration/
        └── db/
            └── widgets.test.ts                # NEW: Database query tests
```

### Module Responsibilities

#### 1. lib/db/schema.ts (UPDATE)

**Responsibility:** Add `widgets` table definition, update `licenses` table with `widgetLimit`

**Size:** ~200 lines total (existing + new)

**Exports:**
- `widgets` table
- `widgetsRelations`
- Updated `licensesRelations`
- `Widget`, `NewWidget` types

#### 2. lib/db/queries.ts (UPDATE)

**Responsibility:** Add widget CRUD queries

**Size:** ~150 lines added

**Functions:**
- `getWidgetById(id: string): Promise<Widget | null>`
- `getWidgetsByLicenseId(licenseId: string): Promise<Widget[]>`
- `createWidget(data: NewWidget): Promise<Widget>`
- `updateWidget(id: string, data: Partial<Widget>): Promise<Widget>`
- `deleteWidget(id: string): Promise<void>` (soft delete: status='deleted')
- `getWidgetCount(licenseId: string): Promise<number>`

#### 3. lib/types/widget-config.ts (NEW)

**Responsibility:** TypeScript type definitions for widget configurations

**Size:** ~350 lines

**Exports:**
- All configuration interfaces (Branding, Theme, Features, etc.)
- `WidgetConfig` (complete configuration)
- `WidgetMetadata` (database fields)
- `WidgetWithConfig` (combined)

#### 4. lib/validation/widget-schema.ts (NEW)

**Responsibility:** Zod validation schemas with tier awareness

**Size:** ~400 lines

**Exports:**
- Individual schemas (branding, theme, features, etc.)
- `widgetConfigBaseSchema` (base validation)
- `createWidgetConfigSchema(tier, brandingRequired)` (tier-aware)
- `createWidgetRequestSchema` (API validation)
- `updateWidgetRequestSchema` (API validation)

#### 5. lib/widget/defaults.ts (NEW)

**Responsibility:** Generate default configurations by tier

**Size:** ~250 lines

**Functions:**
- `generateDefaultConfig(tier: LicenseTier, licenseInfo: { brandingEnabled: boolean }): WidgetConfig`
- `getDefaultBranding(tier: LicenseTier, brandingEnabled: boolean): BrandingConfig`
- `getDefaultTheme(tier: LicenseTier): ThemeConfig`
- `getDefaultFeatures(tier: LicenseTier): FeaturesConfig`

#### 6. lib/widget/validation.ts (NEW)

**Responsibility:** Helper functions for tier-aware validation

**Size:** ~150 lines

**Functions:**
- `validateWidgetConfig(config: unknown, tier: LicenseTier, brandingRequired: boolean): ValidationResult`
- `checkWidgetLimit(licenseId: string, tier: LicenseTier, widgetLimit: number): Promise<boolean>`
- `canEnableFeature(feature: string, tier: LicenseTier): boolean`

**Types:**
```typescript
interface ValidationResult {
  success: boolean;
  data?: WidgetConfig;
  errors?: z.ZodError;
}
```

#### 7. lib/db/migrations/migrate-widget-configs.ts (NEW)

**Responsibility:** Migrate data from `widget_configs` to `widgets` table

**Size:** ~100 lines

**Function:**
- `migrateWidgetConfigs(): Promise<{ migrated: number; errors: number }>`

---

## Test Strategy

### Unit Tests (No Database)

#### tests/unit/validation/widget-schema.test.ts (~400 lines)

**Test Suites:**

1. **Hex Color Validation**
   - Valid: `#FF5733`
   - Invalid: `FF5733` (no #), `#FF57` (too short), `#GG5733` (invalid chars)

2. **HTTPS URL Validation**
   - Valid: `https://example.com`, `https://localhost:3000`
   - Invalid: `http://example.com` (not HTTPS), `ftp://example.com`

3. **Branding Schema**
   - Valid inputs (all required fields)
   - Invalid: empty company name, welcome text >200 chars, invalid logo URL

4. **Theme Schema**
   - Valid: all color fields, position, size config
   - Invalid: invalid hex colors, fontSize out of range (11, 21)

5. **Advanced Styling Schema**
   - Valid: enabled with all fields
   - Invalid: showAvatar=true but avatarUrl=null

6. **Connection Schema**
   - Valid: webhookUrl with HTTPS
   - Invalid: HTTP webhook URL, timeout out of range

7. **Features Schema**
   - Valid: attachments enabled with extensions
   - Invalid: maxFileSizeMB > 50, invalid extension format

8. **Tier-Aware Validation** (Most Important)
   - **Basic Tier:**
     - Reject: brandingEnabled=false (branding required)
     - Reject: advancedStyling.enabled=true
     - Reject: emailTranscript=true
     - Accept: valid basic config

   - **Pro Tier:**
     - Accept: brandingEnabled=false (branding optional)
     - Accept: advancedStyling.enabled=true
     - Accept: emailTranscript=true
     - Reject: invalid config (e.g., bad hex color)

   - **Agency Tier:**
     - Accept: all features enabled
     - Accept: white-label (brandingEnabled=false)

#### tests/unit/widget/defaults.test.ts (~200 lines)

**Test Suites:**

1. **Default Config Generation**
   - Basic tier: branding enabled, no advanced features
   - Pro tier: branding disabled, advanced features available
   - Agency tier: all features enabled

2. **Default Branding**
   - Verify companyName defaults
   - Verify brandingEnabled matches tier requirements

3. **Default Theme**
   - Verify default colors are valid hex codes
   - Verify position defaults to 'bottom-right'

4. **Default Features**
   - Basic: emailTranscript=false, ratingPrompt=false
   - Pro: emailTranscript=true, ratingPrompt=true

#### tests/unit/widget/validation.test.ts (~150 lines)

**Test Suites:**

1. **validateWidgetConfig Function**
   - Valid config returns success=true
   - Invalid config returns success=false with errors

2. **canEnableFeature Function**
   - Basic: canEnableFeature('advancedStyling', 'basic') → false
   - Pro: canEnableFeature('advancedStyling', 'pro') → true

3. **checkWidgetLimit Function** (mocked DB)
   - Basic tier with 1 widget: cannot create more
   - Pro tier with 2 widgets: can create 1 more
   - Agency tier: always can create

### Integration Tests (With Database)

#### tests/integration/db/widgets.test.ts (~300 lines)

**Test Suites:**

1. **Widget CRUD Operations**
   - createWidget: insert widget with valid config
   - getWidgetById: retrieve by ID
   - getWidgetsByLicenseId: list widgets for license
   - updateWidget: update name and config
   - deleteWidget: soft delete (status='deleted')

2. **Widget Count Queries**
   - getWidgetCount: count active widgets for license
   - Count excludes deleted widgets

3. **Foreign Key Constraints**
   - Delete license cascades to widgets
   - Cannot create widget with invalid licenseId

4. **JSONB Config Storage**
   - Config stored and retrieved correctly
   - Partial config updates work

5. **Version Tracking**
   - Version increments on update
   - Version starts at 1 for new widgets

### Test Naming Convention

```typescript
describe('widgetConfigBaseSchema', () => {
  describe('branding validation', () => {
    it('should validate complete branding config', () => { ... });
    it('should reject empty company name', () => { ... });
    it('should reject welcome text exceeding 200 characters', () => { ... });
  });
});

describe('createWidgetConfigSchema', () => {
  describe('Basic tier restrictions', () => {
    it('should reject config with brandingEnabled=false when branding required', () => { ... });
    it('should reject config with advancedStyling enabled', () => { ... });
    it('should accept valid basic config with all required fields', () => { ... });
  });

  describe('Pro tier features', () => {
    it('should accept config with brandingEnabled=false', () => { ... });
    it('should accept config with advancedStyling enabled', () => { ... });
    it('should accept config with emailTranscript=true', () => { ... });
  });
});
```

### Coverage Goals

- **Unit Tests:** 100% coverage of validation logic
- **Integration Tests:** 90%+ coverage of database queries
- **Total:** ~1050 lines of test code for ~1400 lines of production code

---

## Implementation Order (TDD)

### Module 1A: Database Schema (Day 1)

**RED → GREEN → REFACTOR**

1. **RED: Write failing test for widgets table**
   - Test: Can create widget with all fields
   - Test: Foreign key constraint enforced (licenseId)
   - Test: Cascade delete when license deleted

2. **GREEN: Implement widgets table schema**
   - Add to `lib/db/schema.ts`
   - Run migration: `pnpm db:generate && pnpm db:push`

3. **RED: Write failing test for widget queries**
   - Test: createWidget inserts row
   - Test: getWidgetById returns widget or null
   - Test: getWidgetsByLicenseId returns array
   - Test: updateWidget modifies row
   - Test: deleteWidget sets status='deleted'

4. **GREEN: Implement widget queries**
   - Add to `lib/db/queries.ts`

5. **REFACTOR:**
   - Extract common query patterns
   - Verify indexes created correctly

**Tests:** tests/integration/db/widgets.test.ts (300 lines)

**Deliverable:** Working widgets table with CRUD operations

---

### Module 1B: TypeScript Types (Day 1-2)

**No Tests Required** (Types are compile-time only)

1. **Implement:** lib/types/widget-config.ts
   - All interfaces (Branding, Theme, Features, etc.)
   - Complete WidgetConfig type
   - Export all types

2. **Validation:**
   - Run `pnpm type-check` (no errors)
   - Import types in other files to verify

**Deliverable:** Type-safe widget configuration interfaces

---

### Module 1C: Validation Schemas (Day 2-3)

**RED → GREEN → REFACTOR**

1. **RED: Write failing tests for base schemas**
   - Test: brandingSchema validates valid input
   - Test: brandingSchema rejects invalid input
   - Test: themeSchema validates colors
   - Test: connectionSchema requires HTTPS

2. **GREEN: Implement base schemas**
   - Add to `lib/validation/widget-schema.ts`
   - Start with brandingSchema, then theme, features, etc.

3. **RED: Write failing tests for tier-aware validation**
   - Test: Basic tier rejects brandingEnabled=false
   - Test: Basic tier rejects advancedStyling
   - Test: Pro tier accepts all features
   - Test: Agency tier accepts all features

4. **GREEN: Implement createWidgetConfigSchema function**
   - Add `.superRefine()` with tier logic
   - Test each tier restriction individually

5. **REFACTOR:**
   - Extract common validators (hex color, HTTPS URL)
   - Optimize error messages

**Tests:** tests/unit/validation/widget-schema.test.ts (400 lines)

**Deliverable:** Tier-aware validation schemas

---

### Module 1D: Default Config Generators (Day 3-4)

**RED → GREEN → REFACTOR**

1. **RED: Write failing tests for default configs**
   - Test: generateDefaultConfig('basic') returns valid config
   - Test: Basic config has brandingEnabled=true
   - Test: Pro config has advancedStyling available
   - Test: All defaults pass validation

2. **GREEN: Implement default generators**
   - Add to `lib/widget/defaults.ts`
   - Start with getDefaultBranding
   - Then getDefaultTheme, getDefaultFeatures
   - Finally generateDefaultConfig

3. **REFACTOR:**
   - Extract color palettes to constants
   - Ensure defaults are DRY (don't repeat default values)

**Tests:** tests/unit/widget/defaults.test.ts (200 lines)

**Deliverable:** Default config generators for all tiers

---

### Module 1E: Validation Helpers (Day 4)

**RED → GREEN → REFACTOR**

1. **RED: Write failing tests for validation helpers**
   - Test: validateWidgetConfig returns success for valid config
   - Test: validateWidgetConfig returns errors for invalid config
   - Test: canEnableFeature returns correct boolean per tier

2. **GREEN: Implement validation helpers**
   - Add to `lib/widget/validation.ts`
   - Use existing Zod schemas

3. **REFACTOR:**
   - Simplify error formatting
   - Add JSDoc comments

**Tests:** tests/unit/widget/validation.test.ts (150 lines)

**Deliverable:** Helper functions for tier-aware validation

---

### Module 1F: Migration Script (Day 5)

**RED → GREEN → REFACTOR**

1. **RED: Write failing test for migration**
   - Test: Migration moves data from widget_configs to widgets
   - Test: Migration sets name="Default Widget"
   - Test: Migration preserves config JSON

2. **GREEN: Implement migration**
   - Add to `lib/db/migrations/migrate-widget-configs.ts`
   - Read from widget_configs, write to widgets
   - Handle errors gracefully

3. **REFACTOR:**
   - Add rollback capability
   - Log progress for large datasets

**Tests:** tests/integration/db/migration.test.ts (100 lines)

**Deliverable:** Migration script ready for production use

---

### Implementation Timeline

| Day | Module | Tests | Production Code | Total LOC |
|-----|--------|-------|-----------------|-----------|
| 1 | 1A: Database Schema | 300 | 200 | 500 |
| 1-2 | 1B: TypeScript Types | 0 | 350 | 350 |
| 2-3 | 1C: Validation Schemas | 400 | 400 | 800 |
| 3-4 | 1D: Default Generators | 200 | 250 | 450 |
| 4 | 1E: Validation Helpers | 150 | 150 | 300 |
| 5 | 1F: Migration Script | 100 | 100 | 200 |
| **Total** | **6 Modules** | **1150** | **1450** | **2600** |

**Estimated Time:** 5 days (1 developer, full-time)

---

## Risk Assessment

### Risk 1: JSONB Performance at Scale

**Probability:** Low
**Impact:** Medium

**Description:** JSONB queries may be slower than normalized columns for large datasets.

**Mitigation:**
- Add GIN index on config column
- Keep frequently-queried fields (name, status) as indexed columns
- Monitor query performance in production
- Can normalize hot fields if needed (backward-compatible)

**Contingency:** If performance issues arise, migrate hot fields to columns.

---

### Risk 2: Schema Evolution Complexity

**Probability:** Medium
**Impact:** Low

**Description:** Adding new config fields requires updating Zod schemas, defaults, and types in multiple places.

**Mitigation:**
- Document schema evolution process in CONTRIBUTING.md
- Create checklist for adding new fields (schema, types, defaults, tests)
- Use TypeScript to catch missing fields (compile errors)
- Automated tests ensure defaults match validation

**Contingency:** Refactor to schema registry if complexity grows.

---

### Risk 3: Tier Restriction Bypass

**Probability:** Low
**Impact:** High

**Description:** Users might manipulate API calls to bypass tier restrictions.

**Mitigation:**
- Validation on server-side only (never trust client)
- Re-validate tier on every config update
- Widget serving re-checks license tier and enforces branding
- Audit logs for tier violations (Phase 5)

**Contingency:** Add rate limiting and fraud detection in Phase 6.

---

### Risk 4: Migration Data Loss

**Probability:** Low
**Impact:** Critical

**Description:** Migration script could fail or corrupt data.

**Mitigation:**
- Test migration script on copy of production data
- Keep widget_configs table until Phase 4 (rollback safety)
- Add migration validation (compare row counts before/after)
- Dry-run mode for migration script

**Contingency:** Rollback to widget_configs if migration fails.

---

### Risk 5: Type Drift Between Zod and TypeScript

**Probability:** Medium
**Impact:** Medium

**Description:** TypeScript types (widget-config.ts) and Zod schemas (widget-schema.ts) could become inconsistent.

**Mitigation:**
- Generate TypeScript types from Zod schemas where possible (`z.infer<typeof schema>`)
- Add integration test that validates default configs against schemas
- Code review checklist: "Do Zod schema and TS type match?"
- Consider using zod-to-ts for automatic type generation (Phase 4)

**Contingency:** Refactor to single source of truth (Zod schemas generate TS types).

---

## Appendix: Configuration Examples

### Basic Tier Default Configuration

```json
{
  "branding": {
    "companyName": "My Company",
    "welcomeText": "Welcome! How can we help you today?",
    "logoUrl": null,
    "responseTimeText": "Typically replies in minutes",
    "firstMessage": "Hi there! I'm here to help. What can I do for you?",
    "inputPlaceholder": "Type your message...",
    "launcherIcon": "chat",
    "customLauncherIconUrl": null,
    "brandingEnabled": true
  },
  "theme": {
    "mode": "light",
    "colors": {
      "primary": "#0066FF",
      "secondary": "#00B8D4",
      "background": "#FFFFFF",
      "userMessage": "#0066FF",
      "botMessage": "#F5F5F5",
      "text": "#000000",
      "textSecondary": "#666666",
      "border": "#E0E0E0",
      "inputBackground": "#FFFFFF",
      "inputText": "#000000"
    },
    "darkOverride": {
      "enabled": false,
      "colors": {}
    },
    "position": {
      "position": "bottom-right",
      "offsetX": 20,
      "offsetY": 20
    },
    "size": {
      "mode": "standard",
      "customWidth": null,
      "customHeight": null,
      "fullscreenOnMobile": true
    },
    "typography": {
      "fontFamily": "system-ui, -apple-system, sans-serif",
      "fontSize": 14,
      "fontUrl": null,
      "disableDefaultFont": false
    },
    "cornerRadius": 12
  },
  "advancedStyling": {
    "enabled": false,
    "messages": {
      "userMessageBackground": "#0066FF",
      "userMessageText": "#FFFFFF",
      "botMessageBackground": "#F5F5F5",
      "botMessageText": "#000000",
      "messageSpacing": 12,
      "bubblePadding": 12,
      "showAvatar": false,
      "avatarUrl": null
    },
    "markdown": {
      "codeBlockBackground": "#F5F5F5",
      "codeBlockText": "#000000",
      "codeBlockBorder": "#E0E0E0",
      "inlineCodeBackground": "#F0F0F0",
      "inlineCodeText": "#E01E5A",
      "linkColor": "#0066FF",
      "linkHoverColor": "#0052CC",
      "tableHeaderBackground": "#F5F5F5",
      "tableBorderColor": "#E0E0E0"
    }
  },
  "behavior": {
    "autoOpen": false,
    "autoOpenDelay": 0,
    "showCloseButton": true,
    "persistMessages": true,
    "enableSoundNotifications": false,
    "enableTypingIndicator": true
  },
  "connection": {
    "webhookUrl": "https://your-n8n-instance.com/webhook/chat",
    "route": null,
    "timeoutSeconds": 30
  },
  "features": {
    "attachments": {
      "enabled": false,
      "allowedExtensions": [".pdf", ".png", ".jpg", ".jpeg"],
      "maxFileSizeMB": 10
    },
    "emailTranscript": false,
    "printTranscript": true,
    "ratingPrompt": false
  }
}
```

### Pro Tier Default Configuration (Differences Only)

```json
{
  "branding": {
    "brandingEnabled": false  // ← CHANGED: No branding for Pro
  },
  "advancedStyling": {
    "enabled": true  // ← CHANGED: Advanced styling available
  },
  "features": {
    "attachments": {
      "enabled": true  // ← CHANGED: Attachments enabled
    },
    "emailTranscript": true,  // ← CHANGED: Email transcript available
    "ratingPrompt": true  // ← CHANGED: Rating prompt available
  }
}
```

### Agency Tier Default Configuration

Same as Pro tier, with:
- Unlimited widgets (enforced at creation, not in config)
- Unlimited domains (enforced at license level)
- White-label options (all Pro features + more)

---

## Summary

This design document provides a complete architecture for Phase 3 Module 1: Widget Schema Definition. Key takeaways:

1. **Hybrid Database Schema:** New `widgets` table with JSONB config for flexibility
2. **One-to-Many Relationship:** Licenses can have multiple widgets (tier-based limits)
3. **Tier-Aware Validation:** Zod schemas enforce tier restrictions at runtime
4. **Smart Defaults:** Tier-specific default configurations for instant deployment
5. **Type Safety:** Full TypeScript coverage with Drizzle ORM and Zod
6. **Testability:** 1150 lines of tests for 1450 lines of production code

**Next Steps:**
- Review and approve design
- Begin TDD implementation (Module 1A: Database Schema)
- Continue to Phase 3 Module 2: Widget CRUD API

**Questions or Feedback:** Contact project architect for clarifications.

---

**Document Version:** 1.0
**Last Updated:** November 9, 2025
**Author:** Claude (Architect/Planner Subagent)

# Phase 3 Module 2: Widget CRUD API - Design Document

**Date:** November 10, 2025
**Phase:** Phase 3 - Widget Engine
**Module:** Module 2 - Widget CRUD API
**Status:** Design Complete, Ready for Implementation
**Designer:** Claude (Architect/Planner)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Context & Requirements](#context--requirements)
3. [Architectural Decisions](#architectural-decisions)
4. [API Endpoint Specifications](#api-endpoint-specifications)
5. [Database Query Functions](#database-query-functions)
6. [Validation Schemas](#validation-schemas)
7. [Helper Functions](#helper-functions)
8. [File Structure](#file-structure)
9. [Error Scenarios](#error-scenarios)
10. [Test Strategy](#test-strategy)
11. [Implementation Order (TDD)](#implementation-order-tdd)
12. [Risk Assessment](#risk-assessment)

---

## Executive Summary

This document defines the complete architecture for Phase 3 Module 2: Widget CRUD API. The module provides RESTful API endpoints for creating, reading, updating, and deleting widgets, with full tier-based authorization and validation.

### Key Decisions

1. **API Design:** RESTful conventions with Next.js 15 App Router
2. **Authorization:** Two-tier verification (user authentication + license ownership)
3. **Validation:** Tier-aware config validation with partial update support
4. **Widget Limits:** Enforce tier-based widget count limits at creation
5. **Soft Delete:** Widgets never physically deleted, status set to 'deleted'
6. **Public Embed:** Separate public endpoint with domain-based license validation

### What This Module Delivers

- 7 API endpoints (5 authenticated, 1 public, 1 deployment)
- 12 database query functions
- 4 validation schemas (request bodies)
- 5 helper functions (authorization, merging, validation)
- Comprehensive test coverage (estimated 85+ tests)
- Foundation for Phase 3 Module 3 (Widget Serving & Frontend)

### Module Dependencies

**Requires (from Phase 3 Module 1):**
- Database schema with `widgets` table
- `WidgetConfig` TypeScript types
- `createWidgetConfigSchema(tier, allowDefaults)` validation
- `createDefaultConfig(tier)` default generators

**Provides (for Phase 3 Module 3):**
- Widget CRUD operations for frontend dashboard
- Deployment validation endpoint
- Public embed endpoint for widget loading

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
- Phase 3 Module 1: Widget Schema Foundation (179 tests)
  - Database schema with `widgets` table
  - TypeScript type definitions (`WidgetConfig`)
  - Zod validation schemas (tier-aware)
  - Default config generators

**Total Tests Passing:** 553/553 ✅

### Business Rules & Constraints

#### Widget Limits by Tier
- **Basic:** 1 widget per license
- **Pro:** 3 widgets per license
- **Agency:** Unlimited widgets (-1 = no limit)

#### Widget Lifecycle
1. Created with `status='active'` by default
2. Can be paused (`status='paused'`)
3. Soft delete (`status='deleted'`)
4. `deployedAt` tracks first deployment timestamp

#### Config Validation
- Must validate against tier-specific Zod schema
- Basic tier: branding required, advanced styling disabled
- Pro/Agency: can disable branding, advanced styling enabled
- Use `createWidgetConfigSchema(tier, allowDefaults)` for validation

#### Authorization
- Users can only access widgets from their own licenses
- Must verify license ownership before widget operations
- Use `requireAuth` middleware for all authenticated endpoints

#### Default Configs
- New widgets start with tier-appropriate defaults (`createDefaultConfig`)
- Users can override all default values
- Empty `webhookUrl` is valid for creation, but required for deployment

---

## Architectural Decisions

### Decision 1: Authorization Strategy

**Decision:** Two-tier authorization (authentication + ownership verification)

**Rationale:**
- JWT authentication verifies user identity
- Ownership check verifies user owns the license associated with widget
- Prevents horizontal privilege escalation (accessing other users' widgets)

**Implementation:**
```typescript
// Helper function used across all endpoints
async function verifyWidgetOwnership(widgetId: string, userId: string): Promise<Widget & { license: License }> {
  const widget = await getWidgetWithLicense(widgetId);
  if (!widget) throw new Error('Widget not found');
  if (widget.license.userId !== userId) throw new Error('Forbidden');
  return widget;
}
```

### Decision 2: Config Merging Strategy

**Decision:** Deep merge user config with tier defaults

**Rationale:**
- Users provide partial configs (only what they want to override)
- System fills in tier-appropriate defaults for missing fields
- Reduces payload size and complexity for clients

**Implementation:**
```typescript
function mergeWithDefaults(userConfig: Partial<WidgetConfig>, tier: LicenseTier): WidgetConfig {
  const defaults = createDefaultConfig(tier);
  return deepMerge(defaults, userConfig);
}
```

### Decision 3: Widget Limit Enforcement

**Decision:** Check widget count at creation time, not deletion

**Rationale:**
- Soft delete means widgets remain in database
- Count only `status='active' | 'paused'` widgets (exclude 'deleted')
- Users can delete and recreate within limits

**Implementation:**
```typescript
async function checkWidgetLimit(licenseId: string, tier: LicenseTier): Promise<void> {
  const count = await getActiveWidgetCount(licenseId);
  const limit = getWidgetLimitForTier(tier);
  if (limit !== -1 && count >= limit) {
    throw new Error(`Widget limit exceeded for ${tier} tier (max: ${limit})`);
  }
}
```

### Decision 4: Deployment Validation

**Decision:** Separate deployment endpoint with strict validation

**Rationale:**
- Widget can be saved with incomplete config (e.g., empty webhookUrl)
- Deployment requires complete, production-ready config
- Explicit deployment action prevents accidental activation

**Validation:**
- `webhookUrl` must be valid HTTPS URL
- All required fields must be present
- Validate against tier schema with `allowDefaults=false`

### Decision 5: Public Embed Security

**Decision:** Domain-based authorization without authentication

**Rationale:**
- Embed endpoint must be public (no JWT required)
- Security via license validation + domain whitelist
- Only return config for active, deployed widgets

**Security Measures:**
- Verify `status='active'`
- Verify `deployedAt` is not null
- Validate domain against license whitelist
- Return sanitized config (no sensitive data)

---

## API Endpoint Specifications

### 1. POST /api/widgets

**Purpose:** Create a new widget for a license

**Authentication:** Required (JWT)

**Request Body:**
```typescript
{
  licenseId: string;        // UUID of license
  name: string;             // Widget name (1-100 chars)
  config?: Partial<WidgetConfig>; // Optional config overrides
}
```

**Validation Rules:**
- `licenseId`: Must be valid UUID, license must exist, user must own license
- `name`: Required, 1-100 characters
- `config`: If provided, validate structure (partial allowed)

**Business Logic:**
1. Authenticate user
2. Verify license exists and user owns it
3. Check widget limit not exceeded for license tier
4. If config not provided, use `createDefaultConfig(license.tier)`
5. If config provided, merge with defaults: `mergeWithDefaults(config, tier)`
6. Validate merged config against `createWidgetConfigSchema(tier, allowDefaults=true)`
7. Insert widget with `status='active'`, `version=1`, `deployedAt=null`

**Success Response:** `201 Created`
```json
{
  "widget": {
    "id": "uuid",
    "licenseId": "uuid",
    "name": "Homepage Chat",
    "status": "active",
    "config": { ... },
    "version": 1,
    "deployedAt": null,
    "createdAt": "2025-11-10T...",
    "updatedAt": "2025-11-10T..."
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed (invalid config, invalid name)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Widget limit exceeded, user doesn't own license
- `404 Not Found`: License not found

---

### 2. GET /api/widgets

**Purpose:** List all widgets for authenticated user's licenses

**Authentication:** Required (JWT)

**Query Parameters:**
```typescript
{
  licenseId?: string;       // Filter by license ID
  includeDeleted?: boolean; // Include soft-deleted widgets (default: false)
  page?: number;            // Page number (default: 1)
  limit?: number;           // Results per page (default: 20, max: 100)
}
```

**Business Logic:**
1. Authenticate user
2. Get all licenses for user
3. If `licenseId` provided, verify user owns that license
4. Query widgets for user's licenses (or filtered license)
5. Exclude `status='deleted'` unless `includeDeleted=true`
6. Apply pagination
7. Include license info (tier, status) in response

**Success Response:** `200 OK`
```json
{
  "widgets": [
    {
      "id": "uuid",
      "licenseId": "uuid",
      "name": "Homepage Chat",
      "status": "active",
      "config": { ... },
      "version": 3,
      "deployedAt": "2025-11-10T...",
      "createdAt": "2025-11-10T...",
      "updatedAt": "2025-11-10T...",
      "license": {
        "id": "uuid",
        "tier": "pro",
        "status": "active"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: License not owned by user (if licenseId filter used)

---

### 3. GET /api/widgets/[id]

**Purpose:** Get single widget details

**Authentication:** Required (JWT)

**Path Parameters:**
- `id`: Widget UUID

**Business Logic:**
1. Authenticate user
2. Get widget by ID with license info
3. Verify user owns the license
4. Return widget with full config

**Success Response:** `200 OK`
```json
{
  "widget": {
    "id": "uuid",
    "licenseId": "uuid",
    "name": "Homepage Chat",
    "status": "active",
    "config": { ... },
    "version": 3,
    "deployedAt": "2025-11-10T...",
    "createdAt": "2025-11-10T...",
    "updatedAt": "2025-11-10T...",
    "license": {
      "id": "uuid",
      "tier": "pro",
      "status": "active",
      "domains": ["example.com"]
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't own widget
- `404 Not Found`: Widget not found

---

### 4. PATCH /api/widgets/[id]

**Purpose:** Update widget (name, config, or status)

**Authentication:** Required (JWT)

**Path Parameters:**
- `id`: Widget UUID

**Request Body:**
```typescript
{
  name?: string;                    // Update widget name
  config?: Partial<WidgetConfig>;   // Partial config update
  status?: 'active' | 'paused';     // Update status (cannot set to 'deleted' here)
}
```

**Validation Rules:**
- `name`: If provided, 1-100 characters
- `config`: If provided, deep merge with existing config, validate result
- `status`: If provided, must be 'active' or 'paused' (use DELETE for soft delete)

**Business Logic:**
1. Authenticate user
2. Get widget with license, verify ownership
3. If `name` provided, validate length
4. If `config` provided:
   - Deep merge with existing config
   - Validate merged config against `createWidgetConfigSchema(tier, allowDefaults=true)`
   - Increment `version` number
5. If `status` changed to 'active' and `deployedAt` is null, set `deployedAt` to now
6. Update `updatedAt` timestamp

**Success Response:** `200 OK`
```json
{
  "widget": {
    "id": "uuid",
    "licenseId": "uuid",
    "name": "Updated Name",
    "status": "active",
    "config": { ... },
    "version": 4,
    "deployedAt": "2025-11-10T...",
    "createdAt": "2025-11-10T...",
    "updatedAt": "2025-11-10T..."
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation failed
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't own widget
- `404 Not Found`: Widget not found

---

### 5. DELETE /api/widgets/[id]

**Purpose:** Soft delete widget

**Authentication:** Required (JWT)

**Path Parameters:**
- `id`: Widget UUID

**Business Logic:**
1. Authenticate user
2. Get widget with license, verify ownership
3. Update `status='deleted'`
4. Keep all data in database (soft delete)

**Success Response:** `200 OK`
```json
{
  "message": "Widget deleted successfully",
  "widgetId": "uuid"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't own widget
- `404 Not Found`: Widget not found

---

### 6. POST /api/widgets/[id]/deploy

**Purpose:** Deploy widget (validate config is complete and production-ready)

**Authentication:** Required (JWT)

**Path Parameters:**
- `id`: Widget UUID

**Business Logic:**
1. Authenticate user
2. Get widget with license, verify ownership
3. Validate config is deployment-ready:
   - `webhookUrl` must be valid HTTPS URL (not empty)
   - All required fields present
   - Validate against `createWidgetConfigSchema(tier, allowDefaults=false)` (strict)
4. If validation passes:
   - Set `deployedAt` to now (if not already set)
   - Set `status='active'` (if paused)
   - Return deployment info

**Success Response:** `200 OK`
```json
{
  "message": "Widget deployed successfully",
  "widget": {
    "id": "uuid",
    "status": "active",
    "deployedAt": "2025-11-10T...",
    "version": 4
  }
}
```

**Error Responses:**
- `400 Bad Request`: Config invalid for deployment (e.g., empty webhookUrl)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User doesn't own widget
- `404 Not Found`: Widget not found

**Validation Errors Example:**
```json
{
  "error": "Widget configuration is not ready for deployment",
  "details": [
    {
      "path": ["connection", "webhookUrl"],
      "message": "Webhook URL is required for deployment"
    }
  ]
}
```

---

### 7. GET /api/widgets/[id]/embed

**Purpose:** Public endpoint - returns widget config for embedding on authorized domains

**Authentication:** NOT REQUIRED (public endpoint)

**Path Parameters:**
- `id`: Widget UUID

**Query Parameters:**
```typescript
{
  domain: string; // Domain where widget is being embedded (required)
}
```

**Business Logic:**
1. NO authentication required
2. Get widget by ID
3. Verify widget `status='active'`
4. Verify widget `deployedAt` is not null
5. Get license for widget
6. Validate domain using `validateLicense(licenseKey, domain)`
7. If all checks pass, return sanitized config
8. Track analytics event (optional for now)

**Success Response:** `200 OK`
```json
{
  "config": {
    "branding": { ... },
    "theme": { ... },
    "advancedStyling": { ... },
    "behavior": { ... },
    "connection": {
      "webhookUrl": "https://n8n.example.com/webhook/...",
      "route": null,
      "timeoutSeconds": 30
    },
    "features": { ... }
  },
  "version": 4,
  "licenseKey": "abc123..." // For widget to include in requests
}
```

**Error Responses:**
- `400 Bad Request`: Missing domain parameter
- `403 Forbidden`: Widget inactive, not deployed, or domain unauthorized
- `404 Not Found`: Widget not found

**Security Notes:**
- This endpoint is PUBLIC and UNAUTHENTICATED
- Security relies on domain validation only
- Do not expose sensitive license data (user info, payment info, etc.)
- Rate limit this endpoint to prevent abuse

---

## Database Query Functions

All query functions should be added to `lib/db/queries.ts`:

### Widget Query Functions

#### 1. getWidgetById
```typescript
/**
 * Get widget by ID
 * @param id - Widget UUID
 * @returns Widget or null if not found
 */
export async function getWidgetById(id: string): Promise<Widget | null>
```

**Implementation:**
```typescript
const [widget] = await db
  .select()
  .from(widgets)
  .where(eq(widgets.id, id))
  .limit(1);
return widget || null;
```

---

#### 2. getWidgetWithLicense
```typescript
/**
 * Get widget by ID with license information
 * Used for authorization checks
 * @param id - Widget UUID
 * @returns Widget with license or null
 */
export async function getWidgetWithLicense(
  id: string
): Promise<(Widget & { license: License }) | null>
```

**Implementation:**
```typescript
const result = await db
  .select()
  .from(widgets)
  .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
  .where(eq(widgets.id, id))
  .limit(1);

if (!result.length) return null;

return {
  ...result[0].widgets,
  license: result[0].licenses,
};
```

---

#### 3. getWidgetsByLicenseId
```typescript
/**
 * Get all widgets for a license
 * @param licenseId - License UUID
 * @param includeDeleted - Include soft-deleted widgets
 * @returns Array of widgets
 */
export async function getWidgetsByLicenseId(
  licenseId: string,
  includeDeleted = false
): Promise<Widget[]>
```

**Implementation:**
```typescript
const conditions = [eq(widgets.licenseId, licenseId)];

if (!includeDeleted) {
  conditions.push(ne(widgets.status, 'deleted'));
}

return db
  .select()
  .from(widgets)
  .where(and(...conditions))
  .orderBy(desc(widgets.createdAt));
```

---

#### 4. getWidgetsByUserId
```typescript
/**
 * Get all widgets for a user (across all their licenses)
 * @param userId - User UUID
 * @param includeDeleted - Include soft-deleted widgets
 * @param licenseId - Optional filter by specific license
 * @returns Array of widgets with license info
 */
export async function getWidgetsByUserId(
  userId: string,
  includeDeleted = false,
  licenseId?: string
): Promise<Array<Widget & { license: License }>>
```

**Implementation:**
```typescript
const conditions = [eq(licenses.userId, userId)];

if (licenseId) {
  conditions.push(eq(widgets.licenseId, licenseId));
}

if (!includeDeleted) {
  conditions.push(ne(widgets.status, 'deleted'));
}

const results = await db
  .select()
  .from(widgets)
  .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
  .where(and(...conditions))
  .orderBy(desc(widgets.createdAt));

return results.map(r => ({
  ...r.widgets,
  license: r.licenses,
}));
```

---

#### 5. getActiveWidgetCount
```typescript
/**
 * Count active widgets for a license (excludes deleted)
 * Used for widget limit enforcement
 * @param licenseId - License UUID
 * @returns Count of active/paused widgets
 */
export async function getActiveWidgetCount(licenseId: string): Promise<number>
```

**Implementation:**
```typescript
const result = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(widgets)
  .where(
    and(
      eq(widgets.licenseId, licenseId),
      ne(widgets.status, 'deleted')
    )
  );

return result[0]?.count || 0;
```

---

#### 6. createWidget
```typescript
/**
 * Create a new widget
 * @param data - Widget data (name, licenseId, config)
 * @returns Created widget
 */
export async function createWidget(data: NewWidget): Promise<Widget>
```

**Implementation:**
```typescript
const [widget] = await db
  .insert(widgets)
  .values({
    ...data,
    status: 'active',
    version: 1,
    deployedAt: null,
  })
  .returning();

return widget;
```

---

#### 7. updateWidget
```typescript
/**
 * Update widget (name, config, status, or metadata)
 * @param id - Widget UUID
 * @param data - Partial widget data to update
 * @returns Updated widget or null
 */
export async function updateWidget(
  id: string,
  data: Partial<Omit<Widget, 'id' | 'createdAt'>>
): Promise<Widget | null>
```

**Implementation:**
```typescript
const [widget] = await db
  .update(widgets)
  .set({
    ...data,
    updatedAt: new Date(),
  })
  .where(eq(widgets.id, id))
  .returning();

return widget || null;
```

---

#### 8. deleteWidget (Soft Delete)
```typescript
/**
 * Soft delete widget (set status to 'deleted')
 * @param id - Widget UUID
 * @returns Updated widget or null
 */
export async function deleteWidget(id: string): Promise<Widget | null>
```

**Implementation:**
```typescript
const [widget] = await db
  .update(widgets)
  .set({
    status: 'deleted',
    updatedAt: new Date(),
  })
  .where(eq(widgets.id, id))
  .returning();

return widget || null;
```

---

#### 9. deployWidget
```typescript
/**
 * Mark widget as deployed (set deployedAt timestamp, activate)
 * @param id - Widget UUID
 * @returns Updated widget or null
 */
export async function deployWidget(id: string): Promise<Widget | null>
```

**Implementation:**
```typescript
const now = new Date();

const [widget] = await db
  .update(widgets)
  .set({
    deployedAt: now,
    status: 'active',
    updatedAt: now,
  })
  .where(eq(widgets.id, id))
  .returning();

return widget || null;
```

---

#### 10. getWidgetsPaginated
```typescript
/**
 * Get paginated widgets for a user
 * @param userId - User UUID
 * @param options - Pagination and filter options
 * @returns Paginated widgets with total count
 */
export async function getWidgetsPaginated(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    licenseId?: string;
    includeDeleted?: boolean;
  }
): Promise<{
  widgets: Array<Widget & { license: License }>;
  total: number;
}>
```

**Implementation:**
```typescript
const page = options.page || 1;
const limit = Math.min(options.limit || 20, 100); // Max 100
const offset = (page - 1) * limit;

const conditions = [eq(licenses.userId, userId)];

if (options.licenseId) {
  conditions.push(eq(widgets.licenseId, options.licenseId));
}

if (!options.includeDeleted) {
  conditions.push(ne(widgets.status, 'deleted'));
}

// Get total count
const [countResult] = await db
  .select({ count: sql<number>`count(*)::int` })
  .from(widgets)
  .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
  .where(and(...conditions));

const total = countResult?.count || 0;

// Get paginated results
const results = await db
  .select()
  .from(widgets)
  .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
  .where(and(...conditions))
  .orderBy(desc(widgets.createdAt))
  .limit(limit)
  .offset(offset);

const widgets = results.map(r => ({
  ...r.widgets,
  license: r.licenses,
}));

return { widgets, total };
```

---

### License Query Extensions

#### 11. getLicenseWithWidgetCount
```typescript
/**
 * Get license with active widget count
 * @param id - License UUID
 * @returns License with widget count or null
 */
export async function getLicenseWithWidgetCount(
  id: string
): Promise<(License & { widgetCount: number }) | null>
```

**Implementation:**
```typescript
const license = await getLicenseById(id);
if (!license) return null;

const count = await getActiveWidgetCount(id);

return {
  ...license,
  widgetCount: count,
};
```

---

#### 12. getUserLicensesWithWidgetCounts
```typescript
/**
 * Get all user licenses with widget counts
 * @param userId - User UUID
 * @returns Array of licenses with widget counts
 */
export async function getUserLicensesWithWidgetCounts(
  userId: string
): Promise<Array<License & { widgetCount: number }>>
```

**Implementation:**
```typescript
const userLicenses = await getUserLicenses(userId);

const licensesWithCounts = await Promise.all(
  userLicenses.map(async (license) => {
    const count = await getActiveWidgetCount(license.id);
    return { ...license, widgetCount: count };
  })
);

return licensesWithCounts;
```

---

## Validation Schemas

Add to `lib/api/schemas.ts`:

### 1. createWidgetSchema
```typescript
import { z } from 'zod';

/**
 * Schema for POST /api/widgets request body
 */
export const createWidgetSchema = z.object({
  licenseId: z.string().uuid('Invalid license ID'),
  name: z
    .string()
    .min(1, 'Widget name required')
    .max(100, 'Widget name must be 100 characters or less'),
  config: z
    .any() // Will be validated with tier-specific schema after license lookup
    .optional(),
});

export type CreateWidgetInput = z.infer<typeof createWidgetSchema>;
```

---

### 2. updateWidgetSchema
```typescript
/**
 * Schema for PATCH /api/widgets/[id] request body
 */
export const updateWidgetSchema = z.object({
  name: z
    .string()
    .min(1, 'Widget name required')
    .max(100, 'Widget name must be 100 characters or less')
    .optional(),
  config: z
    .any() // Will be validated with tier-specific schema after widget lookup
    .optional(),
  status: z
    .enum(['active', 'paused'])
    .optional(),
}).refine(
  (data) => data.name || data.config || data.status,
  'At least one field must be provided for update'
);

export type UpdateWidgetInput = z.infer<typeof updateWidgetSchema>;
```

---

### 3. listWidgetsSchema
```typescript
/**
 * Schema for GET /api/widgets query parameters
 */
export const listWidgetsSchema = z.object({
  licenseId: z.string().uuid('Invalid license ID').optional(),
  includeDeleted: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional()
    .default('false'),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1))
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default('20'),
});

export type ListWidgetsInput = z.infer<typeof listWidgetsSchema>;
```

---

### 4. embedWidgetSchema
```typescript
/**
 * Schema for GET /api/widgets/[id]/embed query parameters
 */
export const embedWidgetSchema = z.object({
  domain: z
    .string()
    .min(1, 'Domain parameter required')
    .max(255, 'Domain too long'),
});

export type EmbedWidgetInput = z.infer<typeof embedWidgetSchema>;
```

---

## Helper Functions

Create `lib/widgets/helpers.ts`:

### 1. verifyWidgetOwnership
```typescript
import { getWidgetWithLicense } from '@/lib/db/queries';
import type { Widget, License } from '@/lib/db/schema';

/**
 * Verify user owns the widget via license ownership
 * @param widgetId - Widget UUID
 * @param userId - User UUID
 * @returns Widget with license
 * @throws Error if widget not found or user doesn't own it
 */
export async function verifyWidgetOwnership(
  widgetId: string,
  userId: string
): Promise<Widget & { license: License }> {
  const widget = await getWidgetWithLicense(widgetId);

  if (!widget) {
    throw new Error('Widget not found');
  }

  if (widget.license.userId !== userId) {
    throw new Error('Forbidden');
  }

  return widget;
}
```

---

### 2. verifyLicenseOwnership
```typescript
import { getLicenseById } from '@/lib/db/queries';
import type { License } from '@/lib/db/schema';

/**
 * Verify user owns the license
 * @param licenseId - License UUID
 * @param userId - User UUID
 * @returns License
 * @throws Error if license not found or user doesn't own it
 */
export async function verifyLicenseOwnership(
  licenseId: string,
  userId: string
): Promise<License> {
  const license = await getLicenseById(licenseId);

  if (!license) {
    throw new Error('License not found');
  }

  if (license.userId !== userId) {
    throw new Error('Forbidden');
  }

  return license;
}
```

---

### 3. checkWidgetLimit
```typescript
import { getActiveWidgetCount } from '@/lib/db/queries';
import type { LicenseTier } from '@/lib/validation/widget-schema';

/**
 * Get widget limit for a tier
 */
function getWidgetLimitForTier(tier: LicenseTier): number {
  switch (tier) {
    case 'basic':
      return 1;
    case 'pro':
      return 3;
    case 'agency':
      return -1; // unlimited
  }
}

/**
 * Check if widget limit is exceeded for license
 * @param licenseId - License UUID
 * @param tier - License tier
 * @throws Error if limit exceeded
 */
export async function checkWidgetLimit(
  licenseId: string,
  tier: LicenseTier
): Promise<void> {
  const count = await getActiveWidgetCount(licenseId);
  const limit = getWidgetLimitForTier(tier);

  if (limit !== -1 && count >= limit) {
    throw new Error(
      `Widget limit exceeded for ${tier} tier (max: ${limit}, current: ${count})`
    );
  }
}
```

---

### 4. mergeWidgetConfig
```typescript
import { createDefaultConfig } from '@/lib/config/defaults';
import type { WidgetConfig } from '@/lib/types/widget-config';
import type { LicenseTier } from '@/lib/validation/widget-schema';

/**
 * Deep merge two objects (recursively)
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = structuredClone(target);

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

/**
 * Merge user config with tier-appropriate defaults
 * @param userConfig - Partial user-provided config
 * @param tier - License tier
 * @returns Complete merged config
 */
export function mergeWidgetConfig(
  userConfig: Partial<WidgetConfig>,
  tier: LicenseTier
): WidgetConfig {
  const defaults = createDefaultConfig(tier);
  return deepMerge(defaults, userConfig);
}
```

---

### 5. validateDeploymentConfig
```typescript
import { createWidgetConfigSchema } from '@/lib/validation/widget-schema';
import type { WidgetConfig } from '@/lib/types/widget-config';
import type { LicenseTier } from '@/lib/validation/widget-schema';

/**
 * Validate widget config is ready for deployment
 * @param config - Widget config
 * @param tier - License tier
 * @throws ZodError if validation fails
 */
export function validateDeploymentConfig(
  config: WidgetConfig,
  tier: LicenseTier
): void {
  // Strict validation (allowDefaults=false)
  const schema = createWidgetConfigSchema(tier, false);

  // Additional deployment checks
  if (!config.connection.webhookUrl || config.connection.webhookUrl === '') {
    throw new Error('Webhook URL is required for deployment');
  }

  // Validate with strict schema
  schema.parse(config);
}
```

---

## File Structure

```
n8n-widget-designer/
├── app/
│   └── api/
│       └── widgets/
│           ├── route.ts                    # POST /api/widgets, GET /api/widgets
│           └── [id]/
│               ├── route.ts                # GET, PATCH, DELETE /api/widgets/[id]
│               ├── deploy/
│               │   └── route.ts            # POST /api/widgets/[id]/deploy
│               └── embed/
│                   └── route.ts            # GET /api/widgets/[id]/embed (public)
├── lib/
│   ├── db/
│   │   ├── queries.ts                      # Add 12 widget query functions
│   │   └── schema.ts                       # Already has widgets table
│   ├── widgets/
│   │   └── helpers.ts                      # NEW: Helper functions (ownership, merging, etc.)
│   ├── api/
│   │   └── schemas.ts                      # Add 4 request validation schemas
│   ├── types/
│   │   └── widget-config.ts                # Already exists (Phase 3.1)
│   ├── validation/
│   │   └── widget-schema.ts                # Already exists (Phase 3.1)
│   └── config/
│       └── defaults.ts                     # Already exists (Phase 3.1)
└── tests/
    ├── integration/
    │   └── api/
    │       └── widgets/
    │           ├── create.test.ts          # POST /api/widgets tests
    │           ├── list.test.ts            # GET /api/widgets tests
    │           ├── get.test.ts             # GET /api/widgets/[id] tests
    │           ├── update.test.ts          # PATCH /api/widgets/[id] tests
    │           ├── delete.test.ts          # DELETE /api/widgets/[id] tests
    │           ├── deploy.test.ts          # POST /api/widgets/[id]/deploy tests
    │           └── embed.test.ts           # GET /api/widgets/[id]/embed tests
    └── unit/
        └── widgets/
            ├── helpers.test.ts             # Helper function tests
            └── merging.test.ts             # Config merging tests
```

**Total New Files:** 14
- 5 API route files
- 1 helper functions file
- 7 integration test files
- 1 unit test file (helpers)
- 1 unit test file (merging)

**Modified Files:** 2
- `lib/db/queries.ts` (add widget queries)
- `lib/api/schemas.ts` (add request schemas)

---

## Error Scenarios

### Authentication Errors

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| No JWT token in cookie | 401 | "Authentication required" |
| Invalid JWT token | 401 | "Invalid or expired token" |
| Expired JWT token | 401 | "Invalid or expired token" |

---

### Authorization Errors

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| User doesn't own license | 403 | "Forbidden" |
| User doesn't own widget | 403 | "Forbidden" |
| Widget limit exceeded | 403 | "Widget limit exceeded for {tier} tier (max: {limit}, current: {count})" |

---

### Validation Errors

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Invalid UUID format | 400 | "Invalid {field} ID" |
| Widget name too long | 400 | "Widget name must be 100 characters or less" |
| Widget name empty | 400 | "Widget name required" |
| Config violates tier restrictions | 400 | "Branding must be enabled for Basic tier" |
| Invalid hex color | 400 | "Must be a valid hex color (#RRGGBB)" |
| Invalid webhook URL | 400 | "Must be a valid HTTPS URL" |
| Deployment config incomplete | 400 | "Webhook URL is required for deployment" |
| Missing domain parameter (embed) | 400 | "Domain parameter required" |

---

### Not Found Errors

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| License not found | 404 | "License not found" |
| Widget not found | 404 | "Widget not found" |

---

### Business Logic Errors

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Widget limit exceeded (Basic) | 403 | "Widget limit exceeded for basic tier (max: 1)" |
| Widget limit exceeded (Pro) | 403 | "Widget limit exceeded for pro tier (max: 3)" |
| Widget inactive (embed) | 403 | "Widget is not active" |
| Widget not deployed (embed) | 403 | "Widget has not been deployed" |
| Domain not authorized (embed) | 403 | "Domain not authorized for this license" |
| License expired (embed) | 403 | "License has expired" |
| License cancelled (embed) | 403 | "License has been cancelled" |

---

### Edge Cases

| Scenario | Handling |
|----------|----------|
| User deletes widget then creates new one | Should work if within limit (deleted widgets don't count) |
| User updates widget status from 'paused' to 'active' | Set deployedAt if null |
| User tries to set status='deleted' via PATCH | Reject - must use DELETE endpoint |
| Partial config update with invalid data | Merge first, then validate entire config |
| Empty config provided on create | Use tier defaults entirely |
| Null config provided on create | Use tier defaults entirely |
| Duplicate widget names | Allow - names don't need to be unique |
| Very long config (>1MB JSON) | Database JSONB will handle, but consider validation limit |
| Concurrent widget creation | Database handles uniqueness of IDs, widget count check has race condition (acceptable for MVP) |

---

## Test Strategy

### Integration Tests (API Endpoints)

#### Test File 1: `tests/integration/api/widgets/create.test.ts`

**Estimated Tests:** 15

**Success Cases:**
1. Create widget with defaults (no config provided)
2. Create widget with partial config
3. Create widget with full custom config
4. Create widget for Basic tier (verify branding enabled)
5. Create widget for Pro tier (verify branding disabled)
6. Create widget for Agency tier

**Error Cases:**
7. Create without authentication (401)
8. Create with invalid license ID format (400)
9. Create with non-existent license (404)
10. Create with license owned by another user (403)
11. Create with invalid widget name (too long) (400)
12. Create with empty widget name (400)
13. Create exceeding Basic tier limit (1 widget) (403)
14. Create exceeding Pro tier limit (3 widgets) (403)
15. Create with config violating tier restrictions (400)

---

#### Test File 2: `tests/integration/api/widgets/list.test.ts`

**Estimated Tests:** 12

**Success Cases:**
1. List all widgets for user (multiple licenses)
2. List widgets filtered by license ID
3. List with includeDeleted=false (exclude deleted)
4. List with includeDeleted=true (include deleted)
5. List with pagination (page 1, limit 10)
6. List with pagination (page 2, limit 10)
7. List returns empty array when no widgets
8. List includes license info in response

**Error Cases:**
9. List without authentication (401)
10. List with invalid license ID filter (400)
11. List with license ID owned by another user (403)
12. List with invalid pagination params (400)

---

#### Test File 3: `tests/integration/api/widgets/get.test.ts`

**Estimated Tests:** 8

**Success Cases:**
1. Get widget by ID with full config
2. Get widget includes license info
3. Get widget for Basic tier
4. Get widget for Pro tier
5. Get widget for Agency tier

**Error Cases:**
6. Get without authentication (401)
7. Get with invalid widget ID format (400)
8. Get widget owned by another user (403)
9. Get non-existent widget (404)

---

#### Test File 4: `tests/integration/api/widgets/update.test.ts`

**Estimated Tests:** 18

**Success Cases:**
1. Update widget name only
2. Update widget status only (active → paused)
3. Update widget status only (paused → active)
4. Update widget config only (partial)
5. Update widget config only (full)
6. Update all fields at once (name + config + status)
7. Update increments version number
8. Update sets deployedAt when status changes to active (if null)
9. Update doesn't overwrite deployedAt if already set
10. Update deep merges config correctly

**Error Cases:**
11. Update without authentication (401)
12. Update widget owned by another user (403)
13. Update with invalid widget ID (400)
14. Update with no fields provided (400)
15. Update with invalid name (too long) (400)
16. Update with config violating tier restrictions (400)
17. Update with invalid status value (400)
18. Update non-existent widget (404)

---

#### Test File 5: `tests/integration/api/widgets/delete.test.ts`

**Estimated Tests:** 8

**Success Cases:**
1. Soft delete widget (sets status='deleted')
2. Soft delete keeps all data in database
3. Soft delete returns success message
4. Soft delete allows creating new widget after (Basic tier)
5. Soft delete widget doesn't affect widget count

**Error Cases:**
6. Delete without authentication (401)
7. Delete widget owned by another user (403)
8. Delete non-existent widget (404)

---

#### Test File 6: `tests/integration/api/widgets/deploy.test.ts`

**Estimated Tests:** 12

**Success Cases:**
1. Deploy widget with complete config
2. Deploy sets deployedAt timestamp
3. Deploy activates paused widget
4. Deploy doesn't change deployedAt if already set
5. Deploy returns deployment info

**Error Cases:**
6. Deploy without authentication (401)
7. Deploy widget owned by another user (403)
8. Deploy non-existent widget (404)
9. Deploy with empty webhookUrl (400)
10. Deploy with invalid webhookUrl (not HTTPS) (400)
11. Deploy with incomplete config (400)
12. Deploy with config violating tier restrictions (400)

---

#### Test File 7: `tests/integration/api/widgets/embed.test.ts`

**Estimated Tests:** 15

**Success Cases:**
1. Embed returns config for active deployed widget
2. Embed returns config for authorized domain
3. Embed works without authentication (public endpoint)
4. Embed returns sanitized config (no sensitive data)
5. Embed includes license key in response
6. Embed includes version number

**Error Cases:**
7. Embed without domain parameter (400)
8. Embed with non-existent widget (404)
9. Embed with inactive widget (status='paused') (403)
10. Embed with deleted widget (status='deleted') (403)
11. Embed with non-deployed widget (deployedAt=null) (403)
12. Embed with unauthorized domain (403)
13. Embed with expired license (403)
14. Embed with cancelled license (403)
15. Embed normalizes domain correctly (www, case)

---

### Unit Tests

#### Test File 8: `tests/unit/widgets/helpers.test.ts`

**Estimated Tests:** 12

**Functions to Test:**
1. `verifyWidgetOwnership` - success case
2. `verifyWidgetOwnership` - widget not found
3. `verifyWidgetOwnership` - user doesn't own widget
4. `verifyLicenseOwnership` - success case
5. `verifyLicenseOwnership` - license not found
6. `verifyLicenseOwnership` - user doesn't own license
7. `checkWidgetLimit` - Basic tier (within limit)
8. `checkWidgetLimit` - Basic tier (exceeds limit)
9. `checkWidgetLimit` - Pro tier (within limit)
10. `checkWidgetLimit` - Pro tier (exceeds limit)
11. `checkWidgetLimit` - Agency tier (unlimited)
12. `validateDeploymentConfig` - various scenarios

---

#### Test File 9: `tests/unit/widgets/merging.test.ts`

**Estimated Tests:** 10

**Functions to Test:**
1. `mergeWidgetConfig` - empty user config (full defaults)
2. `mergeWidgetConfig` - partial user config (shallow merge)
3. `mergeWidgetConfig` - partial user config (deep merge)
4. `mergeWidgetConfig` - full user config override
5. `mergeWidgetConfig` - Basic tier defaults
6. `mergeWidgetConfig` - Pro tier defaults
7. `mergeWidgetConfig` - Agency tier defaults
8. `mergeWidgetConfig` - preserves user overrides
9. `mergeWidgetConfig` - deep nested merge
10. `mergeWidgetConfig` - array handling (don't merge arrays)

---

### Test Summary

| Test File | Test Count |
|-----------|------------|
| create.test.ts | 15 |
| list.test.ts | 12 |
| get.test.ts | 8 |
| update.test.ts | 18 |
| delete.test.ts | 8 |
| deploy.test.ts | 12 |
| embed.test.ts | 15 |
| helpers.test.ts | 12 |
| merging.test.ts | 10 |
| **TOTAL** | **110** |

**Estimated Test Count:** 110 tests
**Estimated Coverage:** 90%+ of widget API functionality

---

## Implementation Order (TDD)

### Week 1: Database Queries & Helpers (RED → GREEN → REFACTOR)

#### Day 1: Core Widget Queries
1. Write failing tests for `getWidgetById`
2. Implement `getWidgetById` (GREEN)
3. Write failing tests for `getWidgetWithLicense`
4. Implement `getWidgetWithLicense` (GREEN)
5. Write failing tests for `createWidget`
6. Implement `createWidget` (GREEN)
7. Refactor duplicate code

#### Day 2: License-Related Queries
8. Write failing tests for `getWidgetsByLicenseId`
9. Implement `getWidgetsByLicenseId` (GREEN)
10. Write failing tests for `getWidgetsByUserId`
11. Implement `getWidgetsByUserId` (GREEN)
12. Write failing tests for `getActiveWidgetCount`
13. Implement `getActiveWidgetCount` (GREEN)
14. Refactor query logic

#### Day 3: Update & Delete Queries
15. Write failing tests for `updateWidget`
16. Implement `updateWidget` (GREEN)
17. Write failing tests for `deleteWidget` (soft delete)
18. Implement `deleteWidget` (GREEN)
19. Write failing tests for `deployWidget`
20. Implement `deployWidget` (GREEN)
21. Refactor update logic

#### Day 4: Pagination & Helper Functions
22. Write failing tests for `getWidgetsPaginated`
23. Implement `getWidgetsPaginated` (GREEN)
24. Write failing tests for helper functions (`verifyWidgetOwnership`, etc.)
25. Implement helper functions (GREEN)
26. Write failing tests for `mergeWidgetConfig`
27. Implement `mergeWidgetConfig` (GREEN)
28. Refactor helper logic

---

### Week 2: API Endpoints Part 1 (CREATE, LIST, GET)

#### Day 5: POST /api/widgets (Create)
29. Write failing test: Create widget with defaults
30. Implement basic POST route skeleton (GREEN)
31. Write failing test: Create with partial config
32. Implement config merging logic (GREEN)
33. Write failing test: Widget limit enforcement (Basic tier)
34. Implement limit check (GREEN)
35. Write failing tests: Authorization errors
36. Implement authorization checks (GREEN)
37. Write failing tests: Validation errors
38. Implement validation (GREEN)
39. Refactor route logic

#### Day 6: GET /api/widgets (List)
40. Write failing test: List all widgets for user
41. Implement basic GET route (GREEN)
42. Write failing test: Filter by license ID
43. Implement filtering (GREEN)
44. Write failing test: Pagination
45. Implement pagination (GREEN)
46. Write failing test: Include deleted widgets
47. Implement includeDeleted flag (GREEN)
48. Write failing tests: Error cases
49. Implement error handling (GREEN)
50. Refactor route logic

#### Day 7: GET /api/widgets/[id] (Get Single)
51. Write failing test: Get widget by ID
52. Implement basic GET [id] route (GREEN)
53. Write failing test: Include license info
54. Implement license join (GREEN)
55. Write failing tests: Authorization errors
56. Implement ownership check (GREEN)
57. Write failing tests: Not found errors
58. Implement error handling (GREEN)
59. Refactor route logic

---

### Week 3: API Endpoints Part 2 (UPDATE, DELETE, DEPLOY)

#### Day 8: PATCH /api/widgets/[id] (Update)
60. Write failing test: Update widget name
61. Implement basic PATCH route (GREEN)
62. Write failing test: Update widget config (partial)
63. Implement config merging (GREEN)
64. Write failing test: Update widget status
65. Implement status update logic (GREEN)
66. Write failing test: Version increment
67. Implement version tracking (GREEN)
68. Write failing test: deployedAt auto-set
69. Implement deployedAt logic (GREEN)
70. Write failing tests: Validation errors
71. Implement validation (GREEN)
72. Refactor route logic

#### Day 9: DELETE /api/widgets/[id] (Soft Delete)
73. Write failing test: Soft delete widget
74. Implement DELETE route (GREEN)
75. Write failing test: Data preserved after delete
76. Verify soft delete behavior (GREEN)
77. Write failing test: Widget count after delete
78. Verify count logic (GREEN)
79. Write failing tests: Authorization errors
80. Implement authorization (GREEN)
81. Refactor route logic

#### Day 10: POST /api/widgets/[id]/deploy (Deploy)
82. Write failing test: Deploy widget with valid config
83. Implement basic deploy route (GREEN)
84. Write failing test: Deployment validation (strict)
85. Implement strict validation (GREEN)
86. Write failing test: deployedAt timestamp
87. Implement timestamp logic (GREEN)
88. Write failing test: Activate paused widget
89. Implement activation logic (GREEN)
90. Write failing tests: Validation errors (empty webhookUrl, etc.)
91. Implement error handling (GREEN)
92. Refactor route logic

---

### Week 4: Public Embed Endpoint & Final Testing

#### Day 11-12: GET /api/widgets/[id]/embed (Public)
93. Write failing test: Embed returns config for active widget
94. Implement basic embed route (GREEN)
95. Write failing test: Domain validation
96. Implement license validation logic (GREEN)
97. Write failing test: Widget status checks
98. Implement status/deployment checks (GREEN)
99. Write failing test: License expiration check
100. Implement license validation (GREEN)
101. Write failing tests: Unauthorized domain
102. Implement domain validation (GREEN)
103. Write failing tests: Inactive/deleted widgets
104. Implement widget state checks (GREEN)
105. Refactor route logic

#### Day 13-14: Integration Testing & Refinement
106. Run all integration tests
107. Fix any failing tests
108. Test authorization logic across all endpoints
109. Test tier restrictions across all endpoints
110. Test error handling consistency
111. Performance testing (query optimization)
112. Security review (authorization, validation)
113. Code review and refactor

---

### Implementation Summary

**Total Implementation Steps:** 113
**Estimated Timeline:** 4 weeks (with TDD discipline)
**Average:** 5-6 tests per day

**RED → GREEN → REFACTOR Cycle:**
- Write failing test first (RED)
- Write minimal code to pass test (GREEN)
- Refactor for quality (REFACTOR)
- Commit after each GREEN or REFACTOR
- Never skip tests or write code without tests first

---

## Risk Assessment

### High-Priority Risks

#### Risk 1: Widget Count Race Condition
**Description:** Concurrent widget creation could bypass tier limits
**Likelihood:** Medium
**Impact:** Low (MVP acceptable, fix post-launch)
**Mitigation:**
- Document known limitation
- Consider database-level constraint (trigger or check) for production
- Low priority for MVP (unlikely user scenario)

#### Risk 2: Large Config Performance
**Description:** Very large JSONB configs (>1MB) could slow queries
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Add config size validation (e.g., max 500KB JSON)
- Monitor query performance
- GIN index on JSONB config field already in place

#### Risk 3: Public Embed Endpoint Abuse
**Description:** Public endpoint could be abused for DoS or data mining
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Rate limiting (10 req/sec per IP)
- Cache responses (CDN or Redis)
- Monitor traffic patterns
- Require domain parameter (prevents mass scraping)

#### Risk 4: Config Merging Bugs
**Description:** Deep merge logic could introduce bugs (array merging, null handling)
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Comprehensive unit tests for merging logic
- Use `structuredClone` for immutability
- Handle arrays explicitly (replace, don't merge)
- Document expected merge behavior

---

### Medium-Priority Risks

#### Risk 5: Incomplete Deployment Validation
**Description:** Widget deployed with incomplete config could break embed
**Likelihood:** Low (strict validation)
**Impact:** High
**Mitigation:**
- Strict validation with `allowDefaults=false`
- Explicitly check webhookUrl non-empty
- Test deployment endpoint thoroughly
- Frontend UI guides users to complete config

#### Risk 6: Soft Delete Data Bloat
**Description:** Soft-deleted widgets accumulate over time
**Likelihood:** High (by design)
**Impact:** Low
**Mitigation:**
- Hard delete after 90 days (future enhancement)
- Monitor database size
- Exclude deleted widgets from queries by default

---

### Low-Priority Risks

#### Risk 7: Pagination Edge Cases
**Description:** Edge cases with page boundaries, total counts
**Likelihood:** Low
**Impact:** Low
**Mitigation:**
- Test pagination thoroughly
- Handle empty results gracefully
- Cap max page size (100)

#### Risk 8: License Tier Changes
**Description:** User upgrades/downgrades tier mid-use
**Likelihood:** Low (not implemented yet)
**Impact:** Medium
**Mitigation:**
- Document tier change behavior for Phase 4
- Grandfathering logic for downgrades
- Not in scope for this module

---

## Appendix: Request/Response Examples

### Example 1: Create Widget (Minimal)

**Request:**
```bash
POST /api/widgets
Content-Type: application/json
Cookie: auth_token=<JWT>

{
  "licenseId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Homepage Chat"
}
```

**Response:** `201 Created`
```json
{
  "widget": {
    "id": "98765432-e89b-12d3-a456-426614174111",
    "licenseId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Homepage Chat",
    "status": "active",
    "config": {
      "branding": {
        "companyName": "My Company",
        "welcomeText": "Welcome! How can we help you today?",
        "logoUrl": null,
        "responseTimeText": "Typically replies within minutes",
        "firstMessage": "Hello! How can I assist you today?",
        "inputPlaceholder": "Type your message...",
        "launcherIcon": "chat",
        "customLauncherIconUrl": null,
        "brandingEnabled": true
      },
      "theme": { /* default theme */ },
      "advancedStyling": { /* disabled for basic */ },
      "behavior": { /* default behavior */ },
      "connection": {
        "webhookUrl": "",
        "route": null,
        "timeoutSeconds": 30
      },
      "features": { /* default features */ }
    },
    "version": 1,
    "deployedAt": null,
    "createdAt": "2025-11-10T12:00:00.000Z",
    "updatedAt": "2025-11-10T12:00:00.000Z"
  }
}
```

---

### Example 2: Create Widget (With Partial Config)

**Request:**
```bash
POST /api/widgets
Content-Type: application/json
Cookie: auth_token=<JWT>

{
  "licenseId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Support Widget",
  "config": {
    "branding": {
      "companyName": "Acme Corp",
      "welcomeText": "Welcome to Acme support!"
    },
    "theme": {
      "colors": {
        "primary": "#FF5733"
      }
    },
    "connection": {
      "webhookUrl": "https://n8n.example.com/webhook/chat"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "widget": {
    "id": "98765432-e89b-12d3-a456-426614174222",
    "licenseId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Support Widget",
    "status": "active",
    "config": {
      "branding": {
        "companyName": "Acme Corp",           // User override
        "welcomeText": "Welcome to Acme support!", // User override
        "logoUrl": null,                      // Default
        "responseTimeText": "Typically replies within minutes", // Default
        // ... rest defaults
      },
      "theme": {
        "colors": {
          "primary": "#FF5733",               // User override
          "secondary": "#818CF8",             // Default
          // ... rest defaults
        },
        // ... rest defaults
      },
      "connection": {
        "webhookUrl": "https://n8n.example.com/webhook/chat", // User override
        "route": null,                        // Default
        "timeoutSeconds": 30                  // Default
      },
      // ... rest defaults
    },
    "version": 1,
    "deployedAt": null,
    "createdAt": "2025-11-10T12:05:00.000Z",
    "updatedAt": "2025-11-10T12:05:00.000Z"
  }
}
```

---

### Example 3: Update Widget (Partial Config Update)

**Request:**
```bash
PATCH /api/widgets/98765432-e89b-12d3-a456-426614174222
Content-Type: application/json
Cookie: auth_token=<JWT>

{
  "config": {
    "theme": {
      "colors": {
        "primary": "#4F46E5"
      }
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "widget": {
    "id": "98765432-e89b-12d3-a456-426614174222",
    "licenseId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Support Widget",
    "status": "active",
    "config": {
      "branding": { /* unchanged */ },
      "theme": {
        "colors": {
          "primary": "#4F46E5",      // Updated
          "secondary": "#818CF8",    // Unchanged
          // ... rest unchanged
        },
        // ... rest unchanged
      },
      "connection": { /* unchanged */ },
      // ... rest unchanged
    },
    "version": 2,                    // Incremented
    "deployedAt": null,
    "createdAt": "2025-11-10T12:05:00.000Z",
    "updatedAt": "2025-11-10T12:10:00.000Z"  // Updated
  }
}
```

---

### Example 4: Deploy Widget

**Request:**
```bash
POST /api/widgets/98765432-e89b-12d3-a456-426614174222/deploy
Cookie: auth_token=<JWT>
```

**Response:** `200 OK`
```json
{
  "message": "Widget deployed successfully",
  "widget": {
    "id": "98765432-e89b-12d3-a456-426614174222",
    "status": "active",
    "deployedAt": "2025-11-10T12:15:00.000Z",
    "version": 2
  }
}
```

---

### Example 5: Deploy Widget (Error - Empty Webhook URL)

**Request:**
```bash
POST /api/widgets/98765432-e89b-12d3-a456-426614174111/deploy
Cookie: auth_token=<JWT>
```

**Response:** `400 Bad Request`
```json
{
  "error": "Widget configuration is not ready for deployment",
  "details": [
    {
      "path": ["connection", "webhookUrl"],
      "message": "Webhook URL is required for deployment"
    }
  ]
}
```

---

### Example 6: List Widgets (Paginated)

**Request:**
```bash
GET /api/widgets?page=1&limit=10&includeDeleted=false
Cookie: auth_token=<JWT>
```

**Response:** `200 OK`
```json
{
  "widgets": [
    {
      "id": "uuid1",
      "licenseId": "license-uuid-1",
      "name": "Homepage Chat",
      "status": "active",
      "config": { /* full config */ },
      "version": 3,
      "deployedAt": "2025-11-10T...",
      "createdAt": "2025-11-10T...",
      "updatedAt": "2025-11-10T...",
      "license": {
        "id": "license-uuid-1",
        "tier": "pro",
        "status": "active"
      }
    },
    // ... 9 more widgets
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### Example 7: Embed Widget (Public)

**Request:**
```bash
GET /api/widgets/98765432-e89b-12d3-a456-426614174222/embed?domain=example.com
```

**Response:** `200 OK`
```json
{
  "config": {
    "branding": { /* full branding config */ },
    "theme": { /* full theme config */ },
    "advancedStyling": { /* full advanced styling config */ },
    "behavior": { /* full behavior config */ },
    "connection": {
      "webhookUrl": "https://n8n.example.com/webhook/chat",
      "route": null,
      "timeoutSeconds": 30
    },
    "features": { /* full features config */ }
  },
  "version": 2,
  "licenseKey": "abc123def456..."
}
```

---

### Example 8: Embed Widget (Error - Domain Not Authorized)

**Request:**
```bash
GET /api/widgets/98765432-e89b-12d3-a456-426614174222/embed?domain=unauthorized.com
```

**Response:** `403 Forbidden`
```json
{
  "error": "Domain not authorized for this license"
}
```

---

## Summary

This comprehensive design document provides:

1. **7 API Endpoints:** Complete specifications with request/response formats
2. **12 Database Query Functions:** Full implementation details
3. **4 Validation Schemas:** Request body validation with Zod
4. **5 Helper Functions:** Authorization, merging, validation utilities
5. **Complete File Structure:** 14 new files, 2 modified files
6. **Comprehensive Error Scenarios:** 30+ edge cases documented
7. **Test Strategy:** 110 tests across 9 test files
8. **Implementation Order:** 113 steps over 4 weeks (TDD discipline)
9. **Risk Assessment:** High/medium/low priority risks with mitigations

**Estimated Deliverables:**
- **API Endpoints:** 7
- **Database Queries:** 12
- **Helper Functions:** 5
- **Tests:** 110
- **Timeline:** 4 weeks (strict TDD)

**Next Steps:**
1. Review and approve this design document
2. Begin Week 1 implementation (database queries & helpers)
3. Follow TDD discipline (RED → GREEN → REFACTOR)
4. Track progress in `docs/development/PROGRESS.md`
5. Log architectural decisions in `docs/development/decisions.md`

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Status:** Ready for Implementation

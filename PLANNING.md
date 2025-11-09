# N8n Widget Designer Platform - Planning Documentation

**Last Updated:** November 8, 2025
**Phase:** Phase 2 - License Management System
**Status:** Planning Complete, Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [Project Constraints](#project-constraints)
5. [Naming Conventions](#naming-conventions)
6. [File Structure Rules](#file-structure-rules)
7. [Current Phase: License Management](#current-phase-license-management)

---

## Overview

### Project Mission

Build a production-ready SaaS platform that enables users to visually design, purchase, and deploy embeddable chat widgets for N8n workflows.

### Core Values

- **Test-Driven Development (TDD)**: No production code without failing tests first
- **Type Safety**: Full TypeScript coverage, no `any` types without justification
- **Security First**: Authentication, authorization, input validation on all endpoints
- **Performance**: Widget <50KB gzipped, APIs <200ms p95
- **Modularity**: Single-purpose modules, ideal 200-400 LOC, hard cap 600 LOC

---

## Architecture Principles

### Backend-First Strategy

We build backend APIs before frontend to ensure:

1. Stable API contracts before UI development
2. Backend logic testable independently
3. Clean separation of concerns
4. Future-proof for multiple frontends (web, mobile, CLI)

### Test-Driven Development (TDD)

**RED → GREEN → REFACTOR Workflow:**

1. **RED**: Write a failing test that defines desired behavior
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code while keeping tests green

**Test Types:**

- **Unit Tests**: Pure functions, utilities, business logic (isolated, no DB/network)
- **Integration Tests**: API endpoints, database operations (real dependencies or test DB)
- **E2E Tests**: Complete user flows (Playwright, later phases)

### Module Size & Cohesion

**Guidelines:**

- **Ideal Size**: 200-400 lines of code per file
- **Hard Cap**: 600 lines (trigger refactor/split)
- **Cohesion**: Each file has ONE clear responsibility
- **Coupling**: Minimize dependencies between modules

**When to Split:**

- File exceeds 400 LOC
- Multiple unrelated concerns in one file
- Testing becomes difficult due to complexity
- Function count exceeds 10-12 in a single file

---

## Technology Stack

### Backend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Neon Postgres (via Vercel)
- **ORM**: Drizzle ORM
- **Authentication**: JWT (jose library) + bcrypt
- **Validation**: Zod schemas
- **Testing**: Vitest (unit + integration)

### Frontend (Phase 4)

- **Framework**: React (via Next.js)
- **State**: Zustand
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS

### External Services

- **Payments**: Stripe (subscriptions + webhooks)
- **Email**: SendGrid
- **Deployment**: Vercel
- **Monitoring**: Sentry (Phase 6)

### Widget (Phase 3)

- **Language**: Vanilla TypeScript
- **Build**: Vite (IIFE format)
- **Minification**: Terser
- **Target**: ES2020

---

## Project Constraints

### Security Constraints

1. **No Plaintext Secrets**: All secrets in environment variables
2. **HTTP-Only Cookies**: JWT tokens never in localStorage
3. **Input Validation**: Zod schemas on all API inputs
4. **SQL Injection**: Use parameterized queries (Drizzle ORM only)
5. **Authorization**: Check user ownership on all resource access
6. **Rate Limiting**: Implement on auth endpoints (Phase 5)

### Performance Constraints

1. **API Response Time**: <200ms p95 for all endpoints
2. **Widget Bundle Size**: <50KB gzipped
3. **Widget Load Time**: <100ms p95
4. **Preview Latency**: <100ms config updates
5. **Database Queries**: Use indexes, avoid N+1 queries

### Code Quality Constraints

1. **Test Coverage**: 80%+ for critical paths
2. **Type Safety**: No `any` without explicit justification comment
3. **Error Handling**: All errors logged and user-friendly messages returned
4. **Documentation**: Every file has purpose/responsibility comment at top
5. **Linting**: ESLint + Prettier, no warnings allowed

### Data Constraints

1. **License Keys**: 32-character hex strings (crypto.randomBytes)
2. **Domain Limits**: Basic/Pro = 1, Agency = unlimited (-1)
3. **File Uploads**: Max 50MB (Phase 4)
4. **Config Size**: Max 100KB JSONB (reasonable limit)
5. **Session Storage**: Max 200 messages in widget localStorage

---

## Naming Conventions

### Files & Directories

**Format**: `kebab-case` for all files

```
lib/license/validate.ts          ✅ Good
lib/license/licenseValidator.ts  ❌ Bad (camelCase)
lib/license/Validate.ts          ❌ Bad (PascalCase)
```

**API Routes**: Follow Next.js conventions

```
app/api/licenses/route.ts            ✅ Good (list/create)
app/api/licenses/[id]/route.ts       ✅ Good (get/update/delete)
app/api/widget/[license]/[file]/route.ts  ✅ Good (dynamic segments)
```

**Test Files**: Mirror source path with `.test.ts` suffix

```
lib/license/validate.ts              → tests/unit/license/validate.test.ts
app/api/licenses/route.ts            → tests/integration/api/licenses.test.ts
```

### Functions

**Format**: `camelCase`, descriptive verb-noun pairs

```typescript
// ✅ Good
async function getUserLicenses(userId: string): Promise<License[]>
async function validateLicense(key: string, domain: string): Promise<ValidationResult>
function normalizeDomain(domain: string): string
function generateLicenseKey(): string

// ❌ Bad
async function licenses(userId: string)        // Missing verb
async function validate(key: string)           // Too generic
function Normalize(domain: string)             // PascalCase
function generate_key()                        // snake_case
```

### Variables & Constants

**Variables**: `camelCase`

```typescript
const licenseKey = generateLicenseKey();
const normalizedDomain = normalizeDomain(domain);
```

**Constants**: `SCREAMING_SNAKE_CASE` for true constants

```typescript
const MAX_LICENSE_KEY_LENGTH = 32;
const DEFAULT_DOMAIN_LIMIT = 1;
const JWT_EXPIRATION_DAYS = 7;
```

**Types/Interfaces**: `PascalCase`

```typescript
interface ValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
}

type LicenseTier = 'basic' | 'pro' | 'agency';
```

### Database

**Tables**: `snake_case` (Drizzle convention)

```typescript
export const licenses = pgTable('licenses', { ... });
export const widget_configs = pgTable('widget_configs', { ... });
```

**Columns**: `camelCase` in code, `snake_case` in DB

```typescript
export const licenses = pgTable('licenses', {
  licenseKey: varchar('license_key', { length: 32 }),  // Maps camelCase to snake_case
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
});
```

---

## File Structure Rules

### Directory Organization

```
n8n-widget-designer/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (backend)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── licenses/             # License management endpoints
│   │   ├── config/               # Widget configuration endpoints
│   │   ├── stripe/               # Payment endpoints
│   │   └── widget/               # Widget serving endpoints
│   ├── (marketing)/              # Public pages (landing, pricing)
│   └── (app)/                    # Protected pages (dashboard, configurator)
│
├── lib/                          # Shared business logic
│   ├── auth/                     # Authentication utilities
│   │   ├── jwt.ts                # JWT signing/verification
│   │   ├── password.ts           # Password hashing/verification
│   │   └── middleware.ts         # Auth middleware (requireAuth, etc.)
│   ├── db/                       # Database layer
│   │   ├── client.ts             # Database connection
│   │   ├── schema.ts             # Table definitions
│   │   └── queries.ts            # Query functions
│   ├── license/                  # License logic
│   │   ├── generate.ts           # License key generation
│   │   └── validate.ts           # License validation
│   ├── validation/               # Zod schemas
│   │   ├── license-schema.ts     # License API validation
│   │   └── config-schema.ts      # Widget config validation
│   ├── stripe/                   # Stripe integration (Phase 2)
│   ├── email/                    # Email system (Phase 2)
│   └── utils/                    # Shared utilities
│       └── api-error.ts          # Error handling
│
├── tests/                        # Test files
│   ├── unit/                     # Unit tests (isolated)
│   │   ├── auth/
│   │   ├── license/
│   │   └── validation/
│   ├── integration/              # Integration tests (with dependencies)
│   │   └── api/
│   ├── e2e/                      # End-to-end tests (Phase 5)
│   ├── mocks/                    # Test mocks/fixtures
│   └── setup.ts                  # Test environment setup
│
├── widget/                       # Embeddable widget (Phase 3)
│   ├── src/
│   └── vite.config.ts
│
├── public/                       # Static assets
│   └── widget/                   # Compiled widget files
│
├── scripts/                      # Utility scripts
│   └── seed.ts                   # Database seeding
│
├── .env.local                    # Local environment variables
├── .env.example                  # Example environment variables
├── drizzle.config.ts             # Drizzle ORM config
├── vitest.config.ts              # Test configuration
└── package.json
```

### File Responsibility Rules

**Each file should have ONE clear purpose:**

1. **Utility Modules** (`lib/*/`)
   - Pure functions when possible
   - Clear input → output transformations
   - No side effects unless necessary
   - Export functions, not classes (prefer functional style)

2. **API Routes** (`app/api/*/route.ts`)
   - Handle HTTP requests/responses
   - Validate input with Zod
   - Call business logic from `lib/`
   - Return standardized JSON responses
   - Keep thin (delegate to lib/)

3. **Database Queries** (`lib/db/queries.ts`)
   - CRUD operations only
   - Type-safe with Drizzle
   - Return null for not found (don't throw)
   - Use transactions for multi-step operations

4. **Validation Schemas** (`lib/validation/*`)
   - Zod schema definitions only
   - Export schemas and inferred types
   - Reusable across API routes

### Import Path Rules

**Use absolute imports via `@/` alias:**

```typescript
// ✅ Good
import { signJWT } from '@/lib/auth/jwt';
import { getUserLicenses } from '@/lib/db/queries';

// ❌ Bad
import { signJWT } from '../../../lib/auth/jwt';
import { getUserLicenses } from '../../db/queries';
```

**Import Order:**

1. External dependencies (node modules)
2. Internal absolute imports (`@/`)
3. Types/interfaces
4. Blank line between groups

```typescript
// External
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Internal
import { requireAuth } from '@/lib/auth/middleware';
import { getLicenseById } from '@/lib/db/queries';

// Types
import type { License } from '@/lib/db/schema';
```

---

## Current Phase: License Management

### Date

**November 8, 2025**

### Problem Statement

Implement the license management system that allows users to:

1. Generate unique license keys for purchased widgets
2. Validate license keys against authorized domains
3. Manage licenses via API (list, view, update domains, delete)
4. Ensure domain authorization works correctly (with normalization)

### Constraints

- License keys MUST be cryptographically secure (crypto.randomBytes)
- Domain validation MUST be case-insensitive and handle www/ports
- Domain limits enforced: Basic/Pro = 1 domain, Agency = unlimited
- Users can ONLY access their own licenses (authorization checks)
- All operations MUST be tested before implementation (TDD)

### Assumptions

- Database schema already exists (Phase 1 complete)
- Query functions exist but may need enhancement
- Authentication middleware is functional
- 169 passing tests from Phase 1

### Proposed Design

**Component Breakdown:**

```
lib/license/
  ├── generate.ts            # License key generation
  │   └── generateLicenseKey(): string
  │
  └── validate.ts            # License validation
      ├── validateLicense(key, domain): Promise<ValidationResult>
      └── normalizeDomain(domain): string

lib/validation/
  └── license-schema.ts      # API request validation
      ├── UpdateDomainsSchema
      └── CreateLicenseSchema (future)

app/api/licenses/
  ├── route.ts               # GET (list), POST (create - future)
  └── [id]/
      └── route.ts           # GET (single), PUT (update domains), DELETE (cancel)
```

**Data Flow:**

1. **License Generation** (Stripe webhook → createLicense)
   - Webhook receives checkout.session.completed
   - Extracts metadata (userId, tier, domain)
   - Calls generateLicenseKey() to create unique key
   - Stores license in database with createLicense()

2. **License Validation** (Widget serving → validateLicense)
   - Widget request comes with license key in URL
   - Extract domain from referer header
   - Call validateLicense(key, domain)
   - Return widget code if valid, error if invalid

3. **License Management** (Dashboard → API routes)
   - User lists licenses: GET /api/licenses
   - User views single license: GET /api/licenses/:id
   - User updates domains: PUT /api/licenses/:id
   - User cancels license: DELETE /api/licenses/:id

**External Boundaries:**

- **Database**: Drizzle ORM queries (existing)
- **Stripe**: Webhook events (Phase 2 - after license system)
- **Widget Serving**: /api/widget/:license/chat-widget.js (Phase 3)

### Risks & Mitigations

**Risk 1**: License key collisions (duplicate keys)

- **Mitigation**: Use crypto.randomBytes(16) = 2^128 combinations, add DB unique constraint, retry on collision

**Risk 2**: Domain normalization edge cases

- **Mitigation**: Comprehensive tests for www, ports, subdomains, uppercase/lowercase

**Risk 3**: Authorization bypass

- **Mitigation**: Always check license.userId === authenticatedUser.sub before allowing operations

**Risk 4**: Module size exceeds limits

- **Mitigation**: Keep validate.ts focused (validation only), separate helper functions if needed

---

## November 8, 2025 - Phase 2 License System Design

### Implementation Order (TDD)

**Module 1: License Key Generation** (Start Here)

1. Test: generateLicenseKey returns 32-char hex string
2. Test: Keys are unique (multiple calls return different values)
3. Test: Keys use crypto.randomBytes (not Math.random)
4. Implementation: lib/license/generate.ts

**Module 2: Domain Normalization** (Helper for Validation)

1. Test: Lowercase conversion (Example.com → example.com)
2. Test: www prefix removal (www.example.com → example.com)
3. Test: Port stripping (example.com:3000 → example.com)
4. Test: Localhost handling (localhost:3000 → localhost)
5. Implementation: normalizeDomain() in lib/license/validate.ts

**Module 3: License Validation** (Core Logic)

1. Test: Valid license with matching domain returns success
2. Test: Nonexistent license returns error
3. Test: Inactive/expired/cancelled license returns error
4. Test: Wrong domain returns error
5. Test: Domain normalization applied correctly
6. Implementation: validateLicense() in lib/license/validate.ts

**Module 4: API Validation Schemas** (Input Validation)

1. Define UpdateDomainsSchema (Zod)
2. Test schema with valid domains array
3. Test schema with invalid inputs
4. Implementation: lib/validation/license-schema.ts

**Module 5: License API Endpoints** (Integration)

1. GET /api/licenses - List user licenses
   - Test: Returns user's licenses only
   - Test: Requires authentication
   - Test: Empty array if no licenses
2. GET /api/licenses/:id - Get single license
   - Test: Returns license if owned by user
   - Test: 403 if not owned by user
   - Test: 404 if license doesn't exist
3. PUT /api/licenses/:id - Update domains
   - Test: Updates domains successfully
   - Test: Validates domain limit (reject if over limit)
   - Test: 403 if not owned by user
4. DELETE /api/licenses/:id - Cancel license
   - Test: Sets status to 'cancelled'
   - Test: 403 if not owned by user

### Test Strategy

**Unit Tests** (No DB, pure logic)

- lib/license/generate.ts → tests/unit/license/generate.test.ts
- normalizeDomain() → tests/unit/license/validate.test.ts (domain normalization suite)

**Integration Tests** (Real DB or test DB)

- validateLicense() → tests/integration/license/validate.test.ts (requires DB)
- API routes → tests/integration/api/licenses/*.test.ts

**Test Naming Convention:**

```typescript
describe('generateLicenseKey', () => {
  it('should generate 32-character hexadecimal string', () => { ... });
  it('should generate unique keys on multiple calls', () => { ... });
});

describe('normalizeDomain', () => {
  it('should convert domain to lowercase', () => { ... });
  it('should remove www prefix', () => { ... });
  it('should strip port numbers', () => { ... });
  it('should handle localhost correctly', () => { ... });
});

describe('validateLicense', () => {
  it('should return valid=true for active license with matching domain', () => { ... });
  it('should return valid=false for expired license', () => { ... });
  it('should normalize domain before validation', () => { ... });
});
```

### Security Considerations

1. **License Key Randomness**
   - Use crypto.randomBytes (cryptographically secure)
   - Never use Math.random() or timestamps
   - Test: Verify generated keys are unpredictable

2. **Domain Validation Bypasses**
   - Normalize domains to prevent case/www tricks
   - Block IP addresses if domain whitelist is used
   - Test: Try bypassing with www.Example.COM

3. **Authorization Checks**
   - ALWAYS verify license.userId === authenticatedUser.sub
   - Test: Attempt to access another user's license (expect 403)

4. **Rate Limiting** (Phase 5)
   - Not in scope for Phase 2, but plan for it
   - Consider: Max 10 license validations/second per license key

### Interface Contracts

**lib/license/generate.ts:**

```typescript
/**
 * Generate a unique, cryptographically secure license key
 *
 * Returns: 32-character hexadecimal string
 * Security: Uses crypto.randomBytes(16)
 * Uniqueness: Caller must check DB for collisions and retry if needed
 */
export function generateLicenseKey(): string;
```

**lib/license/validate.ts:**

```typescript
/**
 * Normalize a domain for comparison
 *
 * Rules:
 * - Convert to lowercase
 * - Remove 'www.' prefix
 * - Remove port numbers
 *
 * Examples:
 *   "Example.com" → "example.com"
 *   "www.Example.com" → "example.com"
 *   "example.com:3000" → "example.com"
 *   "localhost:8080" → "localhost"
 */
export function normalizeDomain(domain: string): string;

/**
 * Validation result structure
 */
export interface ValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  flags?: {
    brandingEnabled: boolean;
    tier: string;
    domainLimit: number;
  };
}

/**
 * Validate a license key for a specific domain
 *
 * Checks:
 * 1. License exists
 * 2. Status is 'active'
 * 3. Not expired (if expiresAt is set)
 * 4. Domain is in allowed domains (after normalization)
 *
 * Returns: ValidationResult with flags if valid, error message if invalid
 */
export async function validateLicense(
  licenseKey: string,
  domain: string
): Promise<ValidationResult>;
```

**lib/validation/license-schema.ts:**

```typescript
import { z } from 'zod';

/**
 * Schema for updating license domains
 */
export const UpdateDomainsSchema = z.object({
  domains: z.array(z.string().min(1).max(255)).min(1).max(100)
});

export type UpdateDomainsInput = z.infer<typeof UpdateDomainsSchema>;
```

**app/api/licenses/route.ts:**

```typescript
/**
 * GET /api/licenses
 *
 * List all licenses for authenticated user
 *
 * Auth: Required (JWT)
 * Returns: { licenses: License[] }
 * Status: 200 on success
 */
export async function GET(request: NextRequest): Promise<Response>;
```

**app/api/licenses/[id]/route.ts:**

```typescript
/**
 * GET /api/licenses/:id
 *
 * Get single license by ID
 *
 * Auth: Required (JWT)
 * Authorization: User must own license
 * Returns: { license: License }
 * Status: 200 on success, 403 if not owned, 404 if not found
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<Response>;

/**
 * PUT /api/licenses/:id
 *
 * Update license domains
 *
 * Auth: Required (JWT)
 * Authorization: User must own license
 * Body: { domains: string[] }
 * Validation: Domain count must not exceed license.domainLimit
 * Returns: { license: License }
 * Status: 200 on success, 400 if validation fails, 403 if not owned
 */
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<Response>;

/**
 * DELETE /api/licenses/:id
 *
 * Cancel a license (soft delete - sets status to 'cancelled')
 *
 * Auth: Required (JWT)
 * Authorization: User must own license
 * Returns: { message: string }
 * Status: 200 on success, 403 if not owned, 404 if not found
 */
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<Response>;
```

---

## Appendix: Decision Log

### Decision 1: Use crypto.randomBytes for License Keys

**Date**: November 8, 2025
**Context**: Need to generate unique, unpredictable license keys
**Decision**: Use Node.js crypto.randomBytes(16).toString('hex') to generate 32-char hex strings
**Rationale**:
- Cryptographically secure (unlike Math.random)
- 2^128 possible values (collision probability negligible)
- Simple to implement and verify
- Standard practice for API keys/tokens
**Alternatives Considered**: UUID v4 (rejected - not URL-friendly), nanoid (rejected - overkill)

### Decision 2: Soft Delete for License Cancellation

**Date**: November 8, 2025
**Context**: Users can cancel licenses via API
**Decision**: Set status='cancelled' instead of deleting row
**Rationale**:
- Preserve historical data for analytics
- Support potential reactivation
- Maintain referential integrity
- Stripe subscription ID still needed for webhook handling
**Alternatives Considered**: Hard delete (rejected - data loss), archived table (rejected - overcomplicated)

### Decision 3: Domain Normalization Rules

**Date**: November 8, 2025
**Context**: Need consistent domain comparison for validation
**Decision**: Lowercase + remove www + strip port
**Rationale**:
- www.Example.com and example.com should be treated as same
- Ports are irrelevant for domain ownership (example.com:3000 = example.com:8080)
- Simplifies user experience (don't need to specify exact port)
**Alternatives Considered**: Exact match (rejected - too strict), regex validation (rejected - complex)

---

**End of Planning Document**

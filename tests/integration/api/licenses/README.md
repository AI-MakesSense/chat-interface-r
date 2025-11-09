# License API Endpoints - Test Suite Summary

## RED Phase Complete

All 42 integration tests have been written and are in proper RED state (failing with "Cannot find module" errors).

## Test Files Created

### 1. `create.test.ts` - POST /api/licenses (14 tests)

**File to implement:** `app/api/licenses/route.ts` (POST handler)

**Valid Scenarios (7 tests):**
- Create Basic tier license
- Create Pro tier license
- Create Agency tier license with multiple domains
- Create license with custom expiresInDays
- Create license with default expiration (365 days)
- Generate unique license keys
- Domain normalization applied

**Invalid Scenarios (6 tests):**
- Reject request without authentication token
- Reject invalid request body (schema validation fails)
- Reject empty domains array
- Reject Basic tier with more than 1 domain
- Reject Pro tier with more than 1 domain
- Reject negative expiresInDays

**Edge Cases (1 test):**
- Calculate expiration date correctly

### 2. `validate.test.ts` - POST /api/licenses/validate (10 tests)

**File to implement:** `app/api/licenses/validate/route.ts` (POST handler)

**Valid Scenarios (3 tests):**
- Validate license for exact domain
- Validate Agency tier license for any domain
- Normalize domain before validation

**Invalid Scenarios (7 tests):**
- Reject invalid license key format
- Reject non-hexadecimal license key
- Return invalid for license not found
- Return invalid for expired license
- Return invalid for domain not authorized
- Reject missing license key
- Reject missing domain

### 3. `update.test.ts` - PATCH /api/licenses/[id] (12 tests)

**File to implement:** `app/api/licenses/[id]/route.ts` (PATCH handler)

**Valid Scenarios (5 tests):**
- Update license domains
- Update license status
- Update license expiresAt
- Update multiple fields at once
- Normalize domains on update

**Invalid Scenarios (7 tests):**
- Reject request without authentication
- Reject update to license not owned by user (403 Forbidden)
- Return 404 for non-existent license
- Reject invalid request body (schema validation fails)
- Reject empty update object
- Reject expiresAt in the past
- Reject empty domains array

### 4. `list.test.ts` - GET /api/licenses (6 tests)

**File to implement:** `app/api/licenses/route.ts` (GET handler)

**Valid Scenarios (4 tests):**
- List all licenses for authenticated user
- Return empty array if user has no licenses
- Return multiple licenses for user with many licenses
- Include all license fields in response

**Invalid Scenarios (2 tests):**
- Reject request without authentication
- Return only licenses owned by authenticated user (not other users')

## Total Test Count: 42 tests

## Implementation Requirements

### POST /api/licenses (Create License)

**Route file:** `app/api/licenses/route.ts`

**Implementation checklist:**
1. Export `POST` async function accepting `NextRequest`
2. Call `requireAuth(request)` to get authenticated user
3. Parse and validate request body with `createLicenseSchema`
4. Generate license key using `generateLicenseKey()`
5. Normalize domains using `normalizeDomain()` for each domain
6. Calculate expiration date: `new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)`
7. Set tier-specific properties:
   - Basic/Pro: `domainLimit: 1`, `brandingEnabled: true/false`
   - Agency: `domainLimit: -1`, `brandingEnabled: false`
8. Insert license into database using Drizzle ORM
9. Return `{ license: {...} }` with status 201

**Error handling:**
- 401 if `requireAuth` throws
- 400 if schema validation fails

### POST /api/licenses/validate (Validate License)

**Route file:** `app/api/licenses/validate/route.ts`

**Implementation checklist:**
1. Export `POST` async function accepting `NextRequest`
2. NO authentication required (public endpoint)
3. Parse and validate request body with `validateLicenseSchema`
4. Call `validateLicense(licenseKey, domain)` from `@/lib/license/validate`
5. Return validation result: `{ valid: boolean, reason?: string, license?: {...} }`
6. Always return status 200 (even for invalid licenses)

**Error handling:**
- 400 if schema validation fails

### PATCH /api/licenses/[id] (Update License)

**Route file:** `app/api/licenses/[id]/route.ts`

**Implementation checklist:**
1. Export `PATCH` async function accepting `(request: NextRequest, context: { params: Promise<{ id: string }> })`
2. Await `params` to get `id`: `const { id } = await context.params`
3. Call `requireAuth(request)` to get authenticated user
4. Parse and validate request body with `updateLicenseSchema`
5. Query database to fetch license by id
6. Verify license exists (404 if not)
7. Verify license belongs to authenticated user (403 if not)
8. Normalize domains if provided in update
9. Update license in database with provided fields
10. Return `{ license: {...} }` with status 200

**Error handling:**
- 401 if `requireAuth` throws
- 400 if schema validation fails
- 404 if license not found
- 403 if license doesn't belong to user

### GET /api/licenses (List Licenses)

**Route file:** `app/api/licenses/route.ts`

**Implementation checklist:**
1. Export `GET` async function accepting `NextRequest`
2. Call `requireAuth(request)` to get authenticated user
3. Query database for all licenses where `userId = authenticatedUserId`
4. Return `{ licenses: [...] }` with status 200

**Error handling:**
- 401 if `requireAuth` throws

## Dependencies Used in Tests

All tests mock these dependencies:
- `@/lib/db/client` - Database client (Drizzle ORM)
- `@/lib/auth/middleware` - Authentication helpers (`requireAuth`)
- `@/lib/license/generate` - License key generation
- `@/lib/license/domain` - Domain normalization
- `@/lib/license/validate` - License validation logic
- `@/lib/api/schemas` - Zod validation schemas

## Next Steps for Implementer

1. Create directory structure: `app/api/licenses/`
2. Implement `app/api/licenses/route.ts` with POST and GET handlers
3. Implement `app/api/licenses/validate/route.ts` with POST handler
4. Create `app/api/licenses/[id]/` directory
5. Implement `app/api/licenses/[id]/route.ts` with PATCH handler
6. Run tests: `npm test -- tests/integration/api/licenses`
7. Verify all 42 tests pass (GREEN state)
8. Handoff to Refactorer for optimization

## Test Execution Result

Status: RED (Expected - route files don't exist yet)

All 4 test files fail with "Cannot find module" errors:
- `tests/integration/api/licenses/create.test.ts` - Cannot find '@/app/api/licenses/route'
- `tests/integration/api/licenses/validate.test.ts` - Cannot find '@/app/api/licenses/validate/route'
- `tests/integration/api/licenses/update.test.ts` - Cannot find '@/app/api/licenses/[id]/route'
- `tests/integration/api/licenses/list.test.ts` - Cannot find '@/app/api/licenses/route'

This is the proper RED state for TDD - tests exist but implementation does not.

# Widget API Routes - Integration Tests Summary

## Overview

This directory contains comprehensive RED phase integration tests for the Widget Management API endpoints (Phase 3, Module 2, Day 4).

**Status:** RED (Tests written, routes NOT implemented yet)

**Total Tests:** 63 integration tests across 4 endpoints

## Test Files

### 1. `create.test.ts` - POST /api/widgets
**Tests:** 20
**Endpoint:** `POST /api/widgets`
**Purpose:** Create new widgets

**Test Categories:**
- ✅ Success scenarios (8 tests)
  - Create with default config (no config provided)
  - Create with custom config (merged with defaults)
  - Create for Basic tier (limit 1)
  - Create for Pro tier (limit 3)
  - Create multiple widgets for Pro tier
  - Create for Agency tier (unlimited)
  - Create 10+ widgets for Agency tier
  - Verify correct defaults (status=active, version=1, deployedAt=null)

- ❌ Authentication failures (1 test)
  - Reject without JWT (401)

- ❌ Validation failures (5 tests)
  - Reject invalid licenseId format (400)
  - Reject non-existent licenseId (404)
  - Reject empty name (400)
  - Reject name > 100 chars (400)
  - Reject invalid config structure (400)

- ❌ Authorization failures (1 test)
  - Reject license owned by different user (403)

- ❌ Widget limit enforcement (2 tests)
  - Reject when Basic tier limit exceeded (403)
  - Reject when Pro tier limit exceeded (403)

- ✅ Config merging verification (2 tests)
  - Properly merge partial config with defaults
  - Verify id, createdAt, updatedAt timestamps

---

### 2. `list.test.ts` - GET /api/widgets
**Tests:** 15
**Endpoint:** `GET /api/widgets?licenseId={id}&includeDeleted={bool}&page={n}&limit={n}`
**Purpose:** List widgets with pagination

**Test Categories:**
- ✅ Success scenarios - Basic listing (4 tests)
  - Return empty array for user with no widgets
  - Return all user widgets across multiple licenses
  - Include license info with each widget
  - Order by createdAt DESC (newest first)

- ✅ License filtering (2 tests)
  - Filter by licenseId when provided
  - Reject licenseId filter for different user (403)

- ✅ Deleted widget handling (2 tests)
  - Exclude deleted widgets by default
  - Include deleted widgets when includeDeleted=true

- ✅ Pagination (4 tests)
  - Paginate correctly (page 1, default limit 20)
  - Respect custom limit parameter
  - Return correct page 2 results
  - Return correct pagination metadata

- ❌ Authentication failures (1 test)
  - Reject without authentication (401)

- ✅ Edge cases (2 tests)
  - Handle invalid page parameter gracefully
  - Handle page beyond total pages

---

### 3. `get.test.ts` - GET /api/widgets/[id]
**Tests:** 10
**Endpoint:** `GET /api/widgets/{id}`
**Purpose:** Get single widget by ID

**Test Categories:**
- ✅ Success scenarios (4 tests)
  - Return widget with full config for owner
  - Return widget with license info attached
  - Return deleted widget (owner can view)
  - Include all widget fields in response

- ❌ Authentication failures (1 test)
  - Reject without authentication (401)

- ❌ Validation failures (1 test)
  - Reject invalid widget ID format (400)

- ❌ Not found (1 test)
  - Return 404 for non-existent widget ID

- ❌ Authorization failures (1 test)
  - Reject widget owned by different user (403)

- ✅ Edge cases (2 tests)
  - Handle empty widget ID gracefully (400)
  - Verify widget config structure is complete

---

### 4. `update.test.ts` - PATCH /api/widgets/[id]
**Tests:** 18
**Endpoint:** `PATCH /api/widgets/{id}`
**Purpose:** Update widget name, config, or status

**Test Categories:**
- ✅ Success scenarios - Individual field updates (5 tests)
  - Update name successfully
  - Update config with partial merge
  - Update status to 'paused'
  - Update status to 'active'
  - Update multiple fields at once (name + config + status)

- ✅ Version management (3 tests)
  - Increment version when config changes
  - NOT increment version when only name changes
  - NOT increment version when only status changes

- ✅ Deep config merging (1 test)
  - Deep merge config preserving non-updated nested fields

- ✅ Timestamp updates (2 tests)
  - Update updatedAt timestamp
  - NOT change createdAt or id

- ❌ Authentication failures (1 test)
  - Reject without authentication (401)

- ❌ Authorization failures (1 test)
  - Reject widget owned by different user (403)

- ❌ Validation failures (5 tests)
  - Reject invalid widget ID (404)
  - Reject empty name (400)
  - Reject name > 100 chars (400)
  - Reject invalid status value (400)
  - Reject status='deleted' (use DELETE endpoint) (400)
  - Reject invalid config structure (400)

---

## Test Patterns Used

### 1. Sequential Test Execution
All test suites use `describe.sequential()` to prevent race conditions in database operations.

### 2. Proper Cleanup
Each test suite has `beforeAll` and `afterAll` hooks for:
- Creating test users and licenses
- Generating JWT tokens
- Cleaning up all test data (cascade deletes)

### 3. Test Isolation
Each test suite uses unique test run IDs to prevent conflicts:
```typescript
testRunId = `widget-create-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
```

### 4. RED Phase Documentation
Every test includes a comment:
```typescript
// RED: Route doesn't exist yet
```

### 5. Request Pattern
Tests use Next.js Request/Response pattern:
```typescript
const request = new Request('http://localhost:3000/api/widgets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${authToken}`,
  },
  body: JSON.stringify({ ... }),
});

const response = await POST(request);
const data = await response.json();
```

---

## Business Logic Tested

### Widget Limits by Tier
- **Basic:** 1 widget per license
- **Pro:** 3 widgets per license
- **Agency:** Unlimited widgets (tested with 10+)

### Config Merging
- Partial configs are deep-merged with tier-appropriate defaults
- Unspecified fields retain default values
- Nested objects are properly merged (not replaced)

### Version Incrementing
- **Increment:** When `config` field is updated
- **No increment:** When only `name` or `status` is updated

### Status Values
- **Allowed:** 'active', 'paused'
- **Rejected:** 'deleted' (must use DELETE endpoint)

### Authentication & Authorization
- All endpoints require JWT in `auth_token` cookie
- Widget ownership verified via license → user relationship
- License filters must verify ownership

---

## Expected Test Results (RED Phase)

When you run these tests, you should see:

```
❌ All 63 tests FAIL
```

**Failure Reason:** Route handlers don't exist yet:
- `app/api/widgets/route.ts` - POST and GET handlers
- `app/api/widgets/[id]/route.ts` - GET and PATCH handlers

---

## Next Steps (GREEN Phase)

After these tests are written, the Implementer agent will:

1. Create `app/api/widgets/route.ts`
   - Implement POST handler (create widget)
   - Implement GET handler (list widgets with pagination)

2. Create `app/api/widgets/[id]/route.ts`
   - Implement GET handler (get single widget)
   - Implement PATCH handler (update widget)

3. Verify all 63 tests pass

---

## Running the Tests

```bash
# Run all widget API tests
npm test tests/integration/api/widgets

# Run individual test files
npm test tests/integration/api/widgets/create.test.ts
npm test tests/integration/api/widgets/list.test.ts
npm test tests/integration/api/widgets/get.test.ts
npm test tests/integration/api/widgets/update.test.ts
```

---

## Test Coverage

| Endpoint | Success | Auth | Validation | Authorization | Total |
|----------|---------|------|------------|---------------|-------|
| POST /api/widgets | 8 | 1 | 5 | 3 | 20 |
| GET /api/widgets | 10 | 1 | 0 | 1 | 15 |
| GET /api/widgets/[id] | 4 | 1 | 1 | 1 | 10 |
| PATCH /api/widgets/[id] | 11 | 1 | 5 | 1 | 18 |
| **TOTAL** | **33** | **4** | **11** | **6** | **63** |

---

## Key Test Data Setup

### Users
- `testUser` - Owns licenses and widgets
- `otherUser` - Used for authorization failure tests

### Licenses (for testUser)
- `basicLicense` - tier: basic, widgetLimit: 1
- `proLicense` - tier: pro, widgetLimit: 3
- `agencyLicense` - tier: agency, widgetLimit: -1 (unlimited)

### Widgets
Created dynamically in tests based on scenarios being tested.

---

## Notes for Implementer

1. **Widget Limit Enforcement:** Check `countWidgetsForLicense()` before creating
2. **Config Merging:** Use `createDefaultConfig(tier)` as base, deep merge user config
3. **Version Management:** Only increment on config changes, not name/status
4. **Pagination:** Default page=1, limit=20, return metadata
5. **Status Validation:** Only allow 'active' and 'paused' in PATCH (not 'deleted')
6. **Deep Merge Algorithm:** Preserve nested objects when partially updating

---

**Generated:** Phase 3, Module 2, Day 4
**Agent:** TDD-QA-Lead
**Phase:** RED (Tests written, implementation pending)

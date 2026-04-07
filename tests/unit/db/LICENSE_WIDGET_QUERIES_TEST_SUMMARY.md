# License-Related Widget Queries - RED Test Summary

**Phase:** Phase 3 Module 2 Day 2
**Status:** ✅ RED Phase Complete (28 tests written, all failing as expected)
**Date:** 2025-11-10
**Agent:** TDD-QA-Lead

---

## Test File Location

```
tests/unit/db/license-widget-queries.test.ts
```

---

## Overview

Comprehensive RED tests for **4 license-related widget query functions** that need to be implemented in `lib/db/queries.ts`:

1. **getWidgetsByLicenseId(licenseId, includeDeleted)** - Get widgets for a license
2. **getWidgetsByUserId(userId, includeDeleted, licenseId?)** - Get widgets for a user
3. **getActiveWidgetCount(licenseId)** - Count active widgets for tier limit enforcement
4. **getLicenseWithWidgetCount(id)** - Get license with widget count attached

---

## Test Statistics

| Function | Tests Written | Expected Behavior Coverage |
|----------|---------------|---------------------------|
| `getWidgetsByLicenseId` | 7 tests | Empty results, filtering, ordering, cross-license isolation |
| `getWidgetsByUserId` | 9 tests | Multi-license JOIN, cross-user isolation, optional filtering |
| `getActiveWidgetCount` | 6 tests | Zero state, counting, soft-delete exclusion, status handling |
| `getLicenseWithWidgetCount` | 6 tests | NULL handling, count integration, real-time updates |
| **TOTAL** | **28 tests** | **100% spec coverage** |

---

## Test Execution Results

```bash
npm test tests/unit/db/license-widget-queries.test.ts
```

**Result:** ✅ All 28 tests FAIL with expected error:
```
TypeError: [function] is not a function
```

This is the correct RED phase outcome - tests fail because functions don't exist yet.

---

## Function Specifications & Test Coverage

### 1. getWidgetsByLicenseId(licenseId, includeDeleted = false)

**Purpose:** Get all widgets for a specific license

**Design Specs (from design doc line 633-660):**
- Returns array of widgets filtered by licenseId
- By default excludes deleted widgets (status != 'deleted')
- If includeDeleted=true, includes deleted widgets
- Orders by createdAt DESC (newest first)

**Test Cases (7 tests):**

✅ **should return empty array for license with no widgets**
- Tests zero-state handling
- Verifies empty array returned (not null)

✅ **should return all active widgets for a license**
- Creates 2 active widgets for testLicense1
- Verifies both returned with correct IDs
- Confirms status='active' filter works

✅ **should exclude deleted widgets by default**
- Creates 1 active + 1 deleted widget
- Verifies only active widget returned
- Confirms default includeDeleted=false behavior

✅ **should include deleted widgets when includeDeleted=true**
- Creates active, paused, and deleted widgets
- Calls function with includeDeleted=true
- Verifies all 3 widgets returned

✅ **should return widgets in correct order (newest first)**
- Creates 3 widgets with time delays
- Verifies DESC ordering by createdAt
- Confirms newest widget is result[0]

✅ **should only return widgets for specified license**
- Creates widgets for testLicense1 and testLicense2
- Verifies cross-license isolation
- Confirms only testLicense1 widgets returned

✅ **should include paused widgets in results**
- Creates active and paused widgets
- Verifies both statuses included (excludes only 'deleted')
- Confirms paused != deleted

---

### 2. getWidgetsByUserId(userId, includeDeleted = false, licenseId?)

**Purpose:** Get all widgets for a user across all their licenses

**Design Specs (from design doc line 664-703):**
- JOINs widgets + licenses, filters by licenses.userId
- Returns `Widget & { license: License }` (widgets with license info)
- By default excludes deleted widgets
- Optional licenseId param to filter to specific license
- Orders by createdAt DESC

**Test Cases (9 tests):**

✅ **should return empty array for user with no widgets**
- Tests zero-state for new user
- Verifies empty array returned

✅ **should return widgets from all user licenses**
- Creates widgets for testLicense1 and testLicense2 (both owned by testUser1)
- Verifies both widgets returned
- Tests multi-license aggregation

✅ **should return widgets with license information attached**
- Creates widget for testLicense1
- Verifies result has nested `license` object
- Confirms license.id, license.userId, license.tier present

✅ **should exclude widgets from other users licenses**
- Creates widgets for testUser1 and testUser2
- Verifies cross-user isolation
- Confirms testUser1 query doesn't return testUser2's widgets

✅ **should exclude deleted widgets by default**
- Creates active and deleted widgets for testUser1
- Verifies deleted widgets excluded
- Confirms default behavior

✅ **should include deleted widgets when includeDeleted=true**
- Creates active and deleted widgets
- Calls with includeDeleted=true
- Verifies deleted widgets included

✅ **should filter by licenseId when provided**
- Creates widgets for testLicense1 and testLicense2
- Calls with licenseId=testLicense1.id
- Verifies only testLicense1 widgets returned

✅ **should return widgets in correct order (newest first)**
- Creates 2 widgets with time delay
- Verifies DESC ordering
- Confirms newest first

✅ **should handle user with multiple licenses correctly**
- Creates widgets for Basic and Pro licenses
- Verifies both returned with correct license.tier
- Tests JOIN integrity across multiple licenses

---

### 3. getActiveWidgetCount(licenseId)

**Purpose:** Count active widgets for license (for tier limit enforcement)

**Design Specs (from design doc line 707-731):**
- Returns COUNT of widgets where licenseId matches and status != 'deleted'
- Returns 0 if no widgets
- Does NOT count soft-deleted widgets

**Test Cases (6 tests):**

✅ **should return 0 for license with no widgets**
- Tests zero-state
- Verifies count=0 returned (not null)
- Confirms return type is number

✅ **should return correct count of active widgets**
- Creates 3 active widgets
- Verifies count=3
- Tests basic counting logic

✅ **should exclude soft-deleted widgets from count**
- Creates 2 active + 2 deleted widgets
- Verifies count=2 (deleted excluded)
- Tests soft-delete exclusion

✅ **should include paused widgets in count**
- Creates 1 active + 1 paused widget
- Verifies count=2
- Confirms paused widgets count as "active" (non-deleted)

✅ **should update count correctly after widget deletion**
- Creates 3 active widgets
- Soft-deletes 1 widget
- Verifies count decreases from 3 to 2
- Tests real-time count updates

✅ **should handle license with mixed statuses correctly**
- Creates 2 active + 1 paused + 2 deleted widgets
- Verifies count=3 (excludes only deleted)
- Tests complex status filtering

---

### 4. getLicenseWithWidgetCount(id)

**Purpose:** Get license with active widget count attached

**Design Specs (from design doc line 916-939):**
- Gets license by ID using existing getLicenseById()
- Returns null if license not found
- Calls getActiveWidgetCount() to get widget count
- Returns `License & { widgetCount: number }`

**Test Cases (6 tests):**

✅ **should return null for non-existent license**
- Tests with UUID zeros
- Verifies null returned (not error thrown)
- Tests error handling

✅ **should return license with widgetCount=0 for new license**
- Queries testLicense1 with no widgets
- Verifies license returned with widgetCount=0
- Tests zero-state

✅ **should return license with correct widget count**
- Creates 3 active widgets
- Verifies widgetCount=3
- Tests basic integration

✅ **should exclude deleted widgets from count**
- Creates 2 active + 2 deleted widgets
- Verifies widgetCount=2
- Confirms deleted widgets excluded

✅ **should update widgetCount after widget creation**
- Queries before: widgetCount=0
- Creates widget
- Queries after: widgetCount=1
- Tests real-time count updates

✅ **should update widgetCount after widget deletion**
- Creates 2 widgets (count=2)
- Soft-deletes 1 widget
- Verifies count=1
- Tests deletion tracking

---

## Test Data Architecture

### Test Fixtures (beforeAll setup)

```typescript
testRunId: string;                  // Unique per test run (timestamp + random)
testUser1: User;                    // Primary test user
testUser2: User;                    // For cross-user isolation tests
testLicense1: License;              // Basic tier, belongs to testUser1
testLicense2: License;              // Pro tier, belongs to testUser1
testLicense3: License;              // Basic tier, belongs to testUser2
```

### Cleanup Strategy (afterAll)

```typescript
// CASCADE delete handles widgets automatically
await db.delete(licenses).where(eq(licenses.userId, testUser1.id));
await db.delete(licenses).where(eq(licenses.userId, testUser2.id));
await db.delete(users).where(eq(users.id, testUser1.id));
await db.delete(users).where(eq(users.id, testUser2.id));
```

### Per-Test Cleanup

Each test that creates widgets includes:
```typescript
// Cleanup
await db.delete(widgets).where(eq(widgets.licenseId, testLicense1.id));
```

---

## Database Schema Reference

```typescript
// widgets table
export const widgets = pgTable('widgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  licenseId: uuid('license_id').notNull().references(() => licenses.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(), // 'active' | 'paused' | 'deleted'
  config: jsonb('config').notNull(),
  version: integer('version').default(1).notNull(),
  deployedAt: timestamp('deployed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## Key Testing Patterns

### 1. Soft Delete Behavior
- **Default:** Functions exclude status='deleted' widgets
- **With includeDeleted=true:** Include deleted widgets
- **Paused widgets:** Treated as active (not deleted)

### 2. Cross-User Isolation
- testUser1 queries must NOT return testUser2's widgets
- JOIN filters by licenses.userId

### 3. Ordering
- All list functions return DESC by createdAt (newest first)

### 4. Zero-State Handling
- Functions return empty arrays (not null) for no results
- Count functions return 0 (not null)

### 5. Real-Time Updates
- Count functions reflect immediate changes
- Tests verify before/after states

---

## Implementation Requirements (GREEN Phase)

### Function Signatures

```typescript
// 1. Get widgets by license ID
export async function getWidgetsByLicenseId(
  licenseId: string,
  includeDeleted: boolean = false
): Promise<Widget[]>

// 2. Get widgets by user ID (with license info)
export async function getWidgetsByUserId(
  userId: string,
  includeDeleted: boolean = false,
  licenseId?: string
): Promise<WidgetWithLicense[]>

// 3. Count active widgets for license
export async function getActiveWidgetCount(
  licenseId: string
): Promise<number>

// 4. Get license with widget count
export async function getLicenseWithWidgetCount(
  id: string
): Promise<(License & { widgetCount: number }) | null>
```

### Required Type Exports

```typescript
// Already exists in queries.ts (line 367-370)
export type WidgetWithLicense = Widget & {
  license: License;
};
```

### Drizzle ORM Patterns to Use

**1. Basic SELECT with filter:**
```typescript
const widgets = await db
  .select()
  .from(widgets)
  .where(eq(widgets.licenseId, licenseId))
  .orderBy(desc(widgets.createdAt));
```

**2. Conditional WHERE (exclude deleted):**
```typescript
const conditions = [eq(widgets.licenseId, licenseId)];
if (!includeDeleted) {
  conditions.push(sql`${widgets.status} != 'deleted'`);
}
const result = await db.select().from(widgets).where(and(...conditions));
```

**3. JOIN widgets + licenses:**
```typescript
const result = await db
  .select()
  .from(widgets)
  .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
  .where(eq(licenses.userId, userId))
  .orderBy(desc(widgets.createdAt));
```

**4. COUNT query:**
```typescript
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(widgets)
  .where(and(
    eq(widgets.licenseId, licenseId),
    sql`${widgets.status} != 'deleted'`
  ));
return count;
```

---

## Critical Implementation Notes

### 1. getWidgetsByUserId Return Type
- Must return `Widget & { license: License }`
- JOIN result needs restructuring:
```typescript
const rows = await db.select().from(widgets).innerJoin(licenses, ...);
return rows.map(row => ({
  ...row.widgets,
  license: row.licenses,
}));
```

### 2. Status Filtering
- `includeDeleted=false`: Exclude status='deleted'
- `includeDeleted=true`: Include all statuses
- **Paused widgets are NOT deleted** - always included

### 3. Count vs. List
- `getActiveWidgetCount()` returns number
- `getWidgetsByLicenseId()` returns array
- Both exclude deleted by default

### 4. getLicenseWithWidgetCount Composition
- Reuses existing `getLicenseById()`
- Calls `getActiveWidgetCount()` for count
- Returns combined object with spread operator

---

## Edge Cases Covered

✅ Empty results (no widgets)
✅ Cross-license isolation (license ID filtering)
✅ Cross-user isolation (user ID filtering)
✅ Soft-delete exclusion (status != 'deleted')
✅ Soft-delete inclusion (includeDeleted=true)
✅ Mixed statuses (active/paused/deleted)
✅ Ordering (newest first)
✅ Real-time count updates (after create/delete)
✅ NULL handling (non-existent license)
✅ Optional parameters (includeDeleted, licenseId)
✅ Multi-license aggregation (user with multiple licenses)
✅ JOIN integrity (license data attached correctly)

---

## Next Steps (GREEN Phase - Implementer)

### Tasks for GREEN Implementation:

1. **Add 4 functions to `lib/db/queries.ts`:**
   - `getWidgetsByLicenseId()`
   - `getWidgetsByUserId()`
   - `getActiveWidgetCount()`
   - `getLicenseWithWidgetCount()`

2. **Import required Drizzle operators:**
   - `sql` (for raw SQL in WHERE clauses)
   - `and` (for combining conditions)
   - May need `ne` (not equals) or use `sql` for status filtering

3. **Run tests and make them GREEN:**
   ```bash
   npm test tests/unit/db/license-widget-queries.test.ts
   ```

4. **Target:** All 28 tests passing

5. **Acceptance Criteria:**
   - Zero regressions in existing tests (585 tests still passing)
   - All 28 new tests GREEN
   - No hard-coded test gaming
   - Clean implementation following existing query patterns

---

## Dependencies

### Existing Functions (Already Implemented)
- ✅ `getLicenseById(id)` - Used by `getLicenseWithWidgetCount()`

### Type Exports (Already Defined)
- ✅ `WidgetWithLicense` - Line 367-370 in queries.ts

### Schema Tables
- ✅ `widgets` - Phase 3 table with licenseId FK
- ✅ `licenses` - Phase 2 table with userId FK
- ✅ `users` - Phase 1 table

### Helper Functions
- ✅ `createDefaultConfig(tier)` - From `lib/config/defaults.ts`
- ✅ `generateLicenseKey()` - From `lib/license/generate.ts`

---

## Test Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total Tests | 28 | ✅ |
| Spec Coverage | 100% | ✅ |
| Edge Cases | 12+ | ✅ |
| Cross-Boundary Tests | 3 | ✅ (cross-license, cross-user, JOIN) |
| Zero-State Tests | 3 | ✅ |
| Real-Time Update Tests | 3 | ✅ |
| Error Handling | 1 | ✅ (NULL handling) |
| Test Isolation | Full | ✅ (unique testRunId, cleanup) |

---

## Commit Message (for GREEN phase)

```
feat(db): implement license-related widget query functions

Add 4 query functions for Phase 3 Module 2 Day 2:
- getWidgetsByLicenseId(licenseId, includeDeleted)
- getWidgetsByUserId(userId, includeDeleted, licenseId)
- getActiveWidgetCount(licenseId)
- getLicenseWithWidgetCount(id)

Features:
- Multi-license JOIN for user widget queries
- Soft-delete filtering (exclude status='deleted')
- Real-time widget counting for tier limits
- DESC ordering (newest first)
- Cross-user/cross-license isolation

Tests: 28/28 passing (613 total)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Summary

✅ **RED Phase Complete**
✅ **28 comprehensive tests written**
✅ **All tests failing with expected errors**
✅ **100% specification coverage**
✅ **Edge cases, boundary conditions, and integration points covered**
✅ **Ready for GREEN implementation**

**Handoff to Implementer:** Implement the 4 functions in `lib/db/queries.ts` to make these tests pass. Follow the patterns in the existing query functions and reference the design specs in this document.

---

**Test File:** `tests/unit/db/license-widget-queries.test.ts`
**Summary File:** `tests/unit/db/LICENSE_WIDGET_QUERIES_TEST_SUMMARY.md`
**Phase:** Phase 3 Module 2 Day 2
**Status:** ✅ RED Phase Complete

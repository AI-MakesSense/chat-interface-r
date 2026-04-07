# Phase 3 Module 2 Day 3: Deployment & Pagination Query Tests Summary

**Status:** RED Phase Complete - All 26 tests failing as expected

**Test File:** `tests/unit/db/deploy-paginate-queries.test.ts`

**Created:** 2025-11-10

---

## Test Summary

### Total Tests: 26 (All RED)

- **deployWidget Tests:** 8 tests
- **getWidgetsPaginated Tests:** 12 tests
- **getUserLicensesWithWidgetCounts Tests:** 6 tests

### Expected Failure Reason
All tests fail with `TypeError: [functionName] is not a function` because the three query functions have not been implemented yet. This is the correct RED phase behavior.

---

## Function 1: deployWidget(id)

**Purpose:** Mark widget as deployed (set deployedAt timestamp, activate status)

**Signature:**
```typescript
async function deployWidget(id: string): Promise<Widget | null>
```

**Business Logic:**
- Takes widget ID as parameter
- Sets `deployedAt` to current timestamp
- Sets `status` to 'active' (even if paused)
- Updates `updatedAt` to current timestamp
- Returns updated widget or null if not found
- Preserves all other widget fields (name, config, version, etc.)

**Tests (8 total):**

1. **should return null for non-existent widget ID**
   - Tests: Returns null for UUID that doesn't exist
   - Edge case: Non-existent widget

2. **should set deployedAt timestamp when deploying widget**
   - Tests: deployedAt is set to current time (within 5 seconds)
   - Verifies: Timestamp is recent and not null

3. **should set status to active when deploying**
   - Tests: Paused widget becomes active when deployed
   - Verifies: Status changes from 'paused' to 'active'

4. **should update updatedAt timestamp**
   - Tests: updatedAt is newer than original timestamp
   - Verifies: Timestamp update happens on deployment

5. **should work for widget that was never deployed (deployedAt was null)**
   - Tests: First-time deployment
   - Verifies: deployedAt changes from null to Date

6. **should work for widget being re-deployed (updates deployedAt)**
   - Tests: Re-deployment updates deployedAt to new timestamp
   - Verifies: Old deployedAt is replaced with recent timestamp

7. **should work for paused widget (changes status to active)**
   - Tests: Paused widget with old deployedAt
   - Verifies: Status becomes active AND deployedAt updates

8. **should preserve other widget fields (name, config, version)**
   - Tests: Deployment doesn't modify unrelated fields
   - Verifies: name, config, version, licenseId remain unchanged

---

## Function 2: getWidgetsPaginated(userId, options)

**Purpose:** Get paginated widgets for a user with total count

**Signature:**
```typescript
async function getWidgetsPaginated(
  userId: string,
  options?: {
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

**Business Logic:**
- Returns `{ widgets: Array, total: number }`
- Default page=1, default limit=20, max limit=100
- Calculates offset from page number: `offset = (page - 1) * limit`
- Filters by userId via licenses JOIN
- Optional: filter by licenseId
- Optional: includeDeleted (default false)
- Returns total count AND paginated results
- Orders by createdAt DESC (newest first)
- Each widget has license information attached

**Tests (12 total):**

1. **should return empty result for user with no widgets**
   - Tests: Empty result for new user
   - Verifies: `{ widgets: [], total: 0 }`

2. **should return first page of widgets (page=1, limit=20)**
   - Tests: 25 widgets, page 1 returns 20
   - Verifies: total=25, widgets.length=20

3. **should return second page of widgets correctly**
   - Tests: 25 widgets, page 2 returns remaining 5
   - Verifies: total=25, widgets.length=5

4. **should respect custom limit parameter**
   - Tests: 15 widgets, limit=10
   - Verifies: Returns 10 widgets with correct total

5. **should enforce max limit of 100 (limit=200 should become 100)**
   - Tests: 150 widgets, limit=200 (capped at 100)
   - Verifies: Returns max 100 widgets
   - **Note:** This test times out because it creates 150 widgets (slow)

6. **should return correct total count**
   - Tests: 37 widgets across 2 licenses
   - Verifies: total=37, page 1 returns 20

7. **should filter by licenseId when provided**
   - Tests: 10 widgets on license1, 5 on license2
   - Verifies: Filter by license1 returns only 10

8. **should exclude deleted widgets by default**
   - Tests: 2 active + 1 deleted
   - Verifies: Only 2 returned (total=2)

9. **should include deleted widgets when includeDeleted=true**
   - Tests: 1 active + 1 paused + 1 deleted
   - Verifies: All 3 returned (total=3)

10. **should order widgets by createdAt DESC (newest first)**
    - Tests: 5 widgets created in sequence
    - Verifies: Last created is first in results

11. **should handle last page with fewer items than limit**
    - Tests: 23 widgets, page 3 with limit=10
    - Verifies: Returns 3 widgets (23 - 20 = 3)

12. **should return widgets with license information attached**
    - Tests: 3 widgets on license1, 2 on license2
    - Verifies: Each widget has license object with tier, status, domains

---

## Function 3: getUserLicensesWithWidgetCounts(userId)

**Purpose:** Get all user licenses with widget count attached to each

**Signature:**
```typescript
async function getUserLicensesWithWidgetCounts(
  userId: string
): Promise<Array<License & { widgetCount: number }>>
```

**Business Logic:**
- Gets all licenses for user via `getUserLicenses()`
- For each license, calls `getActiveWidgetCount()`
- Returns array of `License & { widgetCount: number }`
- widgetCount excludes deleted widgets
- Reuses existing functions for consistency

**Tests (6 total):**

1. **should return empty array for user with no licenses**
   - Tests: User with no licenses
   - Verifies: Returns []

2. **should return licenses with widgetCount=0 for new licenses**
   - Tests: 2 licenses with no widgets
   - Verifies: Both have widgetCount=0

3. **should return correct widgetCount for each license**
   - Tests: License1=3 widgets, License2=2 widgets
   - Verifies: Counts are accurate for each license

4. **should exclude deleted widgets from counts**
   - Tests: 2 active + 1 deleted on license1
   - Verifies: widgetCount=2 (excludes deleted)

5. **should handle user with multiple licenses correctly**
   - Tests: 3 licenses with 1, 2, and 3 widgets respectively
   - Verifies: Each license has correct count

6. **should update counts correctly after widget creation**
   - Tests: Create widgets incrementally, check counts after each
   - Verifies: Counts update dynamically

---

## Test Data Structure

**Test User:**
- Email: `day3-user-{testRunId}@example.com`
- Name: "Test User"

**Test Licenses:**
- `testLicense1`: Basic tier (1 domain, 1 widget limit)
- `testLicense2`: Pro tier (1 domain, 3 widget limit)

**Test Run ID:**
- Format: `day3-{timestamp}-{random}`
- Ensures unique data per test run
- Prevents conflicts between test runs

**Cleanup Strategy:**
- CASCADE delete handles widgets automatically
- afterAll deletes licenses by userId
- afterAll deletes users by id

---

## Implementation Requirements

### deployWidget Function

```typescript
export async function deployWidget(id: string): Promise<Widget | null> {
  const [widget] = await db
    .update(widgets)
    .set({
      deployedAt: new Date(),
      status: 'active',
      updatedAt: sql`NOW()`,
    })
    .where(eq(widgets.id, id))
    .returning();

  return widget || null;
}
```

### getWidgetsPaginated Function

```typescript
export async function getWidgetsPaginated(
  userId: string,
  options?: {
    page?: number;
    limit?: number;
    licenseId?: string;
    includeDeleted?: boolean;
  }
): Promise<{
  widgets: Array<Widget & { license: License }>;
  total: number;
}> {
  const page = options?.page || 1;
  const rawLimit = options?.limit || 20;
  const limit = Math.min(rawLimit, 100); // Cap at 100
  const offset = (page - 1) * limit;
  const includeDeleted = options?.includeDeleted || false;
  const licenseId = options?.licenseId;

  // Build conditions
  const conditions = [eq(licenses.userId, userId)];
  if (licenseId) {
    conditions.push(eq(widgets.licenseId, licenseId));
  }
  if (!includeDeleted) {
    conditions.push(ne(widgets.status, 'deleted'));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(widgets)
    .innerJoin(licenses, eq(widgets.licenseId, licenses.id))
    .where(and(...conditions));

  const total = countResult[0]?.count || 0;

  // Get paginated widgets
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
}
```

### getUserLicensesWithWidgetCounts Function

```typescript
export async function getUserLicensesWithWidgetCounts(
  userId: string
): Promise<Array<License & { widgetCount: number }>> {
  // Get all licenses for user
  const licenses = await getUserLicenses(userId);

  // Attach widget counts
  const licensesWithCounts = await Promise.all(
    licenses.map(async (license) => {
      const widgetCount = await getActiveWidgetCount(license.id);
      return {
        ...license,
        widgetCount,
      };
    })
  );

  return licensesWithCounts;
}
```

---

## Next Steps (GREEN Phase)

1. **Implement deployWidget function** in `lib/db/queries.ts`
   - Add function after existing widget queries
   - Use UPDATE with SET for deployedAt, status, updatedAt
   - Return updated widget or null

2. **Implement getWidgetsPaginated function** in `lib/db/queries.ts`
   - Add function after getUserLicensesWithWidgetCount
   - Calculate offset from page number
   - Enforce max limit of 100
   - Perform two queries: count + paginated results
   - Join widgets with licenses
   - Map results to Widget & { license: License }

3. **Implement getUserLicensesWithWidgetCounts function** in `lib/db/queries.ts`
   - Add function after getLicenseWithWidgetCount
   - Reuse getUserLicenses() and getActiveWidgetCount()
   - Use Promise.all for parallel count queries
   - Map licenses to License & { widgetCount: number }

4. **Run tests again** - Should turn GREEN (26/26 passing)

5. **Verify zero regressions** - Run full test suite to ensure existing tests still pass

---

## Performance Considerations

**getWidgetsPaginated:**
- Uses two queries (count + paginated)
- Indexed on `widgets.licenseId` and `widgets.status` for performance
- Ordered by `createdAt DESC` - benefits from index
- Limit of 100 prevents excessive data transfer

**getUserLicensesWithWidgetCounts:**
- Uses Promise.all for parallel count queries
- Each count query is fast (indexed by licenseId)
- Reuses existing functions for consistency

**deployWidget:**
- Single UPDATE query
- No JOINs, very fast
- Uses database server time (sql`NOW()`) for consistency

---

## Test Execution Summary

```
Test Results: 26 tests | 26 failed

Status: RED (Expected)
Time: ~20s (one timeout on 150-widget test)
Failures: All "function is not a function" errors

Expected Pattern: RED → GREEN → REFACTOR
Current Phase: RED ✓
Next Phase: GREEN (implement functions)
```

---

## Key Architectural Decisions

1. **Pagination with total count:** Enables UI to show "Page 1 of 5" and build pagination controls

2. **Max limit enforcement:** Prevents abuse and ensures reasonable query performance

3. **License JOIN in pagination:** Required to filter by userId (widgets don't have userId)

4. **Timestamp handling:** Use `sql\`NOW()\`` for server-side consistency, but test against Date.now() for test reliability

5. **Reuse existing functions:** `getUserLicensesWithWidgetCounts` reuses `getUserLicenses()` and `getActiveWidgetCount()` for consistency

6. **Exclude deleted by default:** Pagination excludes soft-deleted widgets unless explicitly requested

---

## Coverage Analysis

**deployWidget Coverage:**
- ✓ Non-existent widget (null return)
- ✓ First deployment (null → Date)
- ✓ Re-deployment (old Date → new Date)
- ✓ Paused widget activation
- ✓ Timestamp updates
- ✓ Field preservation

**getWidgetsPaginated Coverage:**
- ✓ Empty result
- ✓ First page
- ✓ Second page
- ✓ Last page (partial)
- ✓ Custom limit
- ✓ Max limit enforcement
- ✓ Total count accuracy
- ✓ License filtering
- ✓ Deleted widget handling
- ✓ Ordering (DESC)
- ✓ License JOIN

**getUserLicensesWithWidgetCounts Coverage:**
- ✓ Empty licenses
- ✓ Zero widgets
- ✓ Multiple licenses
- ✓ Deleted widget exclusion
- ✓ Dynamic count updates
- ✓ Multiple widgets per license

**Total Coverage: 26 test cases across 3 functions**

---

## Files Created

1. `tests/unit/db/deploy-paginate-queries.test.ts` (845 lines)
2. `tests/unit/db/DEPLOY_PAGINATE_QUERIES_TEST_SUMMARY.md` (this file)

**Next File to Modify:** `lib/db/queries.ts` (add 3 functions)

---

**TDD Status:** RED phase complete. Ready for GREEN implementation.

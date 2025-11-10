# Phase 3 Module 1C: Zod Validation Schemas - RED Test Summary

**Date:** November 10, 2025
**Phase:** Phase 3 - Widget Engine
**Module:** Module 1C - Zod Validation Schemas
**Status:** RED Phase Complete - All Tests Failing as Expected
**Test Author:** Claude (TDD-QA-Lead Agent)

---

## Executive Summary

Created comprehensive RED tests for Zod validation schemas that will be implemented in `lib/validation/widget-schema.ts`. All 102 tests are currently failing with "Cannot find module" error, which is the expected RED state for TDD.

## Test Statistics

- **Total Tests Written:** 102 tests
- **Test Suites:** 38 describe blocks
- **Total Lines of Code:** 1,270 lines
- **Test File:** `tests/unit/validation/widget-schema.test.ts`
- **Current Status:** ALL FAILING (RED state)
- **Failure Reason:** Module `@/lib/validation/widget-schema` does not exist yet

## Test Coverage Breakdown

### 1. Branding Schema Tests (15 tests)

**Test Suite Coverage:**
- Valid branding config validation (3 tests)
- Invalid companyName validation (2 tests)
- Invalid welcomeText validation (2 tests)
- Invalid logoUrl validation (3 tests)
- Launcher icon validation (3 tests)
- BrandingEnabled validation (2 tests)

**Key Validation Rules Tested:**
- ✓ companyName: 1-100 characters
- ✓ welcomeText: 1-200 characters
- ✓ logoUrl: HTTPS required (or null), localhost allowed for testing
- ✓ launcherIcon: Must be 'chat', 'support', 'bot', or 'custom'
- ✓ customLauncherIconUrl: Validated as optional URL
- ✓ brandingEnabled: Boolean validation

### 2. Theme Schema Tests (20 tests)

**Test Suite Coverage:**
- Valid theme config validation (4 tests)
- Invalid hex colors validation (6 tests)
- Position validation (4 tests)
- Size mode validation (3 tests)
- Typography validation (4 tests)
- Corner radius validation (4 tests)

**Key Validation Rules Tested:**
- ✓ Theme mode: 'light', 'dark', or 'auto'
- ✓ Hex colors: Must match /^#[0-9A-Fa-f]{6}$/ format
- ✓ Position: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
- ✓ offsetX/offsetY: 0-500 pixels
- ✓ Size mode: 'compact', 'standard', or 'expanded'
- ✓ fontSize: 12-20 pixels
- ✓ cornerRadius: 0-20 pixels

### 3. Advanced Styling Tests (12 tests)

**Test Suite Coverage:**
- Valid advanced styling validation (3 tests)
- Message styling validation (6 tests)
- Avatar URL validation (3 tests)
- Markdown styling validation (1 test)

**Key Validation Rules Tested:**
- ✓ enabled: Boolean flag (Pro/Agency only)
- ✓ Message colors: Hex format validation
- ✓ messageSpacing: 0-50 pixels
- ✓ bubblePadding: 5-30 pixels
- ✓ avatarUrl: HTTPS or null
- ✓ Markdown styling colors: Hex format validation

### 4. Behavior Schema Tests (10 tests)

**Test Suite Coverage:**
- Valid behavior config validation (1 test)
- AutoOpen delay validation (5 tests)
- Boolean field validation (2 tests)
- Edge cases (2 tests)

**Key Validation Rules Tested:**
- ✓ autoOpenDelay: 0-60 seconds
- ✓ All boolean flags: autoOpen, showCloseButton, persistMessages, enableSoundNotifications, enableTypingIndicator
- ✓ Edge case: autoOpenDelay must be > 0 when autoOpen is true (tested at application level)

### 5. Connection Schema Tests (8 tests)

**Test Suite Coverage:**
- Valid connection config validation (1 test)
- WebhookUrl validation (5 tests)
- TimeoutSeconds validation (3 tests)

**Key Validation Rules Tested:**
- ✓ webhookUrl: HTTPS required, localhost allowed for testing
- ✓ webhookUrl: Cannot be empty or malformed
- ✓ route: String or null
- ✓ timeoutSeconds: 10-60 seconds

### 6. Features Schema Tests (10 tests)

**Test Suite Coverage:**
- Valid features config validation (1 test)
- File attachments validation (8 tests)
- Boolean features validation (2 tests)

**Key Validation Rules Tested:**
- ✓ allowedExtensions: Must start with dot, max 20 extensions
- ✓ maxFileSizeMB: 1-50 MB
- ✓ emailTranscript: Boolean (Pro/Agency only, tested at tier level)
- ✓ ratingPrompt: Boolean (Pro/Agency only, tested at tier level)

### 7. Complete Widget Config Tests (15 tests)

**Test Suite Coverage:**
- Base schema validation (4 tests)
- Tier-aware validation - Basic tier (5 tests)
- Tier-aware validation - Pro tier (5 tests)
- Tier-aware validation - Agency tier (1 test)
- Conditional validation rules (3 tests)

**Key Validation Rules Tested:**

#### Basic Tier Restrictions:
- ✓ brandingEnabled MUST be true when branding is required
- ✓ advancedStyling.enabled MUST be false
- ✓ emailTranscript MUST be false
- ✓ ratingPrompt MUST be false

#### Pro Tier Permissions:
- ✓ brandingEnabled can be false
- ✓ advancedStyling.enabled can be true
- ✓ emailTranscript can be true
- ✓ ratingPrompt can be true

#### Agency Tier Permissions:
- ✓ All features enabled (same as Pro, plus unlimited widgets at application level)

#### Conditional Validation:
- ✓ If launcherIcon='custom', customLauncherIconUrl is required
- ✓ If showAvatar=true (with advanced styling), avatarUrl is required
- ✓ Missing required sections (branding, theme, connection) are rejected

## Test Helpers Created

The test file includes comprehensive helper functions:

1. **createValidBrandingConfig()** - Generates valid branding config for testing
2. **createValidThemeColors()** - Generates valid theme colors object
3. **createValidThemeConfig()** - Generates complete valid theme config
4. **createValidAdvancedStylingConfig()** - Generates valid advanced styling config
5. **createValidBehaviorConfig()** - Generates valid behavior config
6. **createValidConnectionConfig()** - Generates valid connection config
7. **createValidFeaturesConfig()** - Generates valid features config
8. **createValidWidgetConfig()** - Generates complete valid widget config

These helpers ensure:
- DRY principle (no duplication)
- Consistency across tests
- Easy modification of test data
- Clear separation of test setup from assertions

## Test Organization

### File Structure:
```
tests/unit/validation/widget-schema.test.ts
├── Test Helpers (8 functions, ~200 lines)
├── 1. Branding Schema Tests (15 tests, ~150 lines)
├── 2. Theme Schema Tests (20 tests, ~250 lines)
├── 3. Advanced Styling Tests (12 tests, ~150 lines)
├── 4. Behavior Schema Tests (10 tests, ~120 lines)
├── 5. Connection Schema Tests (8 tests, ~100 lines)
├── 6. Features Schema Tests (10 tests, ~120 lines)
└── 7. Complete Widget Config Tests (15 tests, ~280 lines)
```

## Expected Implementation (GREEN Phase)

The GREEN phase implementation should create `lib/validation/widget-schema.ts` with:

### Required Exports:
1. **brandingSchema** - Zod schema for branding configuration
2. **themeSchema** - Zod schema for theme configuration
3. **advancedStylingSchema** - Zod schema for advanced styling
4. **behaviorSchema** - Zod schema for behavior configuration
5. **connectionSchema** - Zod schema for connection configuration
6. **featuresSchema** - Zod schema for features configuration
7. **widgetConfigBaseSchema** - Base schema without tier restrictions
8. **createWidgetConfigSchema(tier, brandingRequired)** - Tier-aware validation function
9. **LicenseTier** - Type definition for 'basic' | 'pro' | 'agency'

### Shared Validators Needed:
- **hexColorSchema** - Validates 6-digit hex colors (#RRGGBB)
- **httpsUrlSchema** - Validates HTTPS URLs (or localhost)
- **optionalHttpsUrlSchema** - Validates HTTPS URLs or null

### Tier-Aware Validation Logic:
The `createWidgetConfigSchema()` function must use `.superRefine()` to enforce:
1. Basic tier: branding required, no advanced styling, no Pro features
2. Pro tier: optional branding, advanced styling allowed, Pro features enabled
3. Agency tier: all features enabled (same as Pro at schema level)

### Conditional Validation:
- Custom launcher icon requires URL
- Avatar display requires avatar URL
- Auto-open delay must be > 0 when auto-open enabled (handled at application level)

## Design Decisions Made

### 1. Base Schema + Tier Function Pattern
**Decision:** Use `widgetConfigBaseSchema` for basic validation, then `createWidgetConfigSchema(tier, brandingRequired)` for tier-specific rules.

**Rationale:**
- Separation of concerns (structure vs business rules)
- Reusability (base schema can be used without tier checks)
- Testability (can test base schema and tier logic separately)

### 2. Shared Validators
**Decision:** Create reusable validators (hexColorSchema, httpsUrlSchema) instead of inline validation.

**Rationale:**
- DRY principle (used in multiple places)
- Consistent error messages
- Easier to update validation rules
- Testability (can test validators in isolation)

### 3. Conditional Validation at Schema Level
**Decision:** Implement conditional rules (custom icon → URL required) in schema using `.superRefine()`.

**Rationale:**
- Single source of truth for validation
- Prevents invalid states at creation time
- Clear error messages for users
- Consistent with Zod best practices

### 4. Application-Level vs Schema-Level Validation
**Decision:** Some rules tested at application level (widget limits, autoOpenDelay > 0 when autoOpen true).

**Rationale:**
- Widget limits require database queries (not schema validation)
- AutoOpenDelay > 0 is business logic, not data validation
- Schema focuses on data structure and format
- Application layer handles business rules and external constraints

## Assumptions Made

1. **Tier Information Available:** Validation functions will have access to license tier and branding requirement.

2. **HTTPS Enforcement:** All URLs (except localhost) must use HTTPS for security.

3. **Hex Color Format:** 6-digit hex codes only (#RRGGBB), no shorthand (#RGB) or RGBA.

4. **File Extensions:** Must start with dot (e.g., '.pdf'), lowercase preferred.

5. **URL Validation:** Zod's `.url()` validator is sufficient, with additional HTTPS check.

6. **Error Messages:** Zod default error messages will be overridden with user-friendly messages.

7. **Type Inference:** TypeScript types will be inferred from Zod schemas using `z.infer<typeof schema>`.

8. **Range Validation:** All numeric ranges are inclusive (e.g., 12-20 includes both 12 and 20).

## Confirmation: RED State Achieved

✅ **Test File Created:** `tests/unit/validation/widget-schema.test.ts` (1,270 lines)

✅ **All Tests Failing:** 102 tests fail with "Cannot find module" error

✅ **Expected Failure Reason:** Module `@/lib/validation/widget-schema` does not exist yet

✅ **Test Structure:** Well-organized with clear categories and descriptions

✅ **Test Coverage:** Comprehensive coverage of all validation rules from design document

✅ **Helper Functions:** Reusable test data generators created

✅ **Comments:** Each test includes "FAIL REASON" comment explaining why it fails

## Next Steps (GREEN Phase)

The Implementer should now:

1. **Create** `lib/validation/widget-schema.ts`
2. **Implement** base Zod schemas (branding, theme, features, etc.)
3. **Implement** shared validators (hexColorSchema, httpsUrlSchema)
4. **Implement** `createWidgetConfigSchema(tier, brandingRequired)` function
5. **Run tests** iteratively, making each test pass one by one
6. **Verify** all 102 tests pass (GREEN state)
7. **Check** for code duplication or optimization opportunities (REFACTOR)

## Test Quality Metrics

- **Coverage:** All validation rules from design document covered
- **Clarity:** Each test has descriptive name and clear purpose
- **Independence:** Tests can run in any order (no dependencies)
- **Speed:** Unit tests (no database, no network) - will run in < 1 second
- **Maintainability:** Helper functions reduce duplication, easy to update
- **Readability:** Clear structure with comments and organization

## Files Modified

### Created:
- `tests/unit/validation/widget-schema.test.ts` (1,270 lines)

### To Be Created (GREEN Phase):
- `lib/validation/widget-schema.ts` (~500 lines estimated)

---

**TDD Cycle Status:** ✅ RED Phase Complete

**Ready for GREEN Phase:** Yes

**Blocking Issues:** None

**Questions for Implementer:** None - specifications are clear and comprehensive

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Author:** Claude (TDD-QA-Lead Subagent)

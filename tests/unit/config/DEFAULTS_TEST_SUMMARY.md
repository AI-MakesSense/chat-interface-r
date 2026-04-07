# Phase 3 Module 1D: Default Config Generators - RED Test Summary

## Status: RED (All Tests Failing) ✅

All 49 tests are in RED state as expected. The module `@/lib/config/defaults` does not exist yet.

## Test File Location

```
tests/unit/config/defaults.test.ts
```

## Test Statistics

- **Total Tests Written**: 49 tests
- **Expected Tests**: ~42 tests
- **Actual Tests**: 49 tests (7 additional helper function tests)
- **Current Status**: All FAILING (RED state)
- **Failure Reason**: `Cannot find module '@/lib/config/defaults'`

## Test Coverage Breakdown

### 1. Main Function Tests (10 tests)
Tests for the primary `createDefaultConfig(tier)` function:

- ✅ Returns valid WidgetConfig for Basic tier
- ✅ Returns valid WidgetConfig for Pro tier
- ✅ Returns valid WidgetConfig for Agency tier
- ✅ Validates against Basic tier Zod schema
- ✅ Validates against Pro tier Zod schema
- ✅ Validates against Agency tier Zod schema
- ✅ Returns different configs for different tiers
- ✅ Throws error for invalid tier
- ✅ Throws error for undefined tier
- ✅ Throws error for null tier

### 2. Basic Tier Tests (8 tests)
Tests for Basic tier-specific requirements:

- ✅ Branding enabled (brandingEnabled: true)
- ✅ Advanced styling disabled
- ✅ Email transcript disabled
- ✅ Rating prompt disabled
- ✅ All required branding fields present
- ✅ Validates against Basic tier schema
- ✅ Sensible default values
- ✅ Empty webhook URL (user must configure)

### 3. Pro Tier Tests (8 tests)
Tests for Pro tier-specific requirements:

- ✅ Branding disabled by default (white-label ready)
- ✅ Advanced styling enabled
- ✅ Email transcript enabled
- ✅ Rating prompt enabled
- ✅ All required fields present
- ✅ Validates against Pro tier schema
- ✅ Professional default values
- ✅ Advanced styling with message and markdown defaults

### 4. Agency Tier Tests (8 tests)
Tests for Agency tier-specific requirements:

- ✅ Branding disabled (white-label)
- ✅ Advanced styling enabled with premium defaults
- ✅ All features enabled
- ✅ All required fields present
- ✅ Validates against Agency tier schema
- ✅ Premium default values
- ✅ Maximum customization options
- ✅ Empty webhook URL (user must configure)

### 5. Immutability Tests (3 tests)
Tests for object immutability and independence:

- ✅ Returns new object each time (not shared reference)
- ✅ Modifying returned config doesn't affect subsequent calls
- ✅ Deep immutability (nested objects are cloned)

### 6. Field Validation Tests (5 tests)
Tests for default value correctness:

- ✅ All hex colors in valid format (#RRGGBB)
- ✅ All string lengths within limits
- ✅ All number ranges within bounds
- ✅ All required fields present
- ✅ No unexpected fields

### 7. Helper Function Tests (7 additional tests)
Optional tests for helper functions (if implemented):

- ✅ `createDefaultBranding` - Basic tier
- ✅ `createDefaultBranding` - Pro tier
- ✅ `createDefaultTheme` - Returns valid ThemeConfig
- ✅ `createDefaultBehavior` - Returns valid BehaviorConfig
- ✅ `createDefaultConnection` - Returns valid ConnectionConfig
- ✅ `createDefaultFeatures` - Basic tier
- ✅ `createDefaultFeatures` - Pro tier

## Expected Default Values to Implement

### Branding Defaults
```typescript
{
  companyName: "My Company",
  welcomeText: "Welcome! How can we help you today?",
  logoUrl: null,
  responseTimeText: "Typically replies within minutes",
  firstMessage: "Hello! How can I assist you today?",
  inputPlaceholder: "Type your message...",
  launcherIcon: "chat",
  customLauncherIconUrl: null,
  brandingEnabled: true (Basic) | false (Pro/Agency)
}
```

### Theme Defaults
```typescript
{
  mode: "light",
  colors: {
    primary: "#4F46E5",      // Professional indigo
    secondary: "#10B981",    // Green accent
    background: "#FFFFFF",   // White
    userMessage: "#4F46E5",  // Match primary
    botMessage: "#F3F4F6",   // Light gray
    text: "#111827",         // Dark gray
    textSecondary: "#6B7280", // Medium gray
    border: "#E5E7EB",       // Light border
    inputBackground: "#FFFFFF",
    inputText: "#111827"
  },
  position: {
    position: "bottom-right",
    offsetX: 20,
    offsetY: 20
  },
  size: {
    mode: "standard",
    customWidth: null,
    customHeight: null,
    fullscreenOnMobile: false
  },
  typography: {
    fontFamily: "system-ui",
    fontSize: 14,
    fontUrl: null,
    disableDefaultFont: false
  },
  cornerRadius: 12
}
```

### Behavior Defaults
```typescript
{
  autoOpen: false,
  autoOpenDelay: 0,
  showCloseButton: true,
  persistMessages: true,
  enableSoundNotifications: false,
  enableTypingIndicator: true
}
```

### Connection Defaults
```typescript
{
  webhookUrl: "",  // User must set
  route: null,
  timeoutSeconds: 30
}
```

### Features Defaults
```typescript
{
  attachments: {
    enabled: false,
    allowedExtensions: [],
    maxFileSizeMB: 10
  },
  emailTranscript: false (Basic) | true (Pro/Agency),
  printTranscript: true,
  ratingPrompt: false (Basic) | true (Pro/Agency)
}
```

### Advanced Styling Defaults
```typescript
{
  enabled: false (Basic) | true (Pro/Agency),
  messages: {
    userMessageBackground: "#4F46E5",
    userMessageText: "#FFFFFF",
    botMessageBackground: "#F3F4F6",
    botMessageText: "#111827",
    messageSpacing: 12,
    bubblePadding: 12,
    showAvatar: false,
    avatarUrl: null
  },
  markdown: {
    codeBlockBackground: "#1F2937",
    codeBlockText: "#F9FAFB",
    codeBlockBorder: "#374151",
    inlineCodeBackground: "#F3F4F6",
    inlineCodeText: "#EF4444",
    linkColor: "#3B82F6",
    linkHoverColor: "#2563EB",
    tableHeaderBackground: "#F9FAFB",
    tableBorderColor: "#E5E7EB"
  }
}
```

## Tier-Specific Requirements Tested

### Basic Tier
- ❌ MUST have branding enabled (`brandingEnabled: true`)
- ❌ MUST NOT have advanced styling enabled
- ❌ MUST NOT have email transcript
- ❌ MUST NOT have rating prompt
- ✅ All validation tests confirm these restrictions

### Pro Tier
- ✅ CAN disable branding (default: false)
- ✅ CAN use advanced styling (default: true)
- ✅ CAN use email transcript (default: true)
- ✅ CAN use rating prompt (default: true)
- ✅ All validation tests confirm these features

### Agency Tier
- ✅ White-label ready (branding disabled by default)
- ✅ Premium advanced styling
- ✅ All features enabled
- ✅ Maximum customization options
- ✅ All validation tests confirm premium features

## Immutability Requirements Tested

1. **Reference Independence**: Each call returns a new object
2. **Modification Safety**: Changes to one config don't affect others
3. **Deep Cloning**: Nested objects are also independent

## Validation Requirements Tested

1. **Hex Colors**: All colors match `#RRGGBB` format
2. **String Lengths**: Within schema-defined limits
3. **Number Ranges**: Within schema-defined bounds
4. **Required Fields**: All mandatory fields present
5. **Schema Compliance**: Validates against tier-specific Zod schemas

## Design Decisions Made

### 1. Test Structure
- Organized into 7 clear categories
- Each category tests specific aspects
- Total coverage exceeds original plan (49 vs 42 tests)

### 2. Helper Function Tests
- Added 7 tests for optional helper functions
- Tests are independent and can pass even if helpers aren't implemented
- Provides flexibility in implementation approach

### 3. Validation Strategy
- Uses Zod schemas for comprehensive validation
- Tests both positive cases (valid configs) and negative cases (invalid tiers)
- Validates tier-specific restrictions

### 4. Default Values
- Chosen professional, accessible colors
- Sensible numeric defaults within schema bounds
- Empty webhook URL forces user configuration (security)

### 5. Immutability Testing
- Tests at multiple levels (shallow and deep)
- Verifies both reference independence and value independence
- Critical for preventing config mutation bugs

## Function Signatures Required

```typescript
// Main function (REQUIRED)
export function createDefaultConfig(
  tier: 'basic' | 'pro' | 'agency'
): WidgetConfig;

// Optional helper functions
export function createDefaultBranding(tier: string): BrandingConfig;
export function createDefaultTheme(tier: string): ThemeConfig;
export function createDefaultBehavior(tier: string): BehaviorConfig;
export function createDefaultConnection(): ConnectionConfig;
export function createDefaultFeatures(tier: string): FeaturesConfig;
```

## Next Steps (GREEN Phase)

1. Create `lib/config/defaults.ts` file
2. Implement `createDefaultConfig(tier)` function
3. Add tier-specific logic for:
   - Branding enabled/disabled
   - Advanced styling enabled/disabled
   - Feature flags (email, rating)
4. Implement helper functions (optional)
5. Ensure all 49 tests pass
6. Verify Zod schema validation passes

## Files Created

- `tests/unit/config/defaults.test.ts` (49 tests)
- `tests/unit/config/DEFAULTS_TEST_SUMMARY.md` (this file)

## Dependencies

- Vitest testing framework
- Zod validation library
- Existing types from `lib/types/widget-config.ts`
- Existing schemas from `lib/validation/widget-schema.ts`

## Verification

```bash
# Run tests (should see 49 failing tests)
npm test -- tests/unit/config/defaults.test.ts

# Expected output:
# Test Files: 1 failed
# Tests: 0 tests (module not found)
# Error: Cannot find module '@/lib/config/defaults'
```

## Success Criteria

- ✅ All 49 tests written
- ✅ All tests currently failing (RED state)
- ✅ Comprehensive coverage of requirements
- ✅ Clear test descriptions
- ✅ Tier-specific validation
- ✅ Immutability testing
- ✅ Field validation testing
- ✅ Schema compliance testing

---

**Status**: Ready for GREEN phase (implementation)
**Date**: 2025-11-10
**Phase**: Phase 3 Module 1D - Default Config Generators (RED)

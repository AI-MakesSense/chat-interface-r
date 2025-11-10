# Phase 3 Module 1C: Zod Validation Schemas - Implementation Guide

**For:** Implementer Agent
**Status:** Ready for GREEN Phase
**Test File:** `tests/unit/validation/widget-schema.test.ts` (102 failing tests)

---

## Quick Start

1. **Create file:** `lib/validation/widget-schema.ts`
2. **Run tests:** `npm test -- tests/unit/validation/widget-schema.test.ts`
3. **Make tests pass** one by one, starting with simple schemas
4. **Verify:** All 102 tests pass

---

## Implementation Order (Recommended)

### Step 1: Shared Validators (Foundation)

Start with the building blocks used by all schemas:

```typescript
import { z } from 'zod';

// Hex color validator (#RRGGBB format)
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)');

// HTTPS URL validator (or localhost for development)
const httpsUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (url) => url.startsWith('https://') || url.includes('localhost'),
    'Must use HTTPS (or localhost for development)'
  );

// Optional HTTPS URL (null allowed)
const optionalHttpsUrlSchema = z.union([
  httpsUrlSchema,
  z.null(),
]);
```

**Tests that will pass:** None yet (validators not exported)

---

### Step 2: Branding Schema

Implement the branding configuration schema:

```typescript
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
```

**Tests that will pass:** 15 branding schema tests

---

### Step 3: Theme Schema

Implement theme configuration with nested objects:

```typescript
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
```

**Tests that will pass:** 20 theme schema tests

---

### Step 4: Advanced Styling Schema

Implement Pro/Agency tier advanced styling:

```typescript
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
```

**Tests that will pass:** 12 advanced styling tests

---

### Step 5: Behavior Schema

Implement behavior configuration:

```typescript
export const behaviorSchema = z.object({
  autoOpen: z.boolean(),
  autoOpenDelay: z.number().int().min(0).max(60),
  showCloseButton: z.boolean(),
  persistMessages: z.boolean(),
  enableSoundNotifications: z.boolean(),
  enableTypingIndicator: z.boolean(),
});
```

**Tests that will pass:** 10 behavior schema tests

---

### Step 6: Connection Schema

Implement n8n webhook connection configuration:

```typescript
export const connectionSchema = z.object({
  webhookUrl: httpsUrlSchema,
  route: z.string().max(100).nullable(),
  timeoutSeconds: z.number().int().min(10).max(60),
});
```

**Tests that will pass:** 8 connection schema tests

---

### Step 7: Features Schema

Implement features configuration:

```typescript
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
```

**Tests that will pass:** 10 features schema tests

---

### Step 8: Base Widget Config Schema

Combine all schemas:

```typescript
export const widgetConfigBaseSchema = z.object({
  branding: brandingSchema,
  theme: themeSchema,
  advancedStyling: advancedStylingSchema,
  behavior: behaviorSchema,
  connection: connectionSchema,
  features: featuresSchema,
});
```

**Tests that will pass:** 4 base validation tests (missing sections)

---

### Step 9: Tier-Aware Validation (Most Complex)

Implement the tier-aware validation function:

```typescript
export type LicenseTier = 'basic' | 'pro' | 'agency';

/**
 * Create tier-aware widget config schema
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

    // RESTRICTION 5: Custom launcher icon requires URL
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
```

**Tests that will pass:** All remaining 15 complete widget config tests

---

## Validation Rules Summary

### Field Constraints:

| Field | Min | Max | Format | Notes |
|-------|-----|-----|--------|-------|
| companyName | 1 | 100 | String | Required |
| welcomeText | 1 | 200 | String | Required |
| logoUrl | - | - | HTTPS URL or null | Localhost allowed |
| fontSize | 12 | 20 | Integer (px) | - |
| cornerRadius | 0 | 20 | Integer (px) | - |
| offsetX/offsetY | 0 | 500 | Integer (px) | - |
| messageSpacing | 0 | 50 | Integer (px) | - |
| bubblePadding | 5 | 30 | Integer (px) | - |
| autoOpenDelay | 0 | 60 | Integer (seconds) | - |
| timeoutSeconds | 10 | 60 | Integer (seconds) | - |
| maxFileSizeMB | 1 | 50 | Integer (MB) | - |

### Hex Color Format:
- Pattern: `/^#[0-9A-Fa-f]{6}$/`
- Example: `#0066FF`, `#aabbcc`
- Case-insensitive

### URL Validation:
- Must be valid URL format
- Must use HTTPS (except localhost)
- Localhost examples: `http://localhost:3000`, `http://localhost:5678`

### Tier Restrictions:

| Feature | Basic | Pro | Agency |
|---------|-------|-----|--------|
| Branding Required | ✅ Yes | ❌ No | ❌ No |
| Advanced Styling | ❌ No | ✅ Yes | ✅ Yes |
| Email Transcript | ❌ No | ✅ Yes | ✅ Yes |
| Rating Prompt | ❌ No | ✅ Yes | ✅ Yes |

---

## Testing Strategy

### Run Tests Incrementally:

```bash
# Run all validation tests
npm test -- tests/unit/validation/widget-schema.test.ts

# Run specific test suite
npm test -- tests/unit/validation/widget-schema.test.ts -t "Branding Schema"

# Run in watch mode
npm test -- tests/unit/validation/widget-schema.test.ts --watch
```

### Expected Progress:

1. After shared validators: 0 tests passing
2. After branding schema: 15 tests passing
3. After theme schema: 35 tests passing
4. After advanced styling: 47 tests passing
5. After behavior schema: 57 tests passing
6. After connection schema: 65 tests passing
7. After features schema: 75 tests passing
8. After base schema: 79 tests passing
9. After tier-aware validation: **102 tests passing ✅**

---

## Common Pitfalls to Avoid

### 1. Hex Color Regex
❌ **Wrong:** `/^#[0-9A-F]{6}$/` (uppercase only)
✅ **Correct:** `/^#[0-9A-Fa-f]{6}$/` (case-insensitive)

### 2. URL Validation
❌ **Wrong:** `.refine((url) => url.startsWith('https://'))` (blocks localhost)
✅ **Correct:** `.refine((url) => url.startsWith('https://') || url.includes('localhost'))`

### 3. Partial Colors in Dark Override
❌ **Wrong:** `colors: themeColorsSchema` (requires all fields)
✅ **Correct:** `colors: themeColorsSchema.partial()` (allows partial overrides)

### 4. Range Validation
❌ **Wrong:** `.min(12).max(20)` (excludes 12 and 20)
✅ **Correct:** `.min(12).max(20)` is inclusive in Zod ✓

### 5. Tier Parameter Name
❌ **Wrong:** Function parameter `licenseTier: string`
✅ **Correct:** Function parameter `tier: LicenseTier` (typed)

---

## Type Exports (Optional but Recommended)

Add type exports at the end of the file:

```typescript
// Type exports for use in other modules
export type BrandingInput = z.infer<typeof brandingSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
export type AdvancedStylingInput = z.infer<typeof advancedStylingSchema>;
export type BehaviorInput = z.infer<typeof behaviorSchema>;
export type ConnectionInput = z.infer<typeof connectionSchema>;
export type FeaturesInput = z.infer<typeof featuresSchema>;
export type WidgetConfigInput = z.infer<typeof widgetConfigBaseSchema>;
```

---

## File Structure Template

```typescript
/**
 * Widget Configuration Validation Schemas
 *
 * Purpose: Provides Zod schemas for validating widget configurations
 * with tier-based restrictions.
 */

import { z } from 'zod';

// =============================================================================
// Shared Validators
// =============================================================================

const hexColorSchema = ...
const httpsUrlSchema = ...
const optionalHttpsUrlSchema = ...

// =============================================================================
// Branding Schema
// =============================================================================

export const brandingSchema = ...

// =============================================================================
// Theme Schema
// =============================================================================

const themeColorsSchema = ...
const themeDarkOverrideSchema = ...
const positionSchema = ...
const sizeSchema = ...
const typographySchema = ...
export const themeSchema = ...

// =============================================================================
// Advanced Styling Schema (Pro/Agency only)
// =============================================================================

const messageStylingSchema = ...
const markdownStylingSchema = ...
export const advancedStylingSchema = ...

// =============================================================================
// Behavior Schema
// =============================================================================

export const behaviorSchema = ...

// =============================================================================
// Connection Schema
// =============================================================================

export const connectionSchema = ...

// =============================================================================
// Features Schema
// =============================================================================

const fileAttachmentsSchema = ...
export const featuresSchema = ...

// =============================================================================
// Complete Widget Config Schema (Base - No Tier Restrictions)
// =============================================================================

export const widgetConfigBaseSchema = ...

// =============================================================================
// Tier-Aware Validation
// =============================================================================

export type LicenseTier = 'basic' | 'pro' | 'agency';

export const createWidgetConfigSchema = (tier: LicenseTier, brandingRequired: boolean) => {
  return widgetConfigBaseSchema.superRefine((config, ctx) => {
    // Tier restrictions here...
  });
};

// =============================================================================
// Type Exports
// =============================================================================

export type BrandingInput = z.infer<typeof brandingSchema>;
export type ThemeInput = z.infer<typeof themeSchema>;
// ... etc
```

---

## Success Criteria

✅ All 102 tests pass
✅ No TypeScript errors
✅ All exports available
✅ Error messages are clear and user-friendly
✅ Code is well-organized and commented

---

## Estimated Implementation Time

- **Total Lines of Code:** ~500 lines
- **Estimated Time:** 2-3 hours
- **Complexity:** Medium (mostly straightforward, tier logic adds complexity)

---

## Questions or Issues?

If tests fail unexpectedly:

1. Check error messages carefully (Zod provides good errors)
2. Verify regex patterns (especially hex colors)
3. Ensure URL validation includes localhost check
4. Confirm tier restrictions match test expectations
5. Verify all schemas are exported

**Ready to begin GREEN phase!**

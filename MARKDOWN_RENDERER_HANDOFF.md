# Markdown Renderer Module - RED Phase Complete

**Date:** 2025-11-12
**Phase:** Week 4, Day 3-4 (Markdown + Optimization)
**TDD Stage:** 🔴 RED → 🟢 GREEN (Ready for Implementation)
**Module:** Markdown Renderer

---

## Summary

✅ **RED Phase Complete** - All 27 tests written and failing as expected
⏳ **GREEN Phase Ready** - Implementer can now write production code
📦 **Dependencies:** markdown-it (not yet installed)
🔗 **Integration:** XssSanitizer (already implemented and tested)

---

## Files Created

### 1. Test File (709 lines)
**Path:** `C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\utils\markdown-renderer.test.ts`

**Contents:**
- 27 comprehensive RED tests
- Full test documentation
- AAA pattern (Arrange/Act/Assert)
- "WHY IT WILL FAIL" comments for each test
- Uses @vitest-environment jsdom (for DOMPurify support)

### 2. Detailed Report
**Path:** `C:\Projects\Chat Interfacer\n8n-widget-designer\MARKDOWN_RENDERER_RED_TESTS_REPORT.md`

**Contents:**
- Complete test breakdown (all 27 tests documented)
- Implementation requirements
- Security considerations
- markdown-it configuration examples
- Verification commands

### 3. GREEN Implementation Guide
**Path:** `C:\Projects\Chat Interfacer\n8n-widget-designer\MARKDOWN_RENDERER_GREEN_GUIDE.md`

**Contents:**
- Quick-start checklist
- Code templates
- Common pitfalls
- Step-by-step implementation strategy
- Success criteria

---

## Test Coverage (27 Tests)

| Category | Count | Status |
|----------|-------|--------|
| Basic Markdown | 8 | 🔴 FAILING |
| Configuration Respect | 6 | 🔴 FAILING |
| XSS Integration | 5 | 🔴 FAILING |
| Edge Cases | 6 | 🔴 FAILING |
| Bonus (Singleton) | 2 | 🔴 FAILING |
| **TOTAL** | **27** | **🔴 RED** |

---

## Test Verification

### Current Status
```bash
npm test tests/widget/utils/markdown-renderer.test.ts
```

**Output:**
```
FAIL  tests/widget/utils/markdown-renderer.test.ts
Error: Failed to resolve import "@/widget/src/utils/markdown-renderer"
```

✅ **This is expected and correct** - module doesn't exist yet (RED phase).

---

## Module Interface

### MarkdownConfig
```typescript
export interface MarkdownConfig {
  enableTables: boolean;
  enableCodeBlocks: boolean;
  enableBlockquotes: boolean;
  enableLinks: boolean;
  enableImages: boolean;
  enableLineBreaks: boolean;
  maxNesting: number; // Default: 20
}
```

### MarkdownRenderer
```typescript
export class MarkdownRenderer {
  constructor(config: MarkdownConfig);
  render(markdown: string): string; // Returns sanitized HTML

  // Optional (bonus tests)
  static async initialize(): Promise<void>;
  static getInstance(config: MarkdownConfig): MarkdownRenderer;
}
```

---

## Implementation Requirements

### Dependencies to Install
```bash
npm install markdown-it @types/markdown-it
```

### Files to Create
**Production Module:**
`C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\markdown-renderer.ts`

**Estimated Size:** 200-300 lines

### Integration Points
1. **markdown-it** - Parse markdown to HTML
2. **XssSanitizer** - Sanitize HTML output (use MARKDOWN_PRESET)
3. **Configuration** - Enable/disable markdown features

---

## Implementation Checklist

### Core Functionality (Required)
- [ ] Install markdown-it
- [ ] Create MarkdownConfig interface
- [ ] Create MarkdownRenderer class
- [ ] Implement constructor with config
- [ ] Implement render() method:
  - [ ] Parse markdown with markdown-it
  - [ ] Configure features based on MarkdownConfig
  - [ ] Sanitize output with XssSanitizer
  - [ ] Handle empty input
  - [ ] Enforce maxNesting limit

### Test Coverage
- [ ] 8 basic markdown tests passing
- [ ] 6 configuration tests passing
- [ ] 5 XSS integration tests passing
- [ ] 6 edge case tests passing
- [ ] 2 bonus tests passing (optional)

### Documentation
- [ ] File-level purpose comment
- [ ] Function-level JSDoc comments
- [ ] Inline comments for complex logic

---

## Critical Security Requirements

### 1. Sanitize After Parsing
```typescript
// ✅ CORRECT
const html = markdownIt.render(markdown);
const safeHtml = sanitizer.sanitize(html);

// ❌ WRONG - Don't sanitize before parsing
const safeMarkdown = sanitizer.sanitize(markdown); // Breaks markdown syntax
```

### 2. Use MARKDOWN_PRESET
```typescript
import { XssSanitizer } from './xss-sanitizer';

this.sanitizer = new XssSanitizer(XssSanitizer.MARKDOWN_PRESET);
```

### 3. Enforce maxNesting
```typescript
const md = new MarkdownIt({
  maxNesting: config.maxNesting || 20, // Prevent DoS
});
```

---

## Test Categories

### Basic Markdown (8 tests)
1. Render headings (h1-h6)
2. Render paragraphs with line breaks
3. Render bold/italic/strikethrough
4. Render inline code
5. Render code blocks with language
6. Render unordered lists
7. Render ordered lists
8. Render nested lists

### Configuration Respect (6 tests)
9. Respect enableTables = false
10. Respect enableCodeBlocks = false
11. Respect enableBlockquotes = false
12. Respect enableLinks = false
13. Respect enableImages = false
14. Respect enableLineBreaks = false

### XSS Integration (5 tests)
15. Strip XSS in markdown (script tags)
16. Strip XSS in links (javascript: protocol)
17. Preserve safe HTML in markdown
18. Handle malicious nested markdown
19. Sanitize after markdown parsing (not before)

### Edge Cases (6 tests)
20. Handle empty string input
21. Handle very long markdown (>10KB)
22. Handle deeply nested markdown (maxNesting limit)
23. Preserve code block content (no markdown parsing inside)
24. Handle special characters (unicode, emojis)
25. Handle markdown with HTML entities

### Bonus Tests (2 tests)
26. getInstance returns singleton instance
27. initialize method prepares async resources

---

## Dependencies

### Already Implemented ✅
- **XssSanitizer** (`widget/src/utils/xss-sanitizer.ts`)
  - Status: GREEN (21/21 tests passing)
  - Commit: 55ffaaf
  - MARKDOWN_PRESET available for use

### To Be Installed ⏳
- **markdown-it** (npm package)
- **@types/markdown-it** (TypeScript types)

---

## markdown-it Configuration Template

```typescript
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true, // Allow HTML (will be sanitized)
  linkify: config.enableLinks,
  breaks: config.enableLineBreaks,
  typographer: true,
  maxNesting: config.maxNesting || 20,
});

// Disable features based on config
if (!config.enableTables) md.disable('table');
if (!config.enableCodeBlocks) {
  md.disable('fence');
  md.disable('code');
}
if (!config.enableBlockquotes) md.disable('blockquote');
if (!config.enableLinks) md.disable('link');
if (!config.enableImages) md.disable('image');
```

---

## Success Criteria

### GREEN Phase Complete When:
1. ✅ All 27 tests passing
2. ✅ No @ts-expect-error suppressions
3. ✅ No test.skip() or test.only()
4. ✅ XSS protection verified (5 tests)
5. ✅ Configuration toggles working (6 tests)
6. ✅ Edge cases handled (6 tests)
7. ✅ Minimal implementation (no over-engineering)

### Verification Command:
```bash
npm test tests/widget/utils/markdown-renderer.test.ts
```

**Expected Output:**
```
PASS  tests/widget/utils/markdown-renderer.test.ts
  MarkdownRenderer - RED Tests
    ✓ should render all heading levels (h1-h6)
    ✓ should render paragraphs with line breaks
    ... (25 more tests)

Test Files  1 passed (1)
Tests  27 passed (27)
Duration  < 1s
```

---

## Handoff to Implementer

### What's Ready
✅ Comprehensive test suite (27 tests)
✅ Detailed implementation guide
✅ Code templates and examples
✅ Security requirements documented
✅ XssSanitizer integration ready

### What's Needed
⏳ Install markdown-it
⏳ Create production module
⏳ Implement minimal code to pass tests

### Reference Documents
1. **MARKDOWN_RENDERER_RED_TESTS_REPORT.md** - Complete test breakdown
2. **MARKDOWN_RENDERER_GREEN_GUIDE.md** - Implementation quick-start
3. **tests/widget/utils/markdown-renderer.test.ts** - Full test suite

### Next Steps
1. Review test file and implementation guide
2. Install markdown-it dependency
3. Create `widget/src/utils/markdown-renderer.ts`
4. Implement minimal code (start with basic rendering)
5. Run tests iteratively until all 27 pass
6. Move to REFACTOR phase (optimization, docs)

---

## TDD Compliance

### RED Phase ✅
- [x] Tests written BEFORE production code
- [x] All tests currently FAILING
- [x] Failure reasons documented
- [x] Tests follow AAA pattern
- [x] Tests are black-box (behavior, not implementation)
- [x] No production code exists yet

### GREEN Phase (Next) ⏳
- [ ] Implement minimal code to pass tests
- [ ] One test at a time (or small batches)
- [ ] No over-engineering
- [ ] Run tests frequently
- [ ] All tests GREEN before REFACTOR

### REFACTOR Phase (Future) ⏳
- [ ] Optimize performance
- [ ] Extract helper functions
- [ ] Add inline documentation
- [ ] Implement singleton (if not done)
- [ ] Run benchmarks

---

## Project Context

### Phase: Week 4 (Markdown + Optimization)
- **Day 1-2:** XSS Sanitizer ✅ GREEN (21/21 tests passing, commit: 55ffaaf)
- **Day 3-4:** Markdown Renderer 🔴 RED (27/27 tests failing, ready for GREEN)
- **Day 5-6:** Syntax Highlighting (planned)
- **Day 7:** Performance Optimization (planned)

### Related Modules
- **XssSanitizer** (already implemented)
  - File: `widget/src/utils/xss-sanitizer.ts`
  - Tests: `tests/widget/utils/xss-sanitizer.test.ts`
  - Status: ✅ GREEN (21/21 passing)
  - Integration: Import and use MARKDOWN_PRESET

---

## File Paths (Absolute)

### Test File
`C:\Projects\Chat Interfacer\n8n-widget-designer\tests\widget\utils\markdown-renderer.test.ts`

### Production File (To Be Created)
`C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\markdown-renderer.ts`

### XSS Sanitizer (Dependency)
`C:\Projects\Chat Interfacer\n8n-widget-designer\widget\src\utils\xss-sanitizer.ts`

### Documentation
- `C:\Projects\Chat Interfacer\n8n-widget-designer\MARKDOWN_RENDERER_RED_TESTS_REPORT.md`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\MARKDOWN_RENDERER_GREEN_GUIDE.md`
- `C:\Projects\Chat Interfacer\n8n-widget-designer\MARKDOWN_RENDERER_HANDOFF.md` (this file)

---

## Questions for Implementer

### Before Implementation
1. Should we cache markdown-it instances per configuration?
2. Should maxNesting be enforced in markdown-it options or post-processing?
3. Should we implement singleton pattern now or in REFACTOR?
4. Should we lazy-load markdown-it for smaller bundle size?

### During Implementation
1. If tests fail unexpectedly, check test expectations
2. If sanitization seems wrong, verify order (parse → sanitize)
3. If configuration toggles don't work, check markdown-it .disable() calls
4. If nesting issues occur, verify maxNesting configuration

---

## Risk Assessment

### Low Risk ✅
- XssSanitizer already tested and working
- markdown-it is battle-tested library
- Clear test specifications
- Well-documented requirements

### Medium Risk ⚠️
- markdown-it configuration complexity
- maxNesting enforcement mechanism
- Feature toggle implementation

### Mitigation
- Refer to markdown-it documentation for configuration
- Test each feature toggle individually
- Run tests frequently during implementation
- Ask for clarification if test expectations are unclear

---

## Conclusion

🔴 **RED Phase: Complete**
🟢 **GREEN Phase: Ready to Start**
♻️ **REFACTOR Phase: After GREEN**

**Status:** Ready for implementation
**Blocker:** None
**Next Action:** Install markdown-it and create production module

---

**Handoff Date:** 2025-11-12
**Prepared By:** Claude Code (TDD/QA Lead)
**Handoff To:** Implementer (GREEN Phase)
**TDD Phase:** RED → GREEN Transition

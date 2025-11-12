# Architectural Decision Records (ADRs)

This file documents all significant architectural and design decisions made during the project.

---

## ADR-008: Syntax Highlighter Library Choice (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 5-6 - Need syntax highlighting for code blocks in chat messages. Must stay within 50KB bundle size limit. Current bundle: 48.23 KB, remaining budget: ~2KB.

**Decision:** Use **Prism.js** for syntax highlighting (not Highlight.js)

**Rationale:**

### Bundle Size Comparison
- Prism.js core: ~2KB gzipped
- Highlight.js core: ~7KB gzipped
- **Savings: 5KB** (critical for staying within budget)

### Modular Design
- Prism.js: Import only needed languages individually
- Highlight.js: Bundled languages (harder to tree-shake)

### Tree-shaking Support
- Prism.js: Excellent tree-shaking with Vite
- Highlight.js: Moderate tree-shaking support

### Language Loading Strategy
**Core languages (always loaded):**
- JavaScript (~1KB)
- TypeScript (~1.2KB)
- Python (~0.8KB)
- JSON (~0.3KB)
- Bash (~0.5KB)

**Total core:** ~3.8KB

**Extended languages (lazy-loaded on demand):**
- HTML, CSS, SQL, Java, Go (~2.8KB)

### Bundle Strategy
Use code-splitting to lazy-load Prism.js:
- Main bundle: 35KB (unchanged)
- Markdown chunk: 25KB (markdown-it + dompurify)
- **Syntax chunk: ~6KB (lazy-loaded)** ← NEW
- **Total initial load: 35KB** ✅ (within budget)

**Trade-offs:**
- ❌ No auto language detection (must specify ```language)
- ✅ Smaller bundle (critical for widget)
- ✅ Better tree-shaking
- ✅ More control over loaded languages

**Alternatives Considered:**
1. **Highlight.js:** Rejected due to 5KB larger bundle size
2. **Server-side highlighting:** Rejected (not feasible for N8n webhook architecture)
3. **No highlighting:** Rejected (poor developer experience)

**Impact:**
- Bundle size: Stays within 50KB limit ✅
- Performance: <10ms per code block (target met)
- Developer experience: Good (syntax highlighting expected feature)

**References:**
- Prism.js: https://prismjs.com/
- Bundle analysis: See WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md

---

## ADR-009: Syntax Highlighter Integration Strategy (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 5-6 - Need to integrate syntax highlighter with existing MarkdownRenderer. Two approaches considered: post-processing vs markdown-it plugin.

**Decision:** Use **post-processing** (highlight after markdown rendering), not markdown-it plugin

**Approach:**
```typescript
class MarkdownRenderer {
  render(markdown: string): string {
    // Step 1: Parse markdown → HTML
    const html = this.md.render(markdown);

    // Step 2: Sanitize HTML (BEFORE highlighting)
    const safeHtml = this.sanitizer.sanitize(html);

    // Step 3: Highlight code blocks (NEW)
    if (this.highlighter) {
      return this.highlighter.highlight(safeHtml);
    }

    return safeHtml;
  }
}
```

**Rationale:**

### Separation of Concerns
- Markdown parsing (markdown-it)
- XSS sanitization (XssSanitizer)
- Syntax highlighting (SyntaxHighlighter)
- Each module has single responsibility

### Lazy Loading
- Post-processing allows SyntaxHighlighter to be lazy-loaded
- markdown-it plugin would require bundling with markdown-it
- Better for bundle size optimization

### Integration with Existing Sanitizer
- XssSanitizer already allows `<span class="...">` for highlighting
- Sanitize BEFORE highlighting (not after)
- Highlighting only adds safe markup (no user input)

### Flexibility
- Easy to enable/disable highlighting
- Easy to swap highlighter libraries
- No coupling to markdown-it internals

**Alternatives Considered:**

1. **markdown-it Plugin:**
   - ✅ Cleaner integration with markdown-it
   - ❌ Harder to lazy-load
   - ❌ More tightly coupled
   - ❌ Sanitizer must run after highlighting

2. **Client-side highlighting after DOM insertion:**
   - ✅ Zero bundle for widget
   - ❌ Requires DOM manipulation
   - ❌ FOUC (flash of unstyled code)
   - ❌ Not feasible for IIFE widget

**Trade-offs:**
- ❌ Requires parsing HTML to find code blocks (regex or DOM)
- ✅ Clean architecture (single responsibility)
- ✅ Easy to lazy-load
- ✅ Works with existing sanitizer

**Impact:**
- Architecture: Maintains clean separation of concerns
- Performance: Minimal overhead (regex matching is fast)
- Security: No impact (sanitizer runs before highlighting)

**References:**
- See WEEK_4_DAY_5-6_SYNTAX_HIGHLIGHTER_PLAN.md for full design

---

## ADR-010: Sanitize BEFORE Highlighting (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 5-6 - Need to decide order of operations: sanitize → highlight or highlight → sanitize.

**Decision:** **Sanitize BEFORE highlighting**, not after

**Order of Operations:**
1. Parse markdown to HTML (markdown-it)
2. **Sanitize HTML (XssSanitizer)** ← Step 2
3. **Highlight code blocks (SyntaxHighlighter)** ← Step 3

**Rationale:**

### XssSanitizer Already Allows Highlighting Markup
The MARKDOWN_PRESET whitelist includes:
- `<span>` tag (for syntax highlighting)
- `class` attribute on `<span>`, `<code>`, `<pre>` (for language classes)
- No need to sanitize after highlighting

### Highlighting Adds Safe Markup Only
Prism.js output:
```html
<span class="token keyword">const</span>
<span class="token operator">=</span>
<span class="token number">10</span>
```

- Only adds `<span>` tags with `class` attributes
- No user input in generated HTML
- All classes are safe (token-*, language-*)

### No User Input in Highlighting Output
```typescript
// Prism.js ONLY generates markup from code content
// User cannot inject attributes or tags through code

// Example:
const code = '<script>alert("XSS")</script>';
// After sanitization: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
// After highlighting: '<span class="token tag">...</span>' (safe)
```

### Alternative Approach (Rejected)
**Sanitize AFTER highlighting:**
- ❌ Risk of stripping highlighting markup if sanitizer config changes
- ❌ Must ensure sanitizer allows ALL Prism.js classes
- ❌ Potential for future bugs if Prism.js adds new markup

**Trade-offs:**
- ✅ Simpler reasoning (sanitize once, highlight on safe HTML)
- ✅ No risk of stripping highlighting markup
- ✅ Matches existing architecture (sanitize → render)
- ❌ Must ensure sanitizer whitelist includes highlighting tags (already done)

**Security Analysis:**
1. **User input:** Markdown text (potentially malicious)
2. **After parsing:** HTML with potential XSS (markdown-it output)
3. **After sanitization:** Safe HTML (all XSS removed)
4. **After highlighting:** Safe HTML + highlighting markup (no new user input)

**Verification:**
- XssSanitizer MARKDOWN_PRESET already includes:
  - `<span>` in allowedTags ✅
  - `class` in allowedAttributes for span/code/pre ✅
- Prism.js only generates safe markup ✅
- No user input in highlighting output ✅

**Impact:**
- Security: Maintained (no XSS vectors introduced)
- Performance: Minimal (one less sanitization pass)
- Maintainability: Clear reasoning (sanitize → highlight)

**References:**
- XssSanitizer MARKDOWN_PRESET: `widget/src/utils/xss-sanitizer.ts`
- Prism.js output format: https://prismjs.com/#basic-usage

---

## ADR-011: Theme System Using CDN CSS (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 5-6 - Need theme support (light/dark/auto) for syntax highlighting. Must minimize bundle size impact.

**Decision:** Use **CDN-hosted CSS themes**, not bundled CSS

**Approach:**
```typescript
class SyntaxHighlighter {
  setTheme(theme: 'light' | 'dark' | 'auto') {
    const themeUrl = theme === 'dark'
      ? 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-okaidia.min.css'
      : 'https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css';

    // Inject theme CSS dynamically
    this.injectThemeCSS(themeUrl);
  }
}
```

**Rationale:**

### Bundle Size Impact
- Bundled CSS: ~1KB per theme (2 themes = 2KB)
- CDN CSS: ~0KB bundle impact ✅
- Only CSS injection logic: ~0.5KB

### Browser Caching
- CDN CSS cached across all websites using Prism.js
- Likely already cached in user's browser
- Fast load times (<50ms)

### Theme Flexibility
- Easy to add new themes (just change URL)
- No need to rebuild widget for theme changes
- Users can provide custom theme URLs

### Auto Theme Detection
```typescript
if (theme === 'auto') {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  theme = isDark ? 'dark' : 'light';
}
```

**Alternatives Considered:**

1. **Bundle CSS in widget:**
   - ✅ Faster initial load (no CDN request)
   - ❌ +2KB bundle size (would exceed 50KB limit)
   - ❌ Less flexible (must rebuild for theme changes)

2. **Inline CSS in JavaScript:**
   - ✅ No CDN dependency
   - ❌ +1KB bundle size per theme
   - ❌ Harder to maintain (CSS in JS strings)

3. **No themes (use default only):**
   - ✅ Zero bundle impact
   - ❌ Poor UX (no dark mode support)
   - ❌ Competitive disadvantage

**Trade-offs:**
- ❌ Requires CDN availability (edge case: CDN down)
- ❌ Extra HTTP request (mitigated by caching)
- ✅ Zero bundle impact (critical for staying under 50KB)
- ✅ Easy theme customization
- ✅ Browser caching benefits

**Fallback Strategy:**
```typescript
// If CDN fails, fallback to minimal inline CSS
if (!themeCSSLoaded) {
  this.injectFallbackCSS();
}
```

**Impact:**
- Bundle size: ~0KB (only injection logic)
- Performance: <50ms (CDN + browser cache)
- UX: Good (light/dark/auto theme support)

**References:**
- Prism.js CDN: https://www.jsdelivr.com/package/npm/prismjs
- Theme preview: https://prismjs.com/themes.html

---

## Previous Decisions

### ADR-007: Markdown Renderer - Sanitize After Parsing (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 3-4 - Markdown Renderer implementation

**Decision:** Sanitize HTML AFTER markdown parsing, not before

**Rationale:**
- Prevents double-escaping issues
- Allows markdown syntax to work correctly
- Sanitizer can see full HTML structure
- Matches industry best practices (GitHub, Stack Overflow)

**Implementation:**
```typescript
render(markdown: string): string {
  const html = this.md.render(markdown);      // Step 1: Parse
  const safeHtml = this.sanitizer.sanitize(html);  // Step 2: Sanitize
  return safeHtml;
}
```

**References:** See `docs/modules/WEEK_4_DAY_3-4_MARKDOWN_RENDERER.md`

---

### ADR-006: XSS Sanitizer Test Environment (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 1-2 - XSS Sanitizer tests failing with Happy-DOM

**Decision:** Use JSDOM for tests (not Happy-DOM)

**Rationale:**
- DOMPurify creates iframe elements for safe sanitization
- Happy-DOM has incomplete iframe implementation (contentWindow.console is null)
- JSDOM has full iframe support
- No production impact (widget uses real browser DOM)

**Implementation:**
```typescript
/**
 * @vitest-environment jsdom
 */
```

**References:** See `docs/modules/WEEK_4_DAY_1-2_XSS_SANITIZER.md`

---

### ADR-005: Widget Bundle Size Limit (2025-11-09)

**Status:** Accepted
**Context:** Phase 3 - Widget Engine development

**Decision:** Strict 50KB gzipped bundle size limit for widget

**Rationale:**
- Fast load times on slow connections (<100ms on 3G)
- Competitive with other chat widgets
- Forces careful dependency selection

**Monitoring:**
- Current bundle: 48.23 KB gzipped
- Remaining budget: ~2KB

---

### ADR-004: Backend-First Development Strategy (2025-11-08)

**Status:** Accepted
**Context:** Overall project strategy

**Decision:** Build backend APIs before frontend

**Rationale:**
- APIs are harder to change post-launch
- Backend has complex business logic (payments, licenses)
- Stable APIs enable parallel frontend development

---

### ADR-003: Next.js 15 with App Router (2025-11-08)

**Status:** Accepted
**Context:** Phase 1 - Technology stack selection

**Decision:** Use Next.js 15 with App Router (not Pages Router)

**Rationale:**
- Server Components reduce client bundle
- Built-in API routes (no separate backend)
- Vercel deployment optimization
- SEO benefits for marketing pages

---

### ADR-002: Domain Validation Mandatory (2025-11-08)

**Status:** Accepted
**Context:** License system security

**Decision:** Validate domain on every widget load (referer header)

**Rationale:**
- Prevents license key theft/sharing
- Real-time status checking
- No client-side license keys

**Implementation:** See `lib/license/validate.ts`

---

### ADR-001: Widget Framework Choice (2025-11-08)

**Status:** Accepted
**Context:** Phase 3 - Widget technology

**Decision:** Vanilla JavaScript IIFE (not React/Vue)

**Rationale:**
- Framework-agnostic (works on any website)
- Smallest bundle size (<50KB gzipped)
- No dependency conflicts
- Single script tag deployment

---

## Decision Template

```markdown
## ADR-XXX: Title (YYYY-MM-DD)

**Status:** Proposed | Accepted | Deprecated | Superseded
**Context:** What problem are we solving?

**Decision:** What did we decide?

**Rationale:** Why did we decide this?

**Alternatives Considered:**
1. Option A: Pros/cons
2. Option B: Pros/cons

**Trade-offs:**
- ❌ Disadvantage 1
- ✅ Advantage 1

**Impact:**
- Performance: X
- Security: Y
- Maintainability: Z

**References:** Links to related docs
```

---

**Last Updated:** 2025-11-12
**Total Decisions:** 11

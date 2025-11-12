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

---

## ADR-012: Lazy Load Markdown Modules (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 7-8 - Performance optimization phase. Current bundle is 48.23KB (96% of 50KB limit). All markdown modules (DOMPurify, markdown-it, Prism.js) are bundled in main chunk, totaling 31KB.

**Problem:** Initial bundle is too large. Users pay 31KB upfront even if they never see markdown messages.

**Decision:** Use **dynamic imports** to lazy-load markdown modules on first use

**Implementation:**

```typescript
// Dynamic import creates separate chunk
const { MarkdownRenderer } = await import(
  /* webpackChunkName: "markdown" */
  './markdown-renderer'
);
```

**Bundle Impact:**

**Before:**
- main.js: 48.23 KB (everything bundled)

**After:**
- main.js: ~17KB (core widget only) ← **64% reduction**
- markdown.js: ~31KB (loaded on first markdown message)

**Rationale:**

1. **Massive initial load reduction:** 48KB → 17KB (instant page load)
2. **Progressive enhancement:** Widget loads instantly, markdown loads on demand
3. **User behavior:** Most users see widget before any markdown messages
4. **Browser support:** Dynamic imports well-supported (Chrome 63+, Firefox 67+, Safari 11.1+)
5. **UX acceptable:** 100ms load time for first markdown message is imperceptible

**Trade-offs:**
- ✅ 64% faster initial load (48KB → 17KB)
- ✅ Stays within bundle budget (no changes needed)
- ✅ Better Time to Interactive (TTI)
- ✅ Better First Contentful Paint (FCP)
- ❌ Slight delay on first markdown message (~100ms)
- ❌ More async complexity (promises everywhere)
- ❌ Requires network request for markdown chunk

**Impact:**
- Performance: **High positive** (64% faster initial load)
- User Experience: **High positive** (instant widget, slight delay on first message)
- Bundle Size: **High positive** (maintains 50KB limit with room to grow)
- Code Complexity: **Medium negative** (async loading adds complexity)

**References:**
- Full Plan: `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`
- Vite Code Splitting: https://vitejs.dev/guide/build.html#chunking-strategy

---

## ADR-013: LRU Cache with TTL for Markdown Rendering (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 7-8 - Performance optimization. Duplicate markdown messages are re-parsed every time, wasting CPU. Typical chat has 60-80% duplicate content (common messages, greetings, etc.).

**Problem:** Every markdown render re-parses from scratch (25ms per message). No caching strategy.

**Decision:** Implement **LRU (Least Recently Used) cache** with TTL and memory limits

**Configuration:**

```typescript
const DEFAULT_CACHE_CONFIG = {
  maxEntries: 100,           // Max 100 cached messages
  maxMemory: 10 * 1024 * 1024,  // 10MB memory limit
  ttl: 5 * 60 * 1000,        // 5-minute TTL (stale eviction)
};
```

**Architecture:**

```typescript
class MarkdownCache {
  private cache = new Map<string, CacheEntry>();

  get(markdown: string): string | null {
    // 1. Check if cached
    // 2. Check TTL (evict if stale)
    // 3. Update access count (for LRU)
    // 4. Return cached HTML
  }

  set(markdown: string, html: string): void {
    // 1. Check memory limit (evict LRU if needed)
    // 2. Check entry limit (evict LRU if needed)
    // 3. Store in cache
  }
}
```

**Performance Impact:**

**Before (no caching):**
- First render: 25ms
- Second render (same message): 25ms ← **wasted work**
- Third render (same message): 25ms ← **wasted work**

**After (with cache):**
- First render (cache miss): 25ms
- Second render (cache hit): <1ms ← **25x faster!**
- Third render (cache hit): <1ms ← **98% reduction**

**Expected Cache Hit Rate:** 60-80% (based on typical chat patterns)

**Rationale:**

1. **LRU eviction:** Automatically removes least-used entries when limit reached
2. **TTL eviction:** Prevents serving stale content (5-minute freshness)
3. **Memory limit:** Prevents unbounded growth (10MB max)
4. **Entry limit:** Prevents excessive cache entries (100 max)
5. **Hash-based keys:** Fast lookup with string hashing

**Eviction Strategy:**

1. **On memory pressure:** Evict 50% of cache (sorted by access count)
2. **On TTL expiry:** Remove stale entries (>5 minutes old)
3. **On entry limit:** Evict least recently used entry

**Trade-offs:**
- ✅ 98% faster for cached messages (1ms vs 25ms)
- ✅ Reduced CPU usage (better battery life on mobile)
- ✅ Better perceived performance
- ✅ Cache hits scale with message volume
- ❌ Added memory usage (5-10MB for cache)
- ❌ Cache management complexity (eviction logic)
- ❌ Potential stale content (mitigated by TTL)

**Impact:**
- Performance: **Very high positive** (98% reduction for cache hits)
- User Experience: **Very high positive** (instant renders for common messages)
- Memory: **Medium negative** (5-10MB cache overhead)
- Code Complexity: **Medium negative** (cache management logic)

**References:**
- LRU Cache Pattern: https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)
- Full Plan: `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`

---

## ADR-014: Split Prism.js into Separate Chunk (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 7-8 - Bundle optimization. Prism.js is 6KB but only used when code blocks are present in messages. Not all messages contain code blocks.

**Problem:** Users pay 6KB cost for Prism.js even if they never see code blocks.

**Decision:** Split Prism.js into **separate lazy-loaded chunk** (apart from markdown-it chunk)

**Bundle Structure:**

**Before:**
- main.js: 17KB
- markdown.js: 31KB (markdown-it + DOMPurify + Prism.js)

**After:**
- main.js: 17KB (unchanged)
- markdown.js: 25KB (markdown-it + DOMPurify only)
- syntax.js: 6KB (Prism.js only) ← **NEW**

**Rationale:**

1. **Optional feature:** Not all messages contain code blocks
2. **6KB savings:** Users without code don't pay Prism.js cost
3. **Progressive enhancement:** Syntax highlighting loads on first code block
4. **Easy implementation:** Already using dynamic imports for markdown
5. **Better separation:** Code highlighting is distinct from markdown parsing

**Loading Strategy:**

```typescript
// markdown-renderer.ts
async render(markdown: string): string {
  const html = this.md.render(markdown);
  const safeHtml = this.sanitizer.sanitize(html);

  // Only load syntax highlighter if code blocks present
  if (html.includes('<code class="language-')) {
    const { SyntaxHighlighter } = await import('./syntax-highlighter');
    return SyntaxHighlighter.highlight(safeHtml);
  }

  return safeHtml;
}
```

**Trade-offs:**
- ✅ 6KB savings for users without code
- ✅ Better separation of concerns
- ✅ Smaller markdown chunk (25KB instead of 31KB)
- ✅ Optional feature properly isolated
- ❌ Two network requests instead of one (if code present)
- ❌ Slightly more complex loading logic
- ❌ Minimal delay for first code block (~50ms)

**Impact:**
- Performance: **Medium positive** (6KB savings for most users)
- Bundle Size: **Medium positive** (better chunk granularity)
- User Experience: **Neutral** (slight delay only for first code block)
- Code Complexity: **Low negative** (minor additional async logic)

**References:**
- Vite Manual Chunks: https://rollupjs.org/configuration-options/#output-manualchunks
- Full Plan: `docs/modules/WEEK_4_DAY_7-8_PERFORMANCE_OPTIMIZATION_PLAN.md`

---

**Last Updated:** 2025-11-12
**Total Decisions:** 14

## ADR-015: Create MarkdownPipeline Orchestrator (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 9-10 - Markdown integration architecture. Need to connect five completed markdown modules (XssSanitizer, MarkdownRenderer, SyntaxHighlighter, LazyLoader, MarkdownCache) into the existing MessageList component.

**Decision:** Create **MarkdownPipeline orchestrator class** to coordinate all markdown modules

**Approach:**
```typescript
export class MarkdownPipeline {
  private renderer: MarkdownRenderer | null = null;
  private cache: MarkdownCache;
  private isInitialized: boolean = false;

  async renderAsync(markdown: string): Promise<string> {
    // 1. Check cache
    const cached = this.cache.get(markdown);
    if (cached) return cached;

    // 2. Lazy load modules (first call only)
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 3. Render markdown
    const html = this.renderer!.render(markdown);

    // 4. Cache result
    this.cache.set(markdown, html);

    return html;
  }
}
```

**Rationale:**

### Separation of Concerns
- MessageList shouldn't know about lazy loading internals
- MessageList shouldn't manage cache state
- MessageList shouldn't handle markdown errors
- Single responsibility: MessageList renders UI, MarkdownPipeline renders markdown

### Centralized Error Handling
- One place to implement graceful degradation (fallback to plain text)
- Consistent error logging and reporting
- Prevents cascade failures (one module error doesn't break widget)

### Testability
- Easy to mock MarkdownPipeline in MessageList tests
- Integration tests focus on pipeline behavior (not UI concerns)
- Clear interface: `renderAsync(markdown) → html`

### Single Entry Point
- One class to import in MessageList
- One constructor to configure (markdown + cache config)
- One method to call (renderAsync)

**Alternatives Considered:**

1. **Direct integration in MessageList:**
   - Too much complexity in MessageList (violates single responsibility)
   - Hard to test (mocking LazyLoader, MarkdownRenderer, MarkdownCache)
   - Error handling scattered (multiple try-catch blocks)
   - MessageList exceeds 400 LOC (module size violation)

2. **Use MarkdownRenderer directly (no orchestrator):**
   - No lazy loading (bundle size impact)
   - No caching (performance impact)
   - No centralized error handling
   - MessageList still has too much logic

**Trade-offs:**
- Clean architecture (separation of concerns)
- Easy to test (mockable interface)
- Centralized error handling
- Keeps MessageList under 400 LOC
- One additional file (250 LOC)
- One additional abstraction layer

**Impact:**
- Code quality: High positive (clean separation of concerns)
- Testability: High positive (easy to mock, clear interface)
- Module size: Positive (250 LOC, within ideal range)
- Performance: Neutral (orchestration overhead negligible)
- Maintainability: High positive (single place to change markdown logic)

**References:**
- Full plan: docs/modules/WEEK_4_DAY_9-10_MARKDOWN_INTEGRATION_ARCHITECTURE.md

---

## ADR-016: Always Enable Markdown by Default (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 9-10 - Markdown integration. Need to decide default behavior: markdown enabled or disabled by default.

**Decision:** **Enable markdown rendering by default** (enableMarkdown: true)

**Rationale:**

### User Expectation
- Most modern chat widgets support markdown (Intercom, Drift, Zendesk)
- Developers expect code blocks to have syntax highlighting
- Users expect bold, italic, links to work
- No markdown = poor out-of-box experience

### Competitive Parity
- Intercom: Markdown enabled by default
- Drift: Markdown enabled by default
- Zendesk: Markdown enabled by default
- Slack: Markdown enabled by default
- Not supporting markdown = competitive disadvantage

### Minimal Cost (Lazy Loading)
- Initial bundle: 18KB (markdown NOT loaded)
- First markdown: +25KB (lazy loaded on first assistant message)
- Users without markdown: 0KB cost (never loads)
- Lazy loading makes "always on" acceptable

### Easy to Disable
- One-line config: enableMarkdown: false
- No code changes required
- Instant effect (no re-build needed)

**Alternatives Considered:**

1. **Opt-in markdown (disabled by default):**
   - Poor out-of-box experience (users must discover feature)
   - Higher support burden ("How do I enable markdown?")
   - Lower feature adoption (users don't know it exists)
   - Competitive disadvantage (other widgets have it enabled)

2. **Auto-detect markdown (parse only if syntax detected):**
   - Regex overhead (1-2ms per message)
   - May miss edge case markdown syntax
   - Complex logic (regex patterns must be maintained)
   - User confusion ("Why isn't my markdown working?")

**Trade-offs:**
- Best out-of-box experience (works immediately)
- Competitive with other chat widgets
- Easy to disable (one config flag)
- Lazy loading mitigates bundle cost
- Users who don't want markdown must opt-out
- Slight initial bundle increase (+1KB for MarkdownPipeline)

**Impact:**
- User experience: Very high positive (works out-of-box)
- Feature adoption: High positive (discoverable, expected)
- Bundle size: Neutral (lazy loading mitigates cost)
- Support burden: Positive (fewer "how do I enable?" questions)

---

## ADR-017: Render Only Assistant Messages as Markdown (2025-11-12)

**Status:** Accepted
**Context:** Week 4 Day 9-10 - Markdown integration. Need to decide which messages should render as markdown: all messages, assistant only, user only, or per-message flag.

**Decision:** Render **only assistant messages** as markdown (user messages always plain text)

**Rationale:**

### Security (XSS Prevention)
- User messages are untrusted input (user controls content)
- Rendering user input as HTML creates XSS vector
- Even with sanitization, user HTML should be escaped (defense in depth)
- Assistant messages are server-controlled (N8n workflow)

### Industry Standard
- Slack: User messages plain text, bot messages support markdown
- Discord: User messages plain text (unless explicitly formatted)
- GitHub: Comments support markdown (trusted users)
- Stack Overflow: Markdown for questions/answers (not chat)

### Performance
- User messages rarely contain markdown (mostly short questions)
- Parsing user messages wastes CPU cycles (25ms per message)
- Expected markdown usage: <5% of user messages, >80% of assistant messages
- Skipping user messages saves ~95% of unnecessary parsing

### Consistency with Chat Patterns
- Users type plain text naturally ("How do I reset my password?")
- Assistants provide rich responses (code examples, formatted lists)
- Markdown in user messages feels unexpected/awkward

**Alternatives Considered:**

1. **Render all messages as markdown:**
   - Security risk (user input rendered as HTML)
   - Performance impact (parse every user message)
   - May break existing plain text user messages

2. **Per-message flag (server/client control):**
   - Maximum flexibility (decide per-message)
   - Supports rich user messages (if needed)
   - Adds complexity to Message interface
   - Requires N8n workflow changes
   - Can be added later without breaking changes (future enhancement)

**Trade-offs:**
- Security: User input never rendered as HTML (XSS prevention)
- Performance: Skip ~95% of unnecessary markdown parsing
- Industry standard: Matches user expectations (Slack, Discord)
- Simple rule: Easy to understand and maintain
- No markdown in user messages (can't send bold as user)
- Future: Can add per-message flag if needed (not breaking)

**Impact:**
- Security: Very high positive (XSS prevention for user input)
- Performance: High positive (skip ~95% of parsing)
- User experience: Neutral (users rarely use markdown in chat)
- Maintainability: High positive (simple rule, easy to reason about)

---

**Last Updated:** 2025-11-12
**Total Decisions:** 17

# N8n Widget Designer Platform - Planning Documentation

**Last Updated:** 2025-11-24
**Status:** Implementation Complete

---

## Project Mission

Build a production-ready SaaS platform that enables users to visually design, purchase, and deploy embeddable chat widgets for N8n workflows.

---

## Core Principles

### Development Methodology
- **Test-Driven Development (TDD)**: RED → GREEN → REFACTOR workflow
- **Type Safety**: Full TypeScript coverage, strict mode
- **Security First**: Authentication, authorization, input validation
- **Modularity**: Single-purpose modules, ideal 200-400 LOC

### Architecture
- **Backend-First**: Stable API contracts before UI development
- **Three-Tier**: Frontend (Next.js) → Backend (API Routes) → Database (PostgreSQL)
- **Widget Isolation**: Standalone IIFE bundle, framework-agnostic

---

## Technology Decisions

### Backend
- **Next.js 16** (App Router) - Server components, API routes
- **Drizzle ORM** - Type-safe database queries
- **JWT + HTTP-only cookies** - Secure session management
- **Zod** - Runtime validation

### Frontend
- **React 18** - UI components
- **Zustand** - State management
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling

### Widget
- **Vanilla TypeScript** - No framework dependencies
- **esbuild** - IIFE bundle generation
- **markdown-it** - Markdown rendering
- **DOMPurify** - XSS prevention

---

## Naming Conventions

### Files
- `kebab-case` for all files: `widget-store.ts`, `license-card.tsx`
- Test files mirror source: `validate.ts` → `validate.test.ts`

### Code
- `camelCase` for functions and variables: `getUserLicenses`, `licenseKey`
- `PascalCase` for types and components: `WidgetConfig`, `LicenseCard`
- `SCREAMING_SNAKE_CASE` for constants: `MAX_DOMAIN_LIMIT`

### Database
- `snake_case` for tables and columns (Drizzle convention)
- `camelCase` in TypeScript code (mapped automatically)

---

## Security Guidelines

1. **Secrets**: Environment variables only, never in code
2. **Tokens**: HTTP-only cookies, never localStorage
3. **Validation**: Zod schemas on all API inputs
4. **Authorization**: User ownership check on all resources
5. **SQL**: Parameterized queries via Drizzle ORM

---

## Performance Targets

- **API Response**: <200ms p95
- **Widget Bundle**: <50KB gzipped
- **Widget Load**: <100ms p95
- **Preview Latency**: <100ms updates

---

## License Tier Structure

| Tier | Price | Domains | Widgets | Branding |
|------|-------|---------|---------|----------|
| Basic | $29/year | 1 | 1 | Enabled |
| Pro | $49/year | 1 | 3 | Disabled |
| Agency | $149/year | Unlimited | Unlimited | Disabled |

---

## Key Architectural Decisions

### ADR-001: Vanilla JavaScript IIFE Widget
- Framework-agnostic for maximum compatibility
- No React/Vue dependencies in widget bundle

### ADR-002: Domain Validation Mandatory
- Prevent license key theft
- Referer header validation on widget serving

### ADR-003: Soft Delete for Data
- Status='deleted' instead of row deletion
- Preserve data for analytics and potential recovery

### ADR-004: JSONB for Widget Config
- Flexible schema evolution
- No migrations for config changes
- GIN index for query performance

### ADR-005: Lazy Load Markdown
- 64% bundle size reduction
- Load on first use only

---

## Documentation References

- **CLAUDE.md** - Project overview and quick reference
- **docs/development/PROGRESS.md** - Current status and completed features
- **docs/development/todo.md** - Active task tracking
- **docs/development/decisions.md** - Full ADR list

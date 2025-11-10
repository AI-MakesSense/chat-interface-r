# Phase 3 Module 1: Widget Schema Definition - Quick Reference

**Status:** Design Complete, Ready for Implementation
**Date:** November 9, 2025
**Est. Time:** 5 days (1 developer)

---

## What This Module Delivers

Phase 3 Module 1 provides the **foundation** for the widget system:

1. Database schema for widget storage (`widgets` table)
2. TypeScript types for widget configurations
3. Zod validation schemas with tier-based restrictions
4. Default configuration generators
5. Complete test coverage (1150 lines of tests)

---

## Key Documents

### 📘 Main Design Document
**File:** `PHASE_3_MODULE_1_DESIGN.md` (63 pages)

**Contains:**
- Complete architectural decisions
- Database schema definitions
- TypeScript type definitions
- Zod validation schemas
- Tier-based feature restrictions
- Module breakdown
- Test strategy
- TDD implementation order
- Risk assessment
- Configuration examples

### 📊 Visual Diagrams
**File:** `PHASE_3_MODULE_1_DIAGRAMS.md`

**Contains:**
- Database schema diagram (with relationships)
- Data flow diagrams (widget creation, update, serving)
- Validation flow diagram
- Tier restriction matrix
- Module dependency graph
- Configuration structure tree
- Migration strategy

### 📝 Architectural Decisions
**File:** `C:\Projects\Chat Interfacer\n8n-widget-designer\docs\development\decisions.md`

**New ADRs:**
- ADR-014: Hybrid Database Schema for Widget Storage
- ADR-015: One-to-Many Relationship (License → Widgets)
- ADR-016: Tier-Aware Validation with Zod Refinements
- ADR-017: Smart Defaults Based on Tier

---

## Quick Summary

### Database Schema

**New `widgets` table:**
- `id`, `licenseId`, `name`, `status`
- `config` (JSONB - full widget configuration)
- `version`, `deployedAt`, `createdAt`, `updatedAt`
- Indexes: licenseId, status, config (GIN)

**Update `licenses` table:**
- Add `widgetLimit` field (1, 3, or -1)

**Relationship:**
- `licenses` 1:N `widgets` (one license has many widgets)

### Widget Configuration Structure

```
WidgetConfig
├─ branding (company name, logo, welcome text, branding toggle)
├─ theme (colors, position, size, typography, dark mode)
├─ advancedStyling (message styling, markdown styling) [Pro/Agency only]
├─ behavior (auto-open, persist messages, notifications)
├─ connection (n8n webhook URL, route, timeout)
└─ features (attachments, email transcript, rating) [tier-restricted]
```

### Tier-Based Limits

| Feature | Basic | Pro | Agency |
|---------|-------|-----|--------|
| Max Widgets | 1 | 3 | Unlimited |
| Branding Required | Yes | No | No |
| Advanced Styling | No | Yes | Yes |
| Email Transcript | No | Yes | Yes |
| Rating Prompt | No | Yes | Yes |

### File Structure

```
lib/
├── db/
│   ├── schema.ts (UPDATE - add widgets table)
│   ├── queries.ts (UPDATE - add widget CRUD)
│   └── migrations/migrate-widget-configs.ts (NEW)
├── types/
│   └── widget-config.ts (NEW - 350 lines)
├── validation/
│   └── widget-schema.ts (NEW - 400 lines)
└── widget/
    ├── defaults.ts (NEW - 250 lines)
    └── validation.ts (NEW - 150 lines)

tests/
├── unit/
│   ├── validation/widget-schema.test.ts (400 lines)
│   └── widget/
│       ├── defaults.test.ts (200 lines)
│       └── validation.test.ts (150 lines)
└── integration/
    └── db/widgets.test.ts (300 lines)
```

---

## Implementation Order (TDD)

### Day 1: Database Schema
- Write tests for widgets table
- Implement widgets table in schema.ts
- Write tests for widget queries
- Implement queries in queries.ts

### Day 1-2: TypeScript Types
- Create widget-config.ts with all interfaces
- No tests needed (compile-time only)

### Day 2-3: Validation Schemas
- Write tests for base schemas (branding, theme, features)
- Implement base schemas in widget-schema.ts
- Write tests for tier-aware validation
- Implement tier restriction logic

### Day 3-4: Default Generators
- Write tests for default configs
- Implement generateDefaultConfig()
- Verify defaults pass validation

### Day 4: Validation Helpers
- Write tests for validation helpers
- Implement validateWidgetConfig()
- Implement canEnableFeature()

### Day 5: Migration Script
- Write tests for migration
- Implement migrate-widget-configs.ts
- Test on sample data

---

## Success Criteria

- [ ] All 1150 tests passing
- [ ] widgets table created with indexes
- [ ] Widget CRUD operations working
- [ ] Tier-aware validation enforced
- [ ] Default configs generated for all tiers
- [ ] Migration script tested on sample data
- [ ] No type errors (`pnpm type-check`)
- [ ] Documentation complete

---

## Next Modules (Phase 3)

**Module 2:** Widget CRUD API
- POST /api/widgets (create widget)
- GET /api/widgets/:id (get widget)
- PUT /api/widgets/:id (update widget)
- DELETE /api/widgets/:id (delete widget)
- GET /api/licenses/:id/widgets (list widgets for license)

**Module 3:** Widget Serving
- GET /api/widget/:license/chat-widget.js (serve widget)
- License validation
- Config injection
- Tier flag enforcement

**Module 4:** Frontend Integration
- Widget configurator UI
- Live preview
- Dashboard widget management

---

## Questions or Issues?

Refer to the complete design documents for detailed information:
- `PHASE_3_MODULE_1_DESIGN.md` - Complete technical specification
- `PHASE_3_MODULE_1_DIAGRAMS.md` - Visual architecture and flows
- `decisions.md` - Architectural decision rationale

---

**Last Updated:** November 9, 2025
**Version:** 1.0

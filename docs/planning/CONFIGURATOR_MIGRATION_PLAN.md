# Configurator Migration Plan

## Overview

Replace the current widget configurator with the modern playground-style UI/UX from `chat-widget-playground`. This is a **full replacement** (Option A) approach.

**Decisions Made:**
- ✅ Remove download buttons
- ✅ Remove domain info card
- ✅ Full replacement of configurator
- ✅ Build starter prompts UI first, plug into existing store (JSONB supports it)
- ✅ Preview stays as simulated (direct webhook)
- ✅ Mobile responsiveness is a later phase
- ✅ Dashboard unchanged

---

## Phase 1: Types & Store Update

**Files to Modify:**
- `stores/widget-store.ts` - Extend WidgetConfig with new properties
- `lib/validation/widget-config.ts` - Update Zod schema

**New Config Properties to Add:**
```typescript
// Color System
useAccent: boolean;
accentColor: string;
useTintedGrayscale: boolean;
tintHue: number;
tintLevel: number;
shadeLevel: number;
useCustomSurfaceColors: boolean;
surfaceBackgroundColor: string;
surfaceForegroundColor: string;
useCustomIconColor: boolean;
customIconColor: string;
useCustomUserMessageColors: boolean;
customUserMessageTextColor: string;
customUserMessageBackgroundColor: string;

// Typography
fontFamily: string;
fontSize: number;
useCustomFont: boolean;
customFontName: string;
customFontCss: string;

// Style
radius: 'none' | 'small' | 'medium' | 'large' | 'full';
density: 'compact' | 'default' | 'relaxed';

// Start Screen
greeting: string;
starterPrompts: Array<{ label: string; icon: string }>;

// Composer
composerPlaceholder: string;
```

**Estimated Effort:** Small - extending existing interfaces

---

## Phase 2: New Configurator Components

**New Files to Create:**

### 2.1 UI Primitives
```
components/configurator/ui/
├── switch.tsx           # Toggle switch component
├── accordion.tsx        # Collapsible sections
├── color-picker.tsx     # Color input with preview
└── slider.tsx           # Range slider with labels
```

### 2.2 Main Components
```
components/configurator/
├── config-sidebar.tsx       # Left sidebar with all config options (~800 lines)
├── preview-canvas.tsx       # Center preview area with resize + modes
├── chat-preview.tsx         # Simulated chat widget preview
├── code-modal.tsx           # Export code modal
└── icon-picker.tsx          # Icon selector for prompts
```

**Key Features:**
- Collapsible sections with accordions
- Toggle-driven advanced options (expand on enable)
- Real-time preview updates
- Three embed modes: Inline, Full Page, Website Chat (popup)
- Resizable preview with drag handles

---

## Phase 3: Replace Configurator Page

**File to Modify:**
- `app/configurator/page.tsx` - New layout structure

**New Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Header: Back to Dashboard | Widget Name | Save      │
├────────────────┬────────────────────────────────────┤
│                │                                    │
│   Config       │      Preview Canvas                │
│   Sidebar      │   (Resizable, mode dropdown)       │
│   (Scrollable) │                                    │
│                │                                    │
│                │                                    │
│                │                                    │
├────────────────┴────────────────────────────────────┤
│ Footer: Get Code button → Opens CodeModal           │
└─────────────────────────────────────────────────────┘
```

---

## Phase 4: Integration & Cleanup

**Files to Delete:**
- `components/configurator/preview-frame.tsx` (old preview)
- `components/configurator/device-switcher.tsx` (replaced by mode dropdown)
- `components/configurator/domain-info-card.tsx` (removing per decision)

**Integration Tasks:**
- Connect sidebar controls to widget-store
- Wire "Get Code" button to CodeModal
- Ensure save persists all new config properties
- Test with existing widgets (backward compatible defaults)

---

## Phase 5: Widget Bundle Update (Future)

*Not part of this migration - separate task*

Update `widget/src/` to support new config options:
- Tinted grayscale theming
- Custom font injection
- Starter prompts rendering
- Density/radius options

---

## File Summary

| Action | Path | Description |
|--------|------|-------------|
| Modify | `stores/widget-store.ts` | Extend WidgetConfig type |
| Modify | `lib/validation/widget-config.ts` | Update Zod schema |
| Create | `components/configurator/ui/switch.tsx` | Toggle component |
| Create | `components/configurator/ui/accordion.tsx` | Collapsible section |
| Create | `components/configurator/ui/color-picker.tsx` | Color input |
| Create | `components/configurator/ui/slider.tsx` | Range slider |
| Create | `components/configurator/config-sidebar.tsx` | Main config panel |
| Create | `components/configurator/preview-canvas.tsx` | Preview area |
| Create | `components/configurator/chat-preview.tsx` | Chat simulation |
| Create | `components/configurator/code-modal.tsx` | Code export |
| Create | `components/configurator/icon-picker.tsx` | Icon selector |
| Modify | `app/configurator/page.tsx` | New layout |
| Delete | `components/configurator/preview-frame.tsx` | Old preview |
| Delete | `components/configurator/device-switcher.tsx` | Old device toggle |
| Delete | `components/configurator/domain-info-card.tsx` | Removed feature |

---

## Recommended Execution Order

1. **Phase 1** - Types & Store (foundation)
2. **Phase 2.1** - UI Primitives (reusable)
3. **Phase 2.2** - Main Components (parallel development possible)
4. **Phase 3** - Page Integration
5. **Phase 4** - Cleanup & Testing

---

## Notes

- JSONB columns already support new config properties - no DB migration needed
- Existing widgets will get default values for new properties
- Preview remains simulated (no actual widget bundle changes in this phase)
- Mobile responsiveness deferred to later phase

---

**Status:** Awaiting Approval

**Created:** 2025-11-24

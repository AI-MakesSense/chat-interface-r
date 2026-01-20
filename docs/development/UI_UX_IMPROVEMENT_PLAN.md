# UI/UX Improvement Plan - User Stories & Acceptance Criteria

**Created:** 2026-01-20
**Status:** Planning
**Priority:** Improve user experience for production launch

---

## Overview

This document contains atomic user stories with acceptance criteria for UI/UX improvements identified in the comprehensive analysis. Stories are organized by priority tier based on user impact.

---

## Implementation Progress

| Tier | Stories | Completed | Status |
|------|---------|-----------|--------|
| Tier 1 (Critical) | 4 | 4 | ✅ Complete |
| Tier 2 (High Priority) | 6 | 0 | 🔄 In Progress |
| Tier 3 (Medium Priority) | 6 | 0 | ⏳ Pending |

---

# 🔴 TIER 1: CRITICAL (Blocks User Flow)

---

## Story 1.1: Organize Configurator Sidebar with Tabs

**As a** widget creator
**I want** the configurator settings organized into logical tabs
**So that** I can easily find and modify settings without being overwhelmed

### Acceptance Criteria

- [x] Sidebar displays tab navigation at top with 5 tabs: Branding, Colors, Typography, Layout, Advanced
- [x] Only one tab's content is visible at a time
- [x] Tab state persists during the session (doesn't reset when switching)
- [x] Active tab is visually highlighted
- [x] Tab switching is instant (no loading delay)
- [x] Mobile: Tabs scroll horizontally if needed
- [x] All existing settings are preserved and functional

### Technical Notes

- File to modify: `components/configurator/config-sidebar.tsx`
- Use existing shadcn/ui Tabs component
- Group settings logically:
  - **Branding**: Company name, logo, welcome text, first message
  - **Colors**: Theme mode, accent color, grayscale settings
  - **Typography**: Font family, font size, font sources
  - **Layout**: Radius, density, position, size
  - **Advanced**: Starter prompts, custom CSS, behavior settings

---

## Story 1.2: Add Unsaved Changes Warning

**As a** widget creator
**I want** to be warned before leaving the configurator with unsaved changes
**So that** I don't accidentally lose my work

### Acceptance Criteria

- [x] Browser shows confirmation dialog when navigating away with unsaved changes
- [x] Confirmation dialog appears for: browser back, closing tab, clicking external links
- [x] No warning shown if changes have been saved
- [x] "Save" button visual state changes when there are unsaved changes (e.g., pulsing or highlighted)
- [x] After saving, warning is disabled until next change

### Technical Notes

- File to modify: `components/configurator/n8n/page.tsx`, `components/configurator/chatkit/page.tsx`
- `hasUnsavedChanges` state already exists but isn't used
- Use `window.beforeunload` event
- Use Next.js router events for internal navigation

---

## Story 1.3: Implement Forgot Password Flow

**As a** user who forgot their password
**I want** to reset my password via email
**So that** I can regain access to my account

### Acceptance Criteria

- [x] "Forgot password?" link on login page navigates to `/auth/forgot-password`
- [x] Forgot password page has email input field
- [x] Submitting valid email shows success message (even if email doesn't exist - security)
- [x] Invalid email format shows validation error
- [x] Rate limited to 3 requests per email per hour
- [x] Password reset tokens expire after 1 hour
- [x] Reset link in email leads to `/auth/reset-password?token=xxx`
- [x] Reset password page validates token before showing form
- [x] New password must meet same requirements as signup
- [x] Successful reset redirects to login with success message

### Technical Notes

- Create: `app/auth/forgot-password/page.tsx`
- Create: `app/auth/reset-password/page.tsx`
- Create: `components/auth/forgot-password-form.tsx`
- Create: `components/auth/reset-password-form.tsx`
- Use existing `passwordResetTokens` table
- Email sending is optional for MVP (can show token in console for now)

---

## Story 1.4: Create Pricing Page

**As a** potential customer
**I want** to view pricing information
**So that** I can choose the right plan for my needs

### Acceptance Criteria

- [x] `/pricing` route exists and renders pricing page
- [x] Displays 3 tiers: Basic ($29/year), Pro ($49/year), Agency ($149/year)
- [x] Each tier shows: price, features included, limitations
- [x] Visual distinction for recommended plan (Pro)
- [x] CTA buttons for each tier ("Get Started" or "Current Plan" if logged in)
- [x] Responsive design works on mobile
- [x] Consistent styling with landing page

### Technical Notes

- Create: `app/pricing/page.tsx`
- Reuse landing page styling patterns
- Tier details from `lib/config/defaults.ts`

---

# 🟡 TIER 2: HIGH PRIORITY (Major UX Friction)

---

## Story 2.1: Add Autosave with Status Indicator

**As a** widget creator
**I want** my configuration to autosave periodically
**So that** I don't lose work if I forget to manually save

### Acceptance Criteria

- [ ] Configuration autosaves every 30 seconds if there are changes
- [ ] Status indicator shows: "Saved ✓", "Saving...", or "Unsaved changes"
- [ ] Status indicator is visible in sidebar header
- [ ] Manual "Save" button still works and updates indicator
- [ ] Autosave doesn't trigger if no changes since last save
- [ ] Error state shown if autosave fails

### Technical Notes

- File to modify: `components/configurator/config-sidebar.tsx`
- Add `useEffect` with 30-second interval
- Track `lastSavedConfig` to compare for changes

---

## Story 2.2: Add Device Preview Presets

**As a** widget creator
**I want** to preview my widget at different screen sizes
**So that** I can ensure it looks good on all devices

### Acceptance Criteria

- [ ] Preview canvas has device preset buttons: Mobile (375px), Tablet (768px), Desktop (1024px)
- [ ] Clicking preset resizes preview to that width
- [ ] Current preset is visually highlighted
- [ ] Custom resize still works alongside presets
- [ ] Preview maintains aspect ratio appropriate to device

### Technical Notes

- File to modify: `components/configurator/preview-canvas.tsx`
- Add preset buttons above preview area
- Store selected preset in state

---

## Story 2.3: Fix Dashboard Loading State

**As a** dashboard user
**I want** to see a proper loading state when data is loading
**So that** I don't see a flash of "No widgets" before content appears

### Acceptance Criteria

- [ ] Dashboard shows loading skeleton until BOTH licenses AND widgets are loaded
- [ ] Skeleton matches the actual content layout (cards, grid)
- [ ] No flash of empty state before data loads
- [ ] Error state shown if data fails to load

### Technical Notes

- File to modify: `app/dashboard/page.tsx`
- Add combined loading state check
- Create skeleton components that match card layouts

---

## Story 2.4: Add Success Toasts for Auth Actions

**As a** user
**I want** confirmation when I successfully log in or sign up
**So that** I know my action completed

### Acceptance Criteria

- [x] Success toast appears after successful login: "Welcome back!"
- [x] Success toast appears after successful signup: "Account created successfully!"
- [x] Success toast appears after logout: "You've been logged out"
- [x] Toasts auto-dismiss after 3 seconds
- [x] Toasts are styled consistently with app theme

### Technical Notes

- Files to modify: `components/auth/login-form.tsx`, `components/auth/signup-form.tsx`
- Use existing `sonner` toast library (already installed)
- Add Toaster component to root layout if not present

---

## Story 2.5: Add Password Visibility Toggle

**As a** user entering my password
**I want** to toggle password visibility
**So that** I can verify I typed it correctly

### Acceptance Criteria

- [ ] Eye icon button appears inside password input field
- [ ] Clicking toggles between hidden (dots) and visible (text)
- [ ] Icon changes to indicate current state (eye vs eye-off)
- [ ] Works on both login and signup forms
- [ ] Works on both password and confirm password fields

### Technical Notes

- Files to modify: `components/auth/login-form.tsx`, `components/auth/signup-form.tsx`
- Use `lucide-react` Eye and EyeOff icons
- Toggle input type between "password" and "text"

---

## Story 2.6: Expose Dark Mode Toggle

**As a** user
**I want** to switch between light and dark mode
**So that** I can use the app comfortably in different lighting conditions

### Acceptance Criteria

- [ ] Theme toggle button visible in navbar/header
- [ ] Toggle switches between light, dark, and system modes
- [ ] Current theme persists across sessions (localStorage)
- [ ] Toggle uses appropriate icons (sun/moon)
- [ ] Works on both landing page and dashboard

### Technical Notes

- `next-themes` is already installed and configured
- File to modify: `components/landing/navbar.tsx`, `app/dashboard/page.tsx`
- Use shadcn/ui dropdown or simple toggle button

---

# 🟢 TIER 3: MEDIUM PRIORITY (Polish & Refinement)

---

## Story 3.1: Fix Footer Navigation Links

**As a** visitor
**I want** footer links to work
**So that** I can navigate to relevant pages

### Acceptance Criteria

- [ ] All footer links either navigate to real pages or are removed
- [ ] "Product" links: Features → scroll to features section
- [ ] "Company" links: Pricing → /pricing, Contact → mailto or contact form
- [ ] "Legal" links: Privacy, Terms → placeholder pages or remove
- [ ] No `href="#"` links remain

### Technical Notes

- File to modify: `components/landing/footer.tsx`
- Create placeholder legal pages or use scroll-to-section links

---

## Story 3.2: Add Widget Type Tooltips

**As a** new user creating a widget
**I want** to understand the difference between widget types
**So that** I can choose the right one for my needs

### Acceptance Criteria

- [ ] Info icon (?) appears next to each widget type option
- [ ] Hovering shows tooltip explaining the type
- [ ] N8n tooltip: "Connect to your N8n workflow for custom automation"
- [ ] ChatKit tooltip: "Direct OpenAI integration with built-in conversation management"
- [ ] Tooltips work on mobile (tap to show)

### Technical Notes

- File to modify: `components/dashboard/create-widget-modal.tsx`
- Use shadcn/ui Tooltip component

---

## Story 3.3: Add Breadcrumb Navigation to Configurator

**As a** user in the configurator
**I want** to see where I am in the app hierarchy
**So that** I can easily navigate back

### Acceptance Criteria

- [ ] Breadcrumb shows: Dashboard > Configurator > [Widget Name]
- [ ] "Dashboard" is clickable and navigates back
- [ ] Breadcrumb is visible at top of configurator page
- [ ] Styled consistently with app design

### Technical Notes

- Files to modify: `app/configurator/n8n/page.tsx`, `app/configurator/chatkit/page.tsx`
- Create reusable Breadcrumb component

---

## Story 3.4: Improve Copy Feedback Duration

**As a** user copying embed code
**I want** clear feedback that the copy succeeded
**So that** I'm confident the code is in my clipboard

### Acceptance Criteria

- [ ] "Copied!" state lasts 3 seconds (up from 2)
- [ ] Toast notification also appears confirming copy
- [ ] Works for all copy actions (embed code, widget key, etc.)

### Technical Notes

- Files to modify: `components/dashboard/widget-list.tsx`, `components/configurator/code-modal.tsx`
- Update setTimeout from 2000 to 3000
- Add toast.success() call

---

## Story 3.5: Add License Expiration Warning

**As a** license holder
**I want** to see when my license is expiring soon
**So that** I can renew before losing access

### Acceptance Criteria

- [ ] Warning badge appears on license card when < 30 days until expiry
- [ ] Badge shows "Expires in X days"
- [ ] Badge is yellow/orange for warning state
- [ ] No badge shown if expiry is > 30 days away or no expiry set

### Technical Notes

- File to modify: `components/dashboard/license-card.tsx`
- Calculate days until expiry from `license.expiresAt`

---

## Story 3.6: Add Accessible Labels to Icon Buttons

**As a** user using assistive technology
**I want** icon buttons to have accessible labels
**So that** I can understand what each button does

### Acceptance Criteria

- [ ] All icon-only buttons have `aria-label` attribute
- [ ] Delete button: `aria-label="Delete widget"`
- [ ] Edit button: `aria-label="Edit widget"`
- [ ] Copy button: `aria-label="Copy embed code"`
- [ ] Download button: `aria-label="Download widget"`

### Technical Notes

- Files to modify: `components/dashboard/widget-list.tsx`
- Add aria-label to all Button components with only icons

---

# 📋 Implementation Order

## Phase 1: Critical (Stories 1.1-1.4)
1. Story 1.1: Configurator tabs (biggest UX impact)
2. Story 1.2: Unsaved changes warning
3. Story 1.4: Pricing page (quick win)
4. Story 1.3: Forgot password flow (most complex)

## Phase 2: High Priority (Stories 2.1-2.6)
1. Story 2.4: Success toasts (quick win)
2. Story 2.5: Password visibility toggle (quick win)
3. Story 2.6: Dark mode toggle (quick win)
4. Story 2.3: Dashboard loading state
5. Story 2.2: Device preview presets
6. Story 2.1: Autosave indicator

## Phase 3: Medium Priority (Stories 3.1-3.6)
1. Story 3.6: Accessible labels (quick win)
2. Story 3.4: Copy feedback duration (quick win)
3. Story 3.5: License expiration warning
4. Story 3.1: Footer links
5. Story 3.2: Widget type tooltips
6. Story 3.3: Breadcrumb navigation

---

# 📊 Effort Estimates

| Story | Estimate | Complexity |
|-------|----------|------------|
| 1.1 Configurator Tabs | 2-3 hours | High |
| 1.2 Unsaved Changes Warning | 1 hour | Medium |
| 1.3 Forgot Password Flow | 3-4 hours | High |
| 1.4 Pricing Page | 1-2 hours | Medium |
| 2.1 Autosave Indicator | 1-2 hours | Medium |
| 2.2 Device Preview Presets | 1 hour | Low |
| 2.3 Dashboard Loading State | 1 hour | Low |
| 2.4 Success Toasts | 30 min | Low |
| 2.5 Password Visibility | 30 min | Low |
| 2.6 Dark Mode Toggle | 30 min | Low |
| 3.1 Footer Links | 30 min | Low |
| 3.2 Widget Type Tooltips | 30 min | Low |
| 3.3 Breadcrumb Navigation | 1 hour | Medium |
| 3.4 Copy Feedback Duration | 15 min | Low |
| 3.5 License Expiration Warning | 30 min | Low |
| 3.6 Accessible Labels | 15 min | Low |

**Total Estimate:** 15-20 hours

---

# ✅ Definition of Done (All Stories)

- [ ] Feature implemented and functional
- [ ] Works on desktop and mobile viewports
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Visually consistent with existing design
- [ ] Acceptance criteria verified

---

**Document Version:** 1.0
**Last Updated:** 2026-01-20

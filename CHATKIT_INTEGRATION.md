# ChatKit Integration Success Story

## 🎉 Achievement

Successfully integrated **OpenAI ChatKit** into the shared configurator architecture, achieving full visual and functional parity with the N8n configurator.

---

## The Challenge

### Initial State
- ChatKit had a **standalone configurator page** (`app/configurator/chatkit/page.tsx`)
- Hardcoded UI that bypassed the shared design system
- Missing features: embed modes, device simulation, code export
- Visual inconsistencies with the N8n configurator
- **Connection failures** when adding ChatKit credentials

### Root Issues Identified
1. **Architecture Divergence**: Standalone page vs. shared components
2. **Database Bug**: `widgetType` not being stored correctly
3. **API Integration Error**: Incorrect OpenAI SDK usage

---

## The Solution

### Phase 1: Architecture Refactoring

#### 1. Updated PreviewCanvas
**File**: `components/configurator/preview-canvas.tsx`

**Change**: Added conditional rendering based on provider
```tsx
{config.connection?.provider === 'chatkit' ? (
  <ChatKitPreview config={config} />
) : (
  <ChatPreview config={config} />
)}
```

**Result**: ChatKit widgets now have:
- ✅ Embed modes (Inline, Full Page, Popup)
- ✅ Device simulation frames
- ✅ Resize handles
- ✅ All preview features

#### 2. Enhanced ConfigSidebar
**File**: `components/configurator/config-sidebar.tsx`

**Changes**:
- Added "OpenAI ChatKit" provider option
- Created ChatKit-specific color controls:
  - Grayscale Hue (0-360°)
  - Grayscale Tint (0-20%)
  - Grayscale Shade (-4 to 4%)
  - Accent Color (hex)
  - Accent Level (0-3)
- Conditional rendering: hides N8n controls when ChatKit is selected

**Result**: Full parity with N8n configurator UI

#### 3. Replaced ChatKit Page
**File**: `app/configurator/chatkit/page.tsx`

**Action**: Deleted standalone implementation, replaced with shared configurator
```tsx
// Now uses ConfigSidebar + PreviewCanvas
<ConfigSidebar config={currentConfig} onChange={handleConfigChange} />
<PreviewCanvas config={currentConfig} />
```

**Result**: Unified codebase, easier maintenance

---

### Phase 2: Critical Bug Fixes

#### Bug #1: widgetType Not Persisting

**Problem**: All widgets defaulted to `widgetType='n8n'` in database, breaking serving logic.

**Root Cause**: `createWidget()` didn't accept `widgetType` parameter

**Fix 1** - `lib/db/queries.ts`:
```typescript
export async function createWidget(data: {
  licenseId: string;
  name: string;
  config: any;
  widgetType?: string;  // ✅ Added
  // ...
}): Promise<Widget> {
  const [widget] = await db.insert(widgets).values({
    // ...
    widgetType: data.widgetType || 'n8n',  // ✅ Set from parameter
  });
  return widget;
}
```

**Fix 2** - `app/api/widgets/route.ts`:
```typescript
const widget = await createWidget({
  licenseId,
  name,
  config: finalConfig,
  widgetType: finalConfig.connection?.provider === 'chatkit' ? 'chatkit' : 'n8n',  // ✅ Determine from config
});
```

**Result**: Widgets correctly tagged, serving logic works

---

#### Bug #2: OpenAI SDK Integration Error

**Problem**: 500 error when creating ChatKit session
```
Error: Cannot read properties of undefined (reading 'sessions')
```

**Root Cause**: Attempted to use `openai.chatkit.sessions.create()`, which **doesn't exist** in the OpenAI Node.js SDK.

**Original Code** (WRONG):
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: openaiApiKey });
const session = await openai.chatkit.sessions.create({  // ❌ chatkit namespace doesn't exist
  workflow: { id: workflowId },
  user: { id: userId },
});
```

**Fix** - `app/api/chatkit/create-session/route.ts`:
```typescript
// ✅ Use direct fetch to ChatKit API (like the official starter app)
const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`,
    'OpenAI-Beta': 'chatkit_beta=v1',  // ✅ Required header
  },
  body: JSON.stringify({
    workflow: { id: targetWorkflowId },
    user: 'user_' + Math.random().toString(36).substring(7),  // ✅ String, not object
  }),
});
```

**Result**: Sessions created successfully

---

#### Bug #3: User Parameter Format

**Problem**: 400 error - "Invalid type for 'user': expected a string, but got an object instead."

**Root Cause**: PayloadWas sending `user: { id: "..." }` instead of `user: "..."`

**Fix**:
```typescript
// Before (WRONG)
user: { id: 'user_123' }

// After (CORRECT)
user: 'user_123'
```

**Result**: API accepts requests, widget loads

---

## Architecture Overview

### End-to-End Flow

```
User → /configurator/chatkit
  ↓
Creates Agent (provider='chatkit')
  ↓
ConfigSidebar (ChatKit controls shown)
  ↓
Enters: workflowId + apiKey
  ↓
PreviewCanvas (renders ChatKitPreview)
  ↓
ChatKitPreview → /api/chatkit/create-session (preview mode)
  ↓
API → fetch('https://api.openai.com/v1/chatkit/sessions')
  ↓
Returns: client_secret
  ↓
ChatKit Widget Initializes
  ↓
✅ Success!
```

### Production Flow

```
User embeds widget on website
  ↓
Script requests: /api/widget/{license}/chat-widget.js
  ↓
Server checks widgetType from database
  ↓
If widgetType='chatkit':
  Serves iframe script → /widget/chatkit/{license}
  ↓
Page renders ChatKitEmbed
  ↓
ChatKitEmbed → /api/chatkit/create-session (production mode)
  ↓
API fetches config from database
  ↓
Uses stored workflowId + apiKey
  ↓
Creates session, returns client_secret
  ↓
Widget loads on user's website
```

---

## Key Files Modified

### Shared Components
- [`components/configurator/preview-canvas.tsx`](components/configurator/preview-canvas.tsx) - Conditional ChatKit rendering
- [`components/configurator/config-sidebar.tsx`](components/configurator/config-sidebar.tsx) - ChatKit provider + controls
- [`components/configurator/chatkit-preview.tsx`](components/configurator/chatkit-preview.tsx) - Preview widget

### Database & API
- [`lib/db/queries.ts`](lib/db/queries.ts) - Added `widgetType` parameter
- [`app/api/widgets/route.ts`](app/api/widgets/route.ts) - Set `widgetType` on creation
- [`app/api/chatkit/create-session/route.ts`](app/api/chatkit/create-session/route.ts) - Fixed session creation

### Pages
- [`app/configurator/chatkit/page.tsx`](app/configurator/chatkit/page.tsx) - Replaced with shared architecture

---

## Git Commits

1. **`947bb8e`** - feat: Refactor ChatKit to shared architecture with critical widgetType fix
2. **`b100552`** - debug: Add detailed error logging to ChatKit session creation
3. **`fd6bbc8`** - fix: Use direct fetch API for ChatKit session creation
4. **`37a163b`** - fix: ChatKit user parameter should be string, not object

---

## Testing Checklist

### Preview Mode
- [x] Navigate to `/configurator/chatkit`
- [x] Create new agent
- [x] Enter OpenAI Workflow ID
- [x] Enter OpenAI API Key
- [x] Verify widget loads in preview
- [x] Test theme controls (Grayscale, Accent)
- [x] Switch embed modes (Inline, Full, Popup)
- [x] Verify device simulation works

### Production Mode
- [ ] Generate embed code
- [ ] Test on external website
- [ ] Verify widget loads from database config
- [ ] Test session creation without preview mode
- [ ] Verify domain validation works

---

## Lessons Learned

### 1. Check Official Examples First
The OpenAI ChatKit starter app showed the correct API integration pattern. When the SDK doesn't work, check if there's a direct API alternative.

### 2. Database Schema Matters
The `widgetType` column was correctly defined in the schema but wasn't being used during creation. Always trace data flow from UI to database.

### 3. API Contracts Are Strict
ChatKit API expected:
- `user` as string, not object
- `OpenAI-Beta: chatkit_beta=v1` header
- Direct endpoint, not SDK method

### 4. Shared Architecture Wins
By refactoring to shared components, we gained:
- Feature parity automatically
- Easier maintenance
- Consistent UX
- Reduced code duplication

---

## Next Steps

### Enhancements
- [ ] Add user ID persistence (currently random)
- [ ] Support `chatkit_configuration` options (file upload, etc.)
- [ ] Implement custom prompts configuration
- [ ] Add ChatKit-specific analytics

### Testing
- [ ] Deploy to production
- [ ] Test on multiple domains
- [ ] Verify license limits work for ChatKit
- [ ] Load testing for session creation

---

## Resources

- [OpenAI ChatKit Documentation](https://platform.openai.com/docs/assistants/chatkit)
- [ChatKit Starter App](openai-chatkit-starter-app/)
- [Widget Store Schema](stores/widget-store.ts)
- [Database Schema](lib/db/schema.ts)

---

**Status**: ✅ ChatKit is fully operational in preview mode!

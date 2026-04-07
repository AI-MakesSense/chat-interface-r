# Widget Final Push: Implementation Plan

This document outlines the complete plan to integrate the "Agent Builder" (AgentKit) and N8n workflows into the Configurator, Preview, and Live Widget.

## 1. Data Model & Store Updates
**Goal**: Unify the `WidgetConfig` interface across the application to support both N8n and AgentKit.

### A. Update `stores/widget-store.ts`
Modify the `WidgetConfig` interface to include the new connection fields and feature flags.

```typescript
export interface WidgetConfig {
  // ... existing fields ...
  connection: {
    // Provider Selection
    provider: 'n8n' | 'agentkit'; // New field for mutual exclusivity
    
    // N8n Config
    webhookUrl?: string; // Made optional
    
    // AgentKit Config
    agentKitWorkflowId?: string;
    agentKitApiKey?: string; // Note: Handle securely
  };
  // ... existing fields ...
}
```

### B. Database Schema
*   Ensure the database JSON column for `config` can accept these new fields (usually automatic for JSON columns, but good to verify).

---

## 2. Configurator UI Porting
**Goal**: Move the modern UI from `chat-widget-playground` to the main app `app/configurator/page.tsx`.

### A. Port `Sidebar` Logic
*   Replace the current "Connection" card in `app/configurator/page.tsx` with the new "Connect" section from the playground.
*   Implement **Mutual Exclusivity**:
    *   Use a `RadioGroup` or smart Toggles where selecting one provider automatically deselects the other.
    *   Update `updateConfig` calls to set `connection.provider` accordingly.

### B. Port Styling Options
*   Add the new styling controls (Tinted Grayscale, Custom Fonts, Density, Radius) to the "Theme & Colors" section of the Configurator.

---

## 3. Backend Relay Logic (`app/api/chat-relay/route.ts`)
**Goal**: Route messages to the correct provider based on the widget configuration.

### A. Implement Routing Logic
```typescript
// Pseudo-code for new route.ts
const config = widget.config;
const provider = config.connection.provider || 'n8n'; // Default to n8n

if (provider === 'n8n') {
  // ... Existing N8n Logic ...
  const webhookUrl = config.connection.webhookUrl;
  // Send to N8n
} else if (provider === 'agentkit') {
  // ... New AgentKit Logic ...
  const workflowId = config.connection.agentKitWorkflowId;
  const apiKey = config.connection.agentKitApiKey;
  
  // Call AgentKit/OpenAI API
  // Endpoint: https://api.agentkit.ai/v1/chat (Example - need to confirm actual endpoint)
  // Headers: Authorization: Bearer <apiKey>
  // Body: { workflowId, message, sessionId }
}
```

### B. Security
*   **Crucial**: The `agentKitApiKey` should be stored in the database but **NEVER** sent to the client-side widget.
*   The Relay endpoint will read the API Key from the database (via `getWidgetById`) and use it server-side.

---

## 4. Widget & Preview Implementation

### A. Update `components/configurator/preview-frame.tsx`
*   **Styling**: Update the `getPreviewHTML` function to generate CSS based on the new styling fields (tinted grayscale, etc.).
*   **Logic**:
    *   Update the `sendMessage` function in the injected script.
    *   Instead of hardcoding the fetch to `webhookUrl`, it should **always** send to the **Relay Endpoint** (or a mocked internal handler for preview).
    *   If using the Relay for preview: Ensure the preview sends a temporary `widgetId` that the Relay accepts (or mock the response client-side if we don't want to spam the real API during preview).
    *   **Recommendation**: For the *Preview*, mock the response client-side (like the playground does) OR allow the user to "Test Connection" which hits the real API.

### B. Update `widget/src/index.ts`
*   Ensure the widget sends the correct payload to the Relay.
*   The widget doesn't need to know *which* provider is used; it just sends `{ message, sessionId, widgetId }` to the Relay. The Relay handles the rest.

---

## 5. Execution Steps

1.  **Modify Store**: Update `stores/widget-store.ts` with new types.
2.  **Update Configurator**: Edit `app/configurator/page.tsx` to add the new UI inputs.
3.  **Update Relay**: Rewrite `app/api/chat-relay/route.ts` to handle both providers.
4.  **Update Preview**: Enhance `preview-frame.tsx` to support new styles.
5.  **Verify**: Test both N8n and AgentKit flows.

---

## 6. Questions / Clarifications Needed
*   **AgentKit API Endpoint**: What is the exact URL and payload format for the "Agent Builder" / "AgentKit" API?
*   **ChatKit**: Is "ChatKit" just the UI library, or is there a backend SDK we should be using? (Assuming UI library based on context).

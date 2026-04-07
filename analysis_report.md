# Analysis Report: Configurator UI & Agent Logic

## Executive Summary
The review covers the current state of the `app/configurator` (Main App) and the `chat-widget-playground` (Prototype/New UI). 

**Status**: The "New UI" with AgentKit support exists only in the **Playground** environment. The **Main App** currently only supports N8n. The logic for connecting to AgentKit/OpenAI is **not implemented** in either the backend or the preview component; it is currently a UI-only prototype.

---

## 1. UI Review (Configurator & Playground)

### A. Main App (`app/configurator/page.tsx`)
*   **Current State**: Only supports "N8n Webhook URL".
*   **Missing Features**: No option to select "Agent Builder" or "OpenAI Agent".
*   **Data Model**: The `WidgetConfig` store only has `connection.webhookUrl`.

### B. Playground (`chat-widget-playground`)
This appears to be the "New UI" you are working on.
*   **Visuals**: Excellent customization options (Themes, Tinted Grayscale, Custom Fonts, etc.).
*   **"Connect" Section**:
    *   Successfully adds UI for **AgentKit** (Workflow ID, API Key).
    *   Successfully adds UI for **N8n** (Webhook URL).

### C. UI Bugs & Issues (Playground)
1.  **Lack of Mutual Exclusivity**:
    *   **Issue**: A user can toggle **ON** both "N8n" and "AgentKit" at the same time.
    *   **Impact**: Ambiguity in which service handles the chat.
    *   **Recommendation**: Toggling one ON should automatically toggle the other OFF.
2.  **Security Concern**:
    *   **Issue**: `agentKitApiKey` is handled in the client-side state.
    *   **Impact**: If this config is saved directly to the database or embedded in the widget code without encryption/proxying, it exposes the API Key.
    *   **Recommendation**: Ensure the API Key is never exposed to the client-side widget. It should be stored securely in the backend and used only by the `chat-relay`.
3.  **Terminology**:
    *   **Observation**: The UI uses "AgentKit", but your request mentioned "Agent Builder" or "OpenAI Agent".
    *   **Recommendation**: Standardize naming across the UI and Codebase.

---

## 2. Logic & Backend Review

### A. Preview Logic (`ChatWidget.tsx`)
*   **Status**: **Mocked Only**.
*   **Issue**: The `ChatWidget` component in the playground uses a `setTimeout` to simulate a response. It **does not** use the `n8nWebhookUrl` or `agentKitWorkflowId` to actually send messages.
*   **Impact**: You cannot test the actual agent connection in the playground currently.

### B. Backend Logic (`app/api/chat-relay/route.ts`)
*   **Status**: **N8n Only**.
*   **Issue**: The current route explicitly looks for `webhookUrl` and constructs an N8n payload.
    ```typescript
    // Current Code
    const webhookUrl = config?.connection?.webhookUrl;
    // ...
    // Construct N8n Payload
    ```
*   **Missing Logic**:
    *   No handling for `agentKitWorkflowId`.
    *   No branching logic to decide whether to send to N8n or AgentKit.
    *   No integration with OpenAI/AgentKit APIs.

### C. Data Model (`stores/widget-store.ts`)
*   **Status**: Outdated.
*   **Issue**: The `WidgetConfig` interface in the main app does not match the `WidgetConfig` in the playground.
    *   Missing: `enableN8n`, `enableAgentKit`, `agentKitWorkflowId`, `agentKitApiKey`.

---

## 3. Implementation Roadmap
To fully realize the "Agent Builder" integration, the following steps are required:

1.  **Update Data Model**:
    *   Update `stores/widget-store.ts` (and database schema) to include the new fields from the playground.
2.  **Port UI**:
    *   Move the `Sidebar` logic from `chat-widget-playground` to `app/configurator/page.tsx`.
    *   Implement the mutual exclusivity logic for the toggles.
3.  **Implement Backend Logic**:
    *   Update `app/api/chat-relay/route.ts` to:
        *   Check which provider is enabled.
        *   If N8n: Use existing logic.
        *   If AgentKit: Call the AgentKit/OpenAI API using the stored credentials.
4.  **Secure API Keys**:
    *   Ensure `agentKitApiKey` is encrypted or stored securely, and NOT sent to the client-side widget bundle. The relay should handle authentication.

---

## 4. Conclusion
The UI work in the playground is a great start visually, but the **functional logic is completely missing**, and the **Main App is currently unaware** of these new capabilities. The immediate next step should be porting the Data Model and UI to the Main App, followed by implementing the Backend Relay logic.

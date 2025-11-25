# Widget Final Push: Progress Tracker

This document tracks the step-by-step progress of integrating AgentKit and N8n into the Configurator, Preview, and Live Widget.

## Phase 0: Refactor & Prep (Crucial for Maintainability)
- [x] **Refactor `app/configurator/page.tsx`**
    - [x] Extract "Branding" card to `components/configurator/branding-card.tsx`.
    - [x] Extract "Theme & Colors" card to `components/configurator/theme-card.tsx`.
    - [x] Extract "Connection" card to `components/configurator/connection-card.tsx`.
    - [x] Ensure state is passed correctly (or use the store hook inside components).

## Phase 1: Data Model & Store
- [x] **Update `WidgetConfig` Interface** (`stores/widget-store.ts`)
    - [x] Add `connection.provider` ('n8n' | 'agentkit').
    - [x] Add `connection.agentKitWorkflowId` and `connection.agentKitApiKey`.
    - [x] Make `connection.webhookUrl` optional.
    - [x] Add new style fields: `tintHue`, `tintLevel`, `shadeLevel`, `customFontName`, `customFontCss`, `density`, `radius`.
- [x] **Sync Types with Widget** (`widget/src/types.ts`)
    - [x] Update `WidgetConfig` and `StyleConfig` in the widget package to match the store.
- [x] **Update Default Config**
    - [x] Set default provider to 'n8n'.
    - [x] Initialize new fields with safe defaults.

## Phase 2: Configurator UI (Porting from Playground)
- [x] **Implement `ConnectionCard`**
    - [x] Create a "Provider Selector" (Radio Group or Tabs).
    - [x] **N8n Mode**: Show Webhook URL input.
    - [x] **AgentKit Mode**: Show Workflow ID and API Key inputs.
    - [x] **Validation**: Disable "Save" if the selected provider's fields are empty.
- [x] **Implement `ThemeCard`**
    - [x] Add "Tinted Grayscale" toggle and sliders (Hue, Tint, Shade).
    - [x] Add "Custom Fonts" section (Font Family, Import URL).
    - [x] Add "Density" and "Radius" dropdowns.
- [ ] **Implement `StartScreenCard`**
    - [ ] Add "Starter Prompts" editor (List of prompts with icons).

## Phase 3: Backend Relay Logic
- [x] **Update `app/api/chat-relay/route.ts`**
    - [x] Read `widget.config.connection.provider`.
    - [x] **Branch Logic**:
        - [x] **Case N8n**: Keep existing logic (send to `webhookUrl`).
        - [x] **Case AgentKit (OpenAI Assistants)**:
            - [x] Extract `agentKitWorkflowId` (Assistant ID) and `agentKitApiKey`.
            - [x] **Session Management**:
                - [x] Check for existing `threadId` in the request (client should store this).
                - [x] If no thread, create one via OpenAI API (`POST /v1/threads`).
            - [x] **Message Handling**:
                - [x] Add user message to thread (`POST /v1/threads/{threadId}/messages`).
                - [x] Run the Assistant (`POST /v1/threads/{threadId}/runs`).
                - [x] Poll for completion (or use streaming if supported/implemented).
                - [x] Retrieve assistant response.
            - [x] Return response to widget (standardized format).

## Phase 4: Preview Frame Updates
- [x] **Update `components/configurator/preview-frame.tsx`**
    - [x] **CSS Generation**: Update `getPreviewHTML` to generate CSS variables for new styles (Tinted Grayscale, Density, Radius).
    - [x] **Mock Logic**: Update the injected script's `sendMessage` function.
        - [x] If in Preview Mode, mock the response locally (or provide a "Test" button to hit the real relay).
        - [x] Ensure it respects the selected provider (e.g., different mock messages for AgentKit vs N8n).

## Phase 5: Widget Bundle Updates
- [x] **Update `widget/src/index.ts`**
    - [x] Ensure `runtimeConfig` correctly passes `widgetId` and `licenseKey` to the relay.
    - [x] Verify the widget receives and applies new styles without client-side changes.
- [x] **Thread Persistence (AgentKit)**
    - [x] Update `SessionManager` to store and retrieve `threadId`.
    - [x] Update `MessageSender` to include `threadId` in payload.
    - [x] Extract `threadId` from relay response and persist it.

## Phase 6: Verification & Polish
- [ ] **Backward Compatibility Check**: Ensure existing N8n widgets (which lack the `provider` field) default gracefully to 'n8n'.
- [ ] **Test N8n Flow**: Verify an existing N8n widget still works.
- [ ] **Test AgentKit Flow**: Verify a new AgentKit widget connects and sends messages.
- [ ] **Test UI**: Verify all new styling options reflect correctly in the preview.
- [ ] **Security Check**: Verify `agentKitApiKey` is NOT present in the client-side `window.ChatWidgetConfig` or network requests (except to the Relay).

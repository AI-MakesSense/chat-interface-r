import type { WidgetRuntimeConfig } from '../../types';
import type { FileAttachment } from './types';

export interface RelayPayloadOptions {
  message: string;
  sessionId: string;
  threadId?: string; // For AgentKit session persistence
  context?: Record<string, any>;
  customContext?: Record<string, any>;
  attachments?: FileAttachment[];
  extraInputs?: Record<string, any>;
}

/**
 * Request payload sent to the chat relay API
 *
 * Authentication:
 * - widgetKey (PREFERRED): Secure, scoped to single widget
 * - licenseKey (LEGACY): Kept for backward compatibility
 */
export interface RelayRequestPayload {
  widgetId?: string;        // Required when using licenseKey, optional with widgetKey
  widgetKey?: string;       // Preferred: secure widget-scoped authentication
  licenseKey?: string;      // Legacy: kept for backward compatibility
  message: string;
  chatInput: string;
  sessionId: string;
  threadId?: string;        // For AgentKit session persistence
  context?: Record<string, any>;
  customContext?: Record<string, any>;
  attachments?: FileAttachment[];
  extraInputs?: Record<string, any>;
}

/**
 * Builds the payload the relay API expects by combining runtime config metadata
 * with the caller-provided options.
 *
 * Security: Uses widgetKey when available (preferred), falls back to licenseKey for
 * backward compatibility with older widget bundles.
 */
export function buildRelayPayload(
  runtimeConfig: WidgetRuntimeConfig,
  options: RelayPayloadOptions
): RelayRequestPayload {
  const relay = runtimeConfig.relay;
  const uiConnection = runtimeConfig.uiConfig.connection;

  // Build base payload
  const payload: RelayRequestPayload = {
    message: options.message,
    chatInput: options.message, // Duplicate message as chatInput for n8n compatibility
    sessionId: options.sessionId,
    threadId: options.threadId, // Include threadId for AgentKit
    context: options.context,
    customContext: options.customContext ?? uiConnection?.customContext,
    attachments: options.attachments,
    extraInputs: options.extraInputs ?? uiConnection?.extraInputs,
  };

  // Authentication: prefer widgetKey over licenseKey for security
  if (relay.widgetKey) {
    // New secure method: widgetKey is scoped to single widget
    payload.widgetKey = relay.widgetKey;
    // widgetId is optional when using widgetKey (server derives it)
  } else {
    // Legacy method: licenseKey + widgetId
    payload.widgetId = relay.widgetId;
    payload.licenseKey = relay.licenseKey;
  }

  return payload;
}

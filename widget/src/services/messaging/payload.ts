import type { WidgetRuntimeConfig } from '../../types';
import type { FileAttachment } from './types';

export interface RelayPayloadOptions {
  message: string;
  sessionId: string;
  context?: Record<string, any>;
  customContext?: Record<string, any>;
  attachments?: FileAttachment[];
  extraInputs?: Record<string, any>;
}

export interface RelayRequestPayload {
  widgetId: string;
  licenseKey: string;
  message: string;
  chatInput: string;
  sessionId: string;
  context?: Record<string, any>;
  customContext?: Record<string, any>;
  attachments?: FileAttachment[];
  extraInputs?: Record<string, any>;
}

/**
 * Builds the payload the relay API expects by combining runtime config metadata
 * with the caller-provided options.
 */
export function buildRelayPayload(
  runtimeConfig: WidgetRuntimeConfig,
  options: RelayPayloadOptions
): RelayRequestPayload {
  const relay = runtimeConfig.relay;
  const uiConnection = runtimeConfig.uiConfig.connection;

  return {
    widgetId: relay.widgetId,
    licenseKey: relay.licenseKey,
    message: options.message,
    chatInput: options.message, // Duplicate message as chatInput for n8n compatibility
    sessionId: options.sessionId,
    context: options.context,
    customContext: options.customContext ?? uiConnection?.customContext,
    attachments: options.attachments,
    extraInputs: options.extraInputs ?? uiConnection?.extraInputs,
  };
}
